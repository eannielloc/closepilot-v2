export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDb, primeDb } from "@/lib/db"
import { v4 as uuid } from "uuid"
import path from "path"
import fs from "fs"
import { isVercel } from "@/lib/db-blob"

export async function POST(req: NextRequest) {
  await primeDb()
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const formData = await req.formData()
  const transactionId = formData.get("transactionId") as string
  const files = formData.getAll("files") as File[]

  if (!transactionId || files.length === 0) {
    return NextResponse.json({ error: "Missing transactionId or files" }, { status: 400 })
  }

  const db = getDb()
  const docs: { id: string; name: string; filePath: string; status: string }[] = []

  for (const file of files) {
    const id = `doc_${uuid().slice(0, 8)}`
    const ext = path.extname(file.name) || ".pdf"
    const buffer = Buffer.from(await file.arrayBuffer())

    let storedPath: string
    if (isVercel()) {
      // Store in Vercel Blob; persist the public URL as file_path.
      const { put } = await import("@vercel/blob")
      const blob = await put(`documents/${id}${ext}`, buffer, {
        access: "public",
        addRandomSuffix: false,
        token: process.env.BLOB_READ_WRITE_TOKEN,
        contentType: file.type || "application/pdf",
      })
      storedPath = blob.url
    } else {
      const uploadsDir = path.join(process.cwd(), "uploads")
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
      const filename = `${id}${ext}`
      fs.writeFileSync(path.join(uploadsDir, filename), buffer)
      storedPath = filename
    }

    db.prepare(
      "INSERT INTO documents (id, transaction_id, name, file_path, status) VALUES (?, ?, ?, ?, 'draft')"
    ).run(id, transactionId, file.name, storedPath)

    db.prepare(
      "INSERT INTO activity_log (id, transaction_id, action, details) VALUES (?, ?, ?, ?)"
    ).run(`al_${uuid().slice(0, 8)}`, transactionId, "document_uploaded", `Uploaded: ${file.name}`)

    docs.push({ id, name: file.name, filePath: storedPath, status: "draft" })
  }

  return NextResponse.json({ documents: docs })
}
