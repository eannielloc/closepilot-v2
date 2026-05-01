export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { getDb, primeDb } from "@/lib/db"
import { buildIcs } from "@/lib/ics"

interface MilestoneRow {
  id: string
  name: string
  type: string
  due_date: string
  notes: string | null
  status: string
}

// GET /api/transactions/[id]/calendar.ics — downloadable feed of all milestones
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  await primeDb()
  const db = getDb()
  const tx = db.prepare("SELECT id, property_address, buyer_name, seller_name, closing_date FROM transactions WHERE id = ?").get(params.id) as
    | { id: string; property_address: string; buyer_name: string; seller_name: string; closing_date: string }
    | undefined
  if (!tx) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const milestones = db
    .prepare("SELECT id, name, type, due_date, notes, status FROM milestones WHERE transaction_id = ? ORDER BY due_date")
    .all(params.id) as MilestoneRow[]

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://closepilot-v2.vercel.app"
  const txUrl = `${baseUrl}/transactions/${tx.id}`

  const ics = buildIcs({
    calName: `${tx.property_address} — Closing`,
    calDescription: `Buyer: ${tx.buyer_name} • Seller: ${tx.seller_name} • Closing: ${tx.closing_date}`,
    events: milestones.map((m) => ({
      uid: `${m.id}@closepilot.ai`,
      summary: `[ClosePilot] ${m.name}`,
      description: [
        m.notes || "",
        `Property: ${tx.property_address}`,
        `Status: ${m.status}`,
        `View: ${txUrl}`,
      ].filter(Boolean).join("\\n"),
      location: tx.property_address,
      start: m.due_date,
      url: txUrl,
    })),
  })

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${tx.id}-deadlines.ics"`,
      "Cache-Control": "no-store",
    },
  })
}
