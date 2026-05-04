export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { getDb, primeDb } from "@/lib/db"
import { findPartyByToken } from "@/lib/portal-tokens"
import { v4 as uuid } from "uuid"

// POST /api/portal/[token]/messages — body: { body }
export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  await primeDb()
  const party = findPartyByToken(params.token)
  if (!party) return NextResponse.json({ error: "Invalid link" }, { status: 404 })

  const { body } = (await req.json()) as { body: string }
  if (!body || !body.trim()) return NextResponse.json({ error: "body required" }, { status: 400 })

  const db = getDb()
  const id = `msg_${uuid().slice(0, 8)}`
  db.prepare(
    "INSERT INTO portal_messages (id, transaction_id, party_id, author_role, author_name, body) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(id, party.transaction_id, party.id, party.role, party.name, body.trim())

  db.prepare(
    "INSERT INTO activity_log (id, transaction_id, action, details) VALUES (?, ?, ?, ?)"
  ).run(`al_${uuid().slice(0, 8)}`, party.transaction_id, "portal_message", `${party.name} sent a message`)

  return NextResponse.json({ id })
}
