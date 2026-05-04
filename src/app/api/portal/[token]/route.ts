export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { getDb, primeDb } from "@/lib/db"
import { findPartyByToken, markPartyViewed, ROLE_LABELS, type PartyRole } from "@/lib/portal-tokens"

// GET /api/portal/[token] — resolve a portal token to its party + transaction
export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  await primeDb()

  const party = findPartyByToken(params.token)
  if (!party) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 })
  }

  markPartyViewed(party.id)

  const db = getDb()
  const tx = db
    .prepare(
      "SELECT id, property_address, status, buyer_name, seller_name, purchase_price, effective_date, closing_date, contract_type, agent_id FROM transactions WHERE id = ?"
    )
    .get(party.transaction_id) as
    | {
        id: string
        property_address: string
        status: string
        buyer_name: string
        seller_name: string
        purchase_price: number
        effective_date: string
        closing_date: string
        contract_type: string
        agent_id: string
      }
    | undefined

  if (!tx) return NextResponse.json({ error: "Transaction not found" }, { status: 404 })

  const milestones = db
    .prepare(
      "SELECT id, name, type, due_date, status, notes FROM milestones WHERE transaction_id = ? ORDER BY due_date"
    )
    .all(party.transaction_id) as Array<{
      id: string; name: string; type: string; due_date: string; status: string; notes: string | null
    }>

  const allParties = db
    .prepare("SELECT id, role, name, email, phone, company FROM parties WHERE transaction_id = ?")
    .all(party.transaction_id) as Array<{
      id: string; role: string; name: string; email: string | null; phone: string | null; company: string | null
    }>

  const documents = db
    .prepare("SELECT id, name, status, file_path FROM documents WHERE transaction_id = ?")
    .all(party.transaction_id) as Array<{ id: string; name: string; status: string; file_path: string | null }>

  // Tasks specific to THIS party + role-specific tasks (e.g., "lender" tasks)
  const tasks = db
    .prepare(
      `SELECT id, title, description, status, due_date, completed_at, document_id
       FROM portal_tasks
       WHERE transaction_id = ? AND (party_id = ? OR (party_id IS NULL AND role = ?))
       ORDER BY due_date IS NULL, due_date, created_at`
    )
    .all(party.transaction_id, party.id, party.role) as Array<{
      id: string; title: string; description: string | null; status: string; due_date: string | null; completed_at: string | null; document_id: string | null
    }>

  const messages = db
    .prepare(
      "SELECT id, author_role, author_name, body, created_at FROM portal_messages WHERE transaction_id = ? AND (party_id = ? OR party_id IS NULL) ORDER BY created_at"
    )
    .all(party.transaction_id, party.id) as Array<{
      id: string; author_role: string; author_name: string | null; body: string; created_at: string
    }>

  const agent = db
    .prepare("SELECT name, email, phone, brokerage FROM users WHERE id = ?")
    .get(tx.agent_id) as { name: string; email: string; phone: string | null; brokerage: string | null } | undefined

  return NextResponse.json({
    party: {
      id: party.id,
      role: party.role,
      roleLabel: ROLE_LABELS[party.role as PartyRole] || party.role,
      name: party.name,
      email: party.email,
      phone: party.phone,
      company: party.company,
    },
    transaction: {
      id: tx.id,
      propertyAddress: tx.property_address,
      status: tx.status,
      buyerName: tx.buyer_name,
      sellerName: tx.seller_name,
      purchasePrice: tx.purchase_price,
      effectiveDate: tx.effective_date,
      closingDate: tx.closing_date,
      contractType: tx.contract_type,
    },
    agent: agent
      ? { name: agent.name, email: agent.email, phone: agent.phone, brokerage: agent.brokerage }
      : null,
    milestones: milestones.map((m) => ({
      id: m.id,
      name: m.name,
      type: m.type,
      dueDate: m.due_date,
      status: m.status,
      notes: m.notes,
    })),
    parties: allParties.map((p) => ({
      id: p.id,
      role: p.role,
      roleLabel: ROLE_LABELS[p.role as PartyRole] || p.role,
      name: p.name,
      email: p.email,
      phone: p.phone,
      company: p.company,
    })),
    documents: documents.map((d) => ({
      id: d.id,
      name: d.name,
      status: d.status,
      hasFile: !!d.file_path,
    })),
    tasks: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      dueDate: t.due_date,
      completedAt: t.completed_at,
      documentId: t.document_id,
    })),
    messages: messages.map((m) => ({
      id: m.id,
      authorRole: m.author_role,
      authorName: m.author_name,
      body: m.body,
      createdAt: m.created_at,
    })),
  })
}
