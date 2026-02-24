export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb()
  
  // Ensure deal_data column exists
  const cols = db.prepare("PRAGMA table_info(transactions)").all() as any[]
  if (!cols.find((c: any) => c.name === "deal_data")) {
    db.exec("ALTER TABLE transactions ADD COLUMN deal_data TEXT DEFAULT '{}'")
  }
  
  const tx = db.prepare("SELECT deal_data FROM transactions WHERE id = ?").get(params.id) as any
  if (!tx) return NextResponse.json({ error: "Not found" }, { status: 404 })
  
  let dealData = {}
  try { dealData = JSON.parse(tx.deal_data || "{}") } catch {}
  
  return NextResponse.json({ dealData })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  
  const db = getDb()
  
  // Ensure deal_data column exists
  const cols = db.prepare("PRAGMA table_info(transactions)").all() as any[]
  if (!cols.find((c: any) => c.name === "deal_data")) {
    db.exec("ALTER TABLE transactions ADD COLUMN deal_data TEXT DEFAULT '{}'")
  }
  
  const { dealData } = await req.json()
  
  db.prepare("UPDATE transactions SET deal_data = ?, updated_at = datetime('now') WHERE id = ?")
    .run(JSON.stringify(dealData), params.id)
  
  return NextResponse.json({ saved: true })
}
