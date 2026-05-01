export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import path from "path"
import fs from "fs"
import { getDb } from "@/lib/db"
import { mockParseContract } from "@/lib/mock-parser"
import { parseContractPdf } from "@/lib/ai-parser"

// POST /api/transactions/[id]/parse — parse most-recent uploaded PDF for this transaction
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb()
  const doc = db
    .prepare(
      "SELECT id, file_path FROM documents WHERE transaction_id = ? AND file_path IS NOT NULL ORDER BY rowid DESC LIMIT 1"
    )
    .get(params.id) as { id: string; file_path: string } | undefined

  if (!doc?.file_path) {
    return NextResponse.json(mockParseContract())
  }

  const fullPath = path.join(process.cwd(), "uploads", doc.file_path)
  if (!fs.existsSync(fullPath)) {
    return NextResponse.json(mockParseContract())
  }

  const parsed = await parseContractPdf(fullPath, { fallbackOnError: true })
  return NextResponse.json(parsed)
}
