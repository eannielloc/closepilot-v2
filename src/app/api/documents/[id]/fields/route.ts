import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDb } from "@/lib/db"
import { v4 as uuid } from "uuid"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb()
  const fields = db.prepare("SELECT * FROM document_fields WHERE document_id = ? ORDER BY page_number, created_at").all(params.id)
  return NextResponse.json({ fields })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { fields } = await req.json()
  const db = getDb()

  // Delete existing fields and replace
  db.prepare("DELETE FROM document_fields WHERE document_id = ?").run(params.id)

  const insert = db.prepare(
    "INSERT INTO document_fields (id, document_id, page_number, field_type, assignee_role, x, y, width, height) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  )

  for (const f of fields) {
    insert.run(
      f.id || `fld_${uuid().slice(0, 8)}`,
      params.id,
      f.page_number || f.pageNumber,
      f.field_type || f.fieldType,
      f.assignee_role || f.assigneeRole,
      f.x,
      f.y,
      f.width,
      f.height
    )
  }

  return NextResponse.json({ saved: fields.length })
}
