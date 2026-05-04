export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { addParty, getDb, primeDb } from "@/lib/db"
import { ensurePartyToken, type PartyRole, ROLE_LABELS } from "@/lib/portal-tokens"
import { sendEmail } from "@/lib/email"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://closepilot-v2-production.up.railway.app"

// POST /api/transactions/[id]/parties — add a party + (optionally) email an invite
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await primeDb()
  try {
    const body = await req.json()
    const { role, name, email, phone, company, sendInvite } = body as {
      role: PartyRole
      name: string
      email?: string
      phone?: string
      company?: string
      sendInvite?: boolean
    }
    if (!role || !name) {
      return NextResponse.json({ error: "role and name required" }, { status: 400 })
    }

    const party = addParty(params.id, { role, name, email, phone, company }) as {
      id: string
      role: PartyRole
      name: string
      email?: string
    }
    const token = ensurePartyToken(party.id)
    const portalUrl = `${APP_URL}/portal/${token}`

    let invited = false
    if (sendInvite && email) {
      const db = getDb()
      const tx = db
        .prepare("SELECT property_address, buyer_name, seller_name, closing_date FROM transactions WHERE id = ?")
        .get(params.id) as
        | { property_address: string; buyer_name: string; seller_name: string; closing_date: string }
        | undefined

      const subject = `You're invited: ${tx?.property_address || "real estate transaction"} (${ROLE_LABELS[role]})`
      const html = `
<!DOCTYPE html>
<html><body style="font-family:-apple-system,system-ui,sans-serif;color:#1f2937;background:#f9fafb;padding:32px 16px;">
<div style="max-width:560px;margin:0 auto;background:white;border:1px solid #e5e7eb;border-radius:12px;padding:32px;">
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:24px;">
    <div style="width:28px;height:28px;border-radius:6px;background:#2563eb;color:white;display:flex;align-items:center;justify-content:center;font-weight:700;">CP</div>
    <span style="font-weight:700;font-size:18px;">ClosePilot</span>
  </div>
  <h1 style="font-size:20px;font-weight:600;margin:0 0 12px;">You've been added to a real estate deal</h1>
  <p style="color:#4b5563;line-height:1.6;margin:0 0 16px;">
    ${name}, you've been invited as the <strong>${ROLE_LABELS[role]}</strong> on:
  </p>
  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:16px 0;">
    <p style="font-weight:600;margin:0 0 4px;">${tx?.property_address || "Transaction"}</p>
    <p style="color:#6b7280;font-size:13px;margin:0;">${tx?.buyer_name || ""} ${tx?.buyer_name && tx?.seller_name ? "→" : ""} ${tx?.seller_name || ""}</p>
    ${tx?.closing_date ? `<p style="color:#6b7280;font-size:13px;margin:4px 0 0;">Target closing: ${tx.closing_date}</p>` : ""}
  </div>
  <p style="color:#4b5563;line-height:1.6;margin:0 0 24px;">
    Click below to access your portal — see deadlines, upload documents, and stay in sync without endless email threads.
  </p>
  <a href="${portalUrl}" style="display:inline-block;background:#2563eb;color:white;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">Open Portal</a>
  <p style="color:#9ca3af;font-size:12px;margin:32px 0 0;border-top:1px solid #e5e7eb;padding-top:16px;">
    This link is unique to you — please don't share it. ClosePilot is the AI transaction coordinator your agent uses to keep deals on track.
  </p>
</div>
</body></html>
      `
      const result = await sendEmail({ to: email, subject, html })
      invited = result.success
      if (invited) {
        getDb().prepare("UPDATE parties SET invited_at = datetime('now') WHERE id = ?").run(party.id)
      }
    }

    return NextResponse.json({ ...party, portalUrl, portalToken: token, invited }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// GET /api/transactions/[id]/parties — list parties (with portal URLs)
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  await primeDb()
  const db = getDb()
  const rows = db
    .prepare(
      "SELECT id, transaction_id, role, name, email, phone, company, portal_token, invited_at, last_viewed_at FROM parties WHERE transaction_id = ?"
    )
    .all(params.id) as Array<{
      id: string
      transaction_id: string
      role: string
      name: string
      email: string | null
      phone: string | null
      company: string | null
      portal_token: string | null
      invited_at: string | null
      last_viewed_at: string | null
    }>
  const result = rows.map((p) => ({
    id: p.id,
    transactionId: p.transaction_id,
    role: p.role,
    name: p.name,
    email: p.email,
    phone: p.phone,
    company: p.company,
    portalUrl: p.portal_token ? `${APP_URL}/portal/${p.portal_token}` : null,
    invitedAt: p.invited_at,
    lastViewedAt: p.last_viewed_at,
  }))
  return NextResponse.json(result)
}
