// Plain-English explanations of CT real estate milestones for the
// buyer/seller-facing portal. Maps milestone `type` to an icon + short
// "what this is" + "what you should do" copy so non-experts aren't lost.

export interface Explanation {
  whatItIs: string
  whatYouNeedToDo: string
}

const TYPE_MAP: Record<string, Explanation> = {
  deposit: {
    whatItIs: "A deposit (also called earnest money) shows the seller you're serious. It's held in escrow and applied toward closing costs.",
    whatYouNeedToDo: "Wire or deliver a check to the listing brokerage or escrow agent by the due date. Your agent will send you wiring instructions.",
  },
  attorney_review: {
    whatItIs: "Your attorney reviews the contract and can request changes. After this date, the contract is firm — changes are much harder.",
    whatYouNeedToDo: "If you don't have an attorney yet, ask your agent for a referral now. Send them the contract today.",
  },
  inspection: {
    whatItIs: "A licensed home inspector walks the property and reports defects. You can negotiate repairs, credits, or back out based on findings.",
    whatYouNeedToDo: "Schedule the inspection ASAP — most book up days in advance. Plan to attend so the inspector can walk you through findings.",
  },
  title: {
    whatItIs: "Title search confirms the seller can legally sell you the property and that there are no liens, easements, or claims that follow.",
    whatYouNeedToDo: "Nothing on your end — your title company / attorney handles this. They'll flag any issues that need fixing before closing.",
  },
  loan_approval: {
    whatItIs: "Your lender's final approval that they will fund the mortgage. Without it by this deadline, the contract may give you the right to walk.",
    whatYouNeedToDo: "Respond fast to any document requests from your lender. Don't open new credit lines, change jobs, or make large purchases until after closing.",
  },
  appraisal: {
    whatItIs: "An independent appraiser confirms the property is worth at least the loan amount. Required by your lender.",
    whatYouNeedToDo: "Your lender orders this — no action needed. If it comes in low, your agent will discuss options (renegotiate, gap coverage, etc.).",
  },
  closing: {
    whatItIs: "The day you sign final docs and receive keys. Funds transfer, deeds are recorded, the property is yours.",
    whatYouNeedToDo: "Bring photo ID, a cashier's check (or wire confirmation) for closing funds, and any docs your attorney requests. Plan ~1-2 hours.",
  },
  other: {
    whatItIs: "A scheduled milestone or task that affects your transaction.",
    whatYouNeedToDo: "Check with your agent if you're unsure of any action needed.",
  },
}

// Specific name overrides for common CT milestones
const NAME_OVERRIDES: Array<{ pattern: RegExp; explanation: Explanation }> = [
  {
    pattern: /final walkthrough/i,
    explanation: {
      whatItIs: "A short walk-through of the property (typically the day before closing) to verify it's in the agreed condition and seller has moved out.",
      whatYouNeedToDo: "Show up. Test outlets, water, appliances, HVAC. Confirm any negotiated repairs are done. Flag issues to your agent immediately.",
    },
  },
  {
    pattern: /radon/i,
    explanation: {
      whatItIs: "A short test (usually 48 hours) to measure radon gas levels in the basement. Common in CT due to the geology.",
      whatYouNeedToDo: "Nothing — your inspector handles it. If results are above 4 pCi/L, you can request mitigation as a condition of sale.",
    },
  },
  {
    pattern: /mortgage commitment/i,
    explanation: TYPE_MAP.loan_approval,
  },
]

export function explainMilestone(name: string, type: string): Explanation {
  const override = NAME_OVERRIDES.find((o) => o.pattern.test(name))
  if (override) return override.explanation
  return TYPE_MAP[type] || TYPE_MAP.other
}
