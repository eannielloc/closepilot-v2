import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import path from "path"
import fs from "fs"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb()
  const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(params.id) as any
  if (!doc || !doc.file_path) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const filePath = path.join(process.cwd(), "uploads", doc.file_path)
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  }

  const buffer = fs.readFileSync(filePath)
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${doc.name}"`,
    },
  })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb()
  const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(params.id) as any
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (doc.file_path) {
    const filePath = path.join(process.cwd(), "uploads", doc.file_path)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
  }

  db.prepare("DELETE FROM documents WHERE id = ?").run(params.id)
  return NextResponse.json({ deleted: true })
}
