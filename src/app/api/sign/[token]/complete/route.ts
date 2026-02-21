import { NextRequest, NextResponse } from "next/server"
import { getDb, populateTransactionFromParse } from "@/lib/db"
import { mockParseSignedDocument } from "@/lib/mock-parser"
import { v4 as uuid } from "uuid"

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const db = getDb()
  const session = db.prepare(
    "SELECT ss.*, d.transaction_id, d.id as doc_id, d.name as doc_name FROM signing_sessions ss JOIN documents d ON ss.document_id = d.id WHERE ss.token = ?"
  ).get(params.token) as any

  if (!session) return NextResponse.json({ error: "Invalid signing link" }, { status: 404 })
  if (session.status === "signed") return NextResponse.json({ error: "Already signed" }, { status: 400 })

  const { fieldValues } = await req.json()

  const insert = db.prepare(
    "INSERT INTO field_values (id, field_id, signing_session_id, value) VALUES (?, ?, ?, ?)"
  )

  for (const fv of fieldValues) {
    insert.run(`fv_${uuid().slice(0, 8)}`, fv.fieldId, session.id, fv.value)
  }

  // Mark session as signed
  db.prepare("UPDATE signing_sessions SET status = 'signed', signed_at = datetime('now') WHERE id = ?").run(session.id)

  db.prepare("INSERT INTO activity_log (id, transaction_id, action, details) VALUES (?, ?, ?, ?)").run(
    `al_${uuid().slice(0, 8)}`, session.transaction_id, "document_signed", `${session.signer_name} (${session.signer_role}) signed`
  )

  // Check if all sessions for this doc are signed
  const remaining = db.prepare(
    "SELECT COUNT(*) as c FROM signing_sessions WHERE document_id = ? AND status != 'signed'"
  ).get(session.doc_id) as any

  let parsed = false

  if (remaining.c === 0) {
    db.prepare("UPDATE documents SET status = 'completed' WHERE id = ?").run(session.doc_id)
    db.prepare("INSERT INTO activity_log (id, transaction_id, action, details) VALUES (?, ?, ?, ?)").run(
      `al_${uuid().slice(0, 8)}`, session.transaction_id, "document_completed", "All parties have signed"
    )

    // Post-signing AI parse for draft transactions
    const tx = db.prepare("SELECT status FROM transactions WHERE id = ?").get(session.transaction_id) as { status: string } | undefined
    if (tx && tx.status === "draft") {
      // Collect signer info from all sessions on this document
      const allSessions = db.prepare(
        "SELECT signer_role, signer_name, signer_email FROM signing_sessions WHERE document_id = ?"
      ).all(session.doc_id) as Array<{ signer_role: string; signer_name: string; signer_email: string }>

      const mockParsed = mockParseSignedDocument(session.doc_name, allSessions)
      populateTransactionFromParse(session.transaction_id, mockParsed)
      parsed = true

      db.prepare("UPDATE documents SET status = 'parsed' WHERE id = ?").run(session.doc_id)
    }
  }

  return NextResponse.json({ success: true, allSigned: remaining.c === 0, parsed })
}
