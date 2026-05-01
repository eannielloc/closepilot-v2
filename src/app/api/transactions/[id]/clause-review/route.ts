export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { getDb, primeDb } from "@/lib/db"
import { reviewContract } from "@/lib/clause-review"
import { mockParseContract, type ParsedContract } from "@/lib/mock-parser"

// POST /api/transactions/[id]/clause-review — analyze parsed contract for risks
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  await primeDb()
  const db = getDb()
  const tx = db.prepare("SELECT parsed_data FROM transactions WHERE id = ?").get(params.id) as { parsed_data: string | null } | undefined

  let parsed: ParsedContract
  if (tx?.parsed_data) {
    try {
      parsed = JSON.parse(tx.parsed_data) as ParsedContract
    } catch {
      parsed = mockParseContract()
    }
  } else {
    // No parsed data yet — fall back to a representative shape so the
    // review feature still demonstrates value during the demo flow.
    parsed = mockParseContract()
  }

  const review = await reviewContract(parsed)

  // Persist review JSON alongside the transaction for repeat reads
  db.prepare(
    "UPDATE transactions SET parsed_data = json_set(COALESCE(parsed_data, '{}'), '$.clauseReview', json(?)) WHERE id = ?"
  ).run(JSON.stringify(review), params.id)

  return NextResponse.json(review)
}

// GET /api/transactions/[id]/clause-review — fetch saved review if any
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  await primeDb()
  const db = getDb()
  const tx = db.prepare("SELECT parsed_data FROM transactions WHERE id = ?").get(params.id) as { parsed_data: string | null } | undefined
  if (!tx?.parsed_data) return NextResponse.json({ review: null })
  try {
    const data = JSON.parse(tx.parsed_data) as { clauseReview?: unknown }
    return NextResponse.json({ review: data.clauseReview ?? null })
  } catch {
    return NextResponse.json({ review: null })
  }
}
