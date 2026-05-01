export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import os from "os"
import { v4 as uuid } from "uuid"
import { parseContractPdf } from "@/lib/ai-parser"

// POST /api/transactions/parse-upload — accept a PDF, parse via Claude (or mock fallback)
export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 })

  const tmpPath = path.join(os.tmpdir(), `cp-${uuid().slice(0, 8)}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`)
  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    await fs.writeFile(tmpPath, buffer)
    const parsed = await parseContractPdf(tmpPath, { fallbackOnError: true })
    return NextResponse.json(parsed)
  } catch (err: any) {
    console.error("[parse-upload] failed:", err.message)
    return NextResponse.json({ error: err.message || "Parse failed" }, { status: 500 })
  } finally {
    fs.unlink(tmpPath).catch(() => {})
  }
}
