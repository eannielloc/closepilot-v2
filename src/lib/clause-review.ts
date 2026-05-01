// AI Clause Review — analyzes a parsed contract for risks and unusual terms.
// Falls back to a heuristic mock when no Anthropic API key is configured.

import Anthropic from "@anthropic-ai/sdk"
import type { ParsedContract } from "./mock-parser"

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || ""
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929"

export type Severity = "info" | "low" | "medium" | "high"

export interface ClauseFlag {
  severity: Severity
  category: string
  title: string
  detail: string
  recommendation: string
}

export interface ClauseReview {
  summary: string
  flags: ClauseFlag[]
  generatedAt: string
  source: "ai" | "heuristic"
}

let _client: Anthropic | null = null
function client(): Anthropic | null {
  if (!ANTHROPIC_API_KEY) return null
  if (!_client) _client = new Anthropic({ apiKey: ANTHROPIC_API_KEY })
  return _client
}

const REVIEW_PROMPT = `You are a senior real estate transaction coordinator reviewing a purchase contract for risks the buyer's agent should know about.

You will be given parsed contract data as JSON. Identify ALL of the following kinds of issues:
- Aggressive timelines (attorney review under 5 business days, mortgage commitment under 30 days)
- Heavy seller concessions (>3% of purchase price)
- High loan-to-value ratios (>97%)
- Missing standard contingencies (inspection, financing, attorney review)
- Closing date that lands on a weekend or holiday
- Unusually small or large earnest money deposits (<1% or >10%)
- Time-of-essence clauses without buffer
- Anything else worth flagging

Return ONLY valid JSON of this exact shape — no prose, no markdown fences:

{
  "summary": "1-2 sentence overall assessment",
  "flags": [
    {
      "severity": "info" | "low" | "medium" | "high",
      "category": "timeline" | "financing" | "contingency" | "deposit" | "concession" | "other",
      "title": "Short headline",
      "detail": "1-2 sentence explanation of the issue",
      "recommendation": "Concrete action the agent should take"
    }
  ]
}

Aim for 3-7 flags. If everything checks out, return an empty flags array with a positive summary.`

function extractJson(text: string): unknown {
  const trimmed = text.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  return JSON.parse(fenced ? fenced[1] : trimmed)
}

export async function reviewContract(parsed: ParsedContract): Promise<ClauseReview> {
  const c = client()
  if (!c) {
    return heuristicReview(parsed)
  }
  try {
    const resp = await c.messages.create({
      model: MODEL,
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: REVIEW_PROMPT },
            { type: "text", text: "Contract data:\n" + JSON.stringify(parsed, null, 2) },
          ],
        },
      ],
    })
    const block = resp.content.find((b) => b.type === "text")
    if (!block || block.type !== "text") throw new Error("No text in response")
    const data = extractJson(block.text) as Omit<ClauseReview, "generatedAt" | "source">
    return { ...data, generatedAt: new Date().toISOString(), source: "ai" }
  } catch (err) {
    console.error("[clause-review] AI failed, using heuristic:", err)
    return heuristicReview(parsed)
  }
}

