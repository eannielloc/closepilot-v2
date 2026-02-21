import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const db = getDb()
  const session = db.prepare(
    "SELECT ss.*, d.name as document_name, d.file_path, d.transaction_id FROM signing_sessions ss JOIN documents d ON ss.document_id = d.id WHERE ss.token = ?"
  ).get(params.token) as any

  if (!session) return NextResponse.json({ error: "Invalid signing link" }, { status: 404 })

  // Mark as viewed
  if (session.status === "pending") {
    db.prepare("UPDATE signing_sessions SET status = 'viewed' WHERE id = ?").run(session.id)
  }

  const fields = db.prepare(
    "SELECT * FROM document_fields WHERE document_id = ? ORDER BY page_number"
  ).all(session.document_id)

  // Get existing field values for this session
  const values = db.prepare(
    "SELECT * FROM field_values WHERE signing_session_id = ?"
  ).all(session.id)

  return NextResponse.json({
    session: {
      id: session.id,
      documentName: session.document_name,
      documentId: session.document_id,
      signerRole: session.signer_role,
      signerName: session.signer_name,
      status: session.status === "pending" ? "viewed" : session.status,
    },
    fields,
    values,
  })
}
