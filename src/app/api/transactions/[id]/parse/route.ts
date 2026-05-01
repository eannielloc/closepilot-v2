export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { getDb, primeDb } from "@/lib/db"
import { mockParseContract } from "@/lib/mock-parser"
import { parseContractPdf } from "@/lib/ai-parser"
import { materialize } from "@/lib/file-store"

// POST /api/transactions/[id]/parse — parse most-recent uploaded PDF for this transaction
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  await primeDb()
  const db = getDb()
  const doc = db
    .prepare(
      "SELECT id, file_path FROM documents WHERE transaction_id = ? AND file_path IS NOT NULL ORDER BY rowid DESC LIMIT 1"
    )
    .get(params.id) as { id: string; file_path: string } | undefined

  if (!doc?.file_path) {
    return NextResponse.json(mockParseContract())
  }

  let materialized: { path: string; cleanup?: () => void } | null = null
  try {
    materialized = await materialize(doc.file_path)
    const parsed = await parseContractPdf(materialized.path, { fallbackOnError: true })
    return NextResponse.json(parsed)
  } catch (err) {
    console.error("[parse] failed:", err)
    return NextResponse.json(mockParseContract())
  } finally {
    materialized?.cleanup?.()
  }
}