// Heuristic fallback. Real, useful flags computed from the parsed data without any AI.
function heuristicReview(p: ParsedContract): ClauseReview {
  const flags: ClauseFlag[] = []
  const eff = new Date(p.effectiveDate)
  const close = new Date(p.closingDate)
  const totalDays = Math.round((close.getTime() - eff.getTime()) / (1000 * 60 * 60 * 24))

  // Attorney review window
  if (p.keyDates.attorneyReviewDeadline) {
    const ar = new Date(p.keyDates.attorneyReviewDeadline)
    const arDays = Math.round((ar.getTime() - eff.getTime()) / (1000 * 60 * 60 * 24))
    if (arDays < 5) {
      flags.push({
        severity: "high",
        category: "timeline",
        title: `Attorney review only ${arDays} days`,
        detail: `Attorney review deadline of ${p.keyDates.attorneyReviewDeadline} is just ${arDays} days from effective date. CT standard is 5 business days.`,
        recommendation: "Confirm with attorney that this window is workable. If not, request an extension via amendment.",
      })
    }
  }

  // Mortgage commitment timing
  if (p.keyDates.mortgageCommitmentDeadline) {
    const mc = new Date(p.keyDates.mortgageCommitmentDeadline)
    const mcDays = Math.round((mc.getTime() - eff.getTime()) / (1000 * 60 * 60 * 24))
    if (mcDays < 30) {
      flags.push({
        severity: "medium",
        category: "financing",
        title: `Tight mortgage commitment: ${mcDays} days`,
        detail: `Lender commitment due in ${mcDays} days from effective. Lenders typically need 30-45 days.`,
        recommendation: "Push lender for fast turnaround on appraisal and underwriting. Have backup lender ready.",
      })
    }
  }

  // LTV check
  if (p.financials.mortgageAmount && p.financials.purchasePrice) {
    const ltv = p.financials.mortgageAmount / p.financials.purchasePrice
    if (ltv > 0.97) {
      flags.push({
        severity: "medium",
        category: "financing",
        title: `Very high LTV: ${(ltv * 100).toFixed(0)}%`,
        detail: `Mortgage of $${p.financials.mortgageAmount.toLocaleString()} is ${(ltv * 100).toFixed(0)}% of purchase price. Limited margin if appraisal comes in low.`,
        recommendation: "Discuss appraisal gap coverage with buyer. Consider FHA/VA paths if conventional becomes risky.",
      })
    }
  }

  // Earnest money percentage
  if (p.financials.depositAmount && p.financials.purchasePrice) {
    const pct = p.financials.depositAmount / p.financials.purchasePrice
    if (pct < 0.01) {
      flags.push({
        severity: "low",
        category: "deposit",
        title: "Earnest money below 1%",
        detail: `Initial deposit of $${p.financials.depositAmount.toLocaleString()} is only ${(pct * 100).toFixed(2)}% of purchase price.`,
        recommendation: "Buyer may appear weak vs competing offers. Consider increasing if escalating.",
      })
    } else if (pct > 0.1) {
      flags.push({
        severity: "low",
        category: "deposit",
        title: "Unusually large earnest money",
        detail: `Initial deposit of $${p.financials.depositAmount.toLocaleString()} is ${(pct * 100).toFixed(0)}% of purchase price.`,
        recommendation: "Confirm buyer is comfortable with the at-risk amount before contingencies are removed.",
      })
    }
  }

  // Seller concession
  if (p.financials.sellerConcession) {
    const match = p.financials.sellerConcession.match(/(\d+(?:\.\d+)?)\s*%/)
    const pct = match ? parseFloat(match[1]) : 0
    if (pct >= 3) {
      flags.push({
        severity: "medium",
        category: "concession",
        title: `${pct}% seller concession`,
        detail: `Concession of "${p.financials.sellerConcession}" — verify lender allows this amount and that appraisal supports the inflated price.`,
        recommendation: "Run the concession by buyer's lender before going firm. Document reason in case appraisal questions arise.",
      })
    }
  }

  // Closing date sanity
  const closeDay = close.getUTCDay()
  if (closeDay === 0 || closeDay === 6) {
    flags.push({
      severity: "high",
      category: "timeline",
      title: "Closing scheduled on a weekend",
      detail: `Closing date ${p.closingDate} falls on a ${closeDay === 0 ? "Sunday" : "Saturday"}. Title companies and lenders typically don't fund.`,
      recommendation: "Adjust to nearest business day via amendment immediately.",
    })
  }

  // Missing standard contingencies
  const hasInspection = p.contingencies.some((c) => /inspection/i.test(c))
  if (!hasInspection) {
    flags.push({
      severity: "high",
      category: "contingency",
      title: "No inspection contingency",
      detail: "Contract appears to waive the inspection contingency. This is a significant buyer risk.",
      recommendation: "Verify with buyer this was intentional. If not, request an amendment immediately.",
    })
  }

  // Total contract length
  if (totalDays < 21) {
    flags.push({
      severity: "medium",
      category: "timeline",
      title: `${totalDays}-day contract is aggressive`,
      detail: `Effective to closing is only ${totalDays} days. Tight for due diligence + financing.`,
      recommendation: "Build a parallel-path checklist so inspection, title, and lender all kick off Day 1.",
    })
  }

  const summary = flags.length === 0
    ? "Contract looks clean — no material risks flagged. Standard timelines and financing structure."
    : `Identified ${flags.length} item${flags.length === 1 ? "" : "s"} worth attention before going firm.`

  return { summary, flags, generatedAt: new Date().toISOString(), source: "heuristic" }
}
