import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { v4 as uuid } from "uuid"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { signers } = await req.json()
  // signers: [{ role: "buyer", name: "John", email: "john@example.com" }]

  const db = getDb()
  const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(params.id) as any
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 })

  const fields = db.prepare("SELECT * FROM document_fields WHERE document_id = ?").all(params.id) as any[]
  if (fields.length === 0) {
    return NextResponse.json({ error: "No fields placed on document" }, { status: 400 })
  }

  const sessions: any[] = []
  for (const signer of signers) {
    const token = uuid()
    const id = `ss_${uuid().slice(0, 8)}`
    db.prepare(
      "INSERT INTO signing_sessions (id, document_id, signer_role, signer_name, signer_email, token) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(id, params.id, signer.role, signer.name, signer.email, token)
    sessions.push({ id, role: signer.role, name: signer.name, email: signer.email, token, status: "pending" })
  }

  // Update doc status
  db.prepare("UPDATE documents SET status = 'sent' WHERE id = ?").run(params.id)

  // Log
  const txId = doc.transaction_id
  db.prepare("INSERT INTO activity_log (id, transaction_id, action, details) VALUES (?, ?, ?, ?)").run(
    `al_${uuid().slice(0, 8)}`, txId, "document_sent", `Sent "${doc.name}" for signing to ${signers.map((s: any) => s.name).join(", ")}`
  )

  return NextResponse.json({ sessions })
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb()
  const sessions = db.prepare("SELECT * FROM signing_sessions WHERE document_id = ? ORDER BY created_at").all(params.id)
  return NextResponse.json({ sessions })
}
