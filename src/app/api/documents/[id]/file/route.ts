export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { getDb, primeDb } from "@/lib/db"
import path from "path"
import fs from "fs"
import { isBlobUrl } from "@/lib/file-store"

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  await primeDb()
  const db = getDb()
  const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(params.id) as { file_path?: string | null; name?: string } | undefined
  if (!doc?.file_path) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (isBlobUrl(doc.file_path)) {
    return NextResponse.redirect(doc.file_path, 302)
  }

  const filePath = path.join(process.cwd(), "uploads", doc.file_path)
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  }

  const buffer = fs.readFileSync(filePath)
  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${doc.name || "document.pdf"}"`,
    },
  })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await primeDb()
  const db = getDb()
  const doc = db.prepare("SELECT * FROM documents WHERE id = ?").get(params.id) as { file_path?: string | null } | undefined
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (doc.file_path) {
    if (isBlobUrl(doc.file_path)) {
      try {
        const { del } = await import("@vercel/blob")
        await del(doc.file_path, { token: process.env.BLOB_READ_WRITE_TOKEN })
      } catch (err) {
        console.error("[doc/delete] Blob delete failed:", err)
      }
    } else {
      const filePath = path.join(process.cwd(), "uploads", doc.file_path)
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    }
  }

  db.prepare("DELETE FROM documents WHERE id = ?").run(params.id)
  return NextResponse.json({ deleted: true })
}
