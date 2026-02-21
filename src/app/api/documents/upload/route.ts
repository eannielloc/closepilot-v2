import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { v4 as uuid } from "uuid"
import path from "path"
import fs from "fs"

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const formData = await req.formData()
  const transactionId = formData.get("transactionId") as string
  const files = formData.getAll("files") as File[]

  if (!transactionId || files.length === 0) {
    return NextResponse.json({ error: "Missing transactionId or files" }, { status: 400 })
  }

  const uploadsDir = path.join(process.cwd(), "uploads")
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

  const db = getDb()
  const docs: any[] = []

  for (const file of files) {
    const id = `doc_${uuid().slice(0, 8)}`
    const ext = path.extname(file.name) || ".pdf"
    const filename = `${id}${ext}`
    const filePath = path.join(uploadsDir, filename)

    const buffer = Buffer.from(await file.arrayBuffer())
    fs.writeFileSync(filePath, buffer)

    db.prepare(
      "INSERT INTO documents (id, transaction_id, name, file_path, status) VALUES (?, ?, ?, ?, 'draft')"
    ).run(id, transactionId, file.name, filename)

    db.prepare(
      "INSERT INTO activity_log (id, transaction_id, action, details) VALUES (?, ?, ?, ?)"
    ).run(`al_${uuid().slice(0, 8)}`, transactionId, "document_uploaded", `Uploaded: ${file.name}`)

    docs.push({ id, name: file.name, filePath: filename, status: "draft" })
  }

  return NextResponse.json({ documents: docs })
}
