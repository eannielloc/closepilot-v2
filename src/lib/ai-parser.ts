import Anthropic from "@anthropic-ai/sdk"
import { promises as fs } from "fs"
import { mockParseContract, mockParseSignedDocument, type ParsedContract } from "./mock-parser"

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || ""
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929"

let _client: Anthropic | null = null
function client(): Anthropic | null {
  if (!ANTHROPIC_API_KEY) return null
  if (!_client) _client = new Anthropic({ apiKey: ANTHROPIC_API_KEY })
  return _client
}

const PARSE_PROMPT = `You are a real estate contract parsing assistant. Extract structured data from this purchase agreement PDF.

Return ONLY valid JSON matching this exact TypeScript shape (no prose, no markdown fences):

{
  "contractType": string,
  "propertyAddress": string,
  "purchasePrice": number,
  "effectiveDate": "YYYY-MM-DD",
  "closingDate": "YYYY-MM-DD",
  "buyer": { "name": string, "address"?: string },
  "seller": { "name": string, "address"?: string },
  "listingAgent"?: { "name": string, "firm": string, "phone"?: string, "email"?: string },
  "buyersAgent"?: { "name": string, "firm": string, "phone"?: string, "email"?: string },
  "financials": {
    "purchasePrice": number,
    "depositAmount": number,
    "depositDueDate": "YYYY-MM-DD",
    "additionalDeposit"?: number,
    "additionalDepositDue"?: "YYYY-MM-DD",
    "mortgageAmount"?: number,
    "sellerConcession"?: string
  },
  "keyDates": {
    "effectiveDate": "YYYY-MM-DD",
    "depositDue": "YYYY-MM-DD",
    "attorneyReviewDeadline": "YYYY-MM-DD",
    "inspectionDeadline": "YYYY-MM-DD",
    "inspectionObjectionDeadline"?: "YYYY-MM-DD",
    "titleSearchCompletion"?: "YYYY-MM-DD",
    "titleObjectionDeadline"?: "YYYY-MM-DD",
    "mortgageCommitmentDeadline": "YYYY-MM-DD",
    "closingDate": "YYYY-MM-DD"
  },
  "contingencies": string[],
  "milestones": [{ "date": "YYYY-MM-DD", "name": string, "type": string }]
}

Rules:
- Return strictly the JSON object. No leading or trailing text.
- All dates must be ISO YYYY-MM-DD.
- If a date cannot be determined from the document, omit the optional field; for required dates, use the closing date as a fallback.
- Numbers should be plain integers or decimals — no $ signs, no commas.
- The milestones array must include at least these entries derived from keyDates: deposit due, attorney review deadline, inspection deadline, mortgage commitment deadline, closing.`

function extractJson(text: string): any {
  const trimmed = text.trim()
  // Strip ``` fences if present
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  const candidate = fenced ? fenced[1] : trimmed
  return JSON.parse(candidate)
}

export async function parseContractPdf(filePath: string, opts?: { fallbackOnError?: boolean }): Promise<ParsedContract> {
  const c = client()
  if (!c) {
    console.warn("[ai-parser] ANTHROPIC_API_KEY not set — returning mock data")
    return mockParseContract()
  }
  try {
    const buf = await fs.readFile(filePath)
    const base64 = buf.toString("base64")
    const resp = await c.messages.create({
      model: MODEL,
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: { type: "base64", media_type: "application/pdf", data: base64 },
            },
            { type: "text", text: PARSE_PROMPT },
          ],
        },
      ],
    })
    const textBlock = resp.content.find((b: any) => b.type === "text") as any
    if (!textBlock?.text) throw new Error("No text in Claude response")
    const parsed = extractJson(textBlock.text) as ParsedContract
    return parsed
  } catch (err: any) {
    console.error("[ai-parser] parse failed:", err.message)
    if (opts?.fallbackOnError !== false) return mockParseContract()
    throw err
  }
}

export async function parseSignedDocumentPdf(
  filePath: string,
  docName: string,
  allSessions: any[],
  opts?: { fallbackOnError?: boolean }
): Promise<any> {
  const c = client()
  if (!c) {
    console.warn("[ai-parser] ANTHROPIC_API_KEY not set — returning mock signed doc data")
    return mockParseSignedDocument(docName, allSessions)
  }
  try {
    const buf = await fs.readFile(filePath)
    const base64 = buf.toString("base64")
    const prompt = `Extract the buyer name, seller name, and purchase price from this signed real estate document.
Return ONLY valid JSON: { "buyerName": string, "sellerName": string, "purchasePrice": number }`
    const resp = await c.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: { type: "base64", media_type: "application/pdf", data: base64 },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    })
    const textBlock = resp.content.find((b: any) => b.type === "text") as any
    if (!textBlock?.text) throw new Error("No text in Claude response")
    return extractJson(textBlock.text)
  } catch (err: any) {
    console.error("[ai-parser] signed-doc parse failed:", err.message)
    if (opts?.fallbackOnError !== false) return mockParseSignedDocument(docName, allSessions)
    throw err
  }
}

export function isAiEnabled(): boolean {
  return !!ANTHROPIC_API_KEY
}
