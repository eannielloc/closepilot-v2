export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { getDb, primeDb } from "@/lib/db"
import { findPartyByToken } from "@/lib/portal-tokens"
import { isVercel } from "@/lib/db-blob"
import { v4 as uuid } from "uuid"
import path from "path"
import fs from "fs"

// POST /api/portal/[token]/upload — multipart: files=<File[]> [taskId=<string>]
// Vendor or client party uploads a deliverable. Optionally tie it to a task,
// which gets auto-marked completed on successful upload.
export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  await primeDb()
  const party = findPartyByToken(params.token)
  if (!party) return NextResponse.json({ error: "Invalid link" }, { status: 404 })

  const formData = await req.formData()
  const files = formData.getAll("files") as File[]
  const taskId = formData.get("taskId") as string | null
  if (files.length === 0) return NextResponse.json({ error: "No files" }, { status: 400 })

  const db = getDb()
  const docs: { id: string; name: string; status: string }[] = []

  for (const file of files) {
    const id = `doc_${uuid().slice(0, 8)}`
    const ext = path.extname(file.name) || ""
    const buffer = Buffer.from(await file.arrayBuffer())

    let storedPath: string
    if (isVercel()) {
      const { put } = await import("@vercel/blob")
      const blob = await put(`documents/${id}${ext}`, buffer, {
        access: "public",
        addRandomSuffix: false,
        token: process.env.BLOB_READ_WRITE_TOKEN,
        contentType: file.type || "application/octet-stream",
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
      "INSERT INTO documents (id, transaction_id, name, file_path, status) VALUES (?, ?, ?, ?, 'received')"
    ).run(id, party.transaction_id, file.name, storedPath)

    db.prepare(
      "INSERT INTO activity_log (id, transaction_id, action, details) VALUES (?, ?, ?, ?)"
    ).run(`al_${uuid().slice(0, 8)}`, party.transaction_id, "portal_upload", `${party.name} uploaded ${file.name}`)

    docs.push({ id, name: file.name, status: "received" })
  }

  // If tied to a task, mark it complete and link the most recent doc.
  if (taskId && docs.length > 0) {
    const task = db
      .prepare(
        "SELECT id FROM portal_tasks WHERE id = ? AND transaction_id = ? AND (party_id = ? OR (party_id IS NULL AND role = ?))"
      )
      .get(taskId, party.transaction_id, party.id, party.role) as { id: string } | undefined
    if (task) {
      db.prepare(
        "UPDATE portal_tasks SET status = 'completed', completed_at = datetime('now'), document_id = ? WHERE id = ?"
      ).run(docs[docs.length - 1].id, taskId)
    }
  }

  return NextResponse.json({ documents: docs })
}
