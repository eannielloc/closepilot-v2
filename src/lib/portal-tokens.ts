// Secure tokens for role-based portal access. Each `party` row gets a
// random URL-safe token; visiting /portal/<token> resolves to that party
// and the transaction it belongs to, without requiring login.

import crypto from "crypto"
import { getDb } from "./db"

export type PartyRole =
  | "buyer"
  | "seller"
  | "listing_agent"
  | "buyers_agent"
  | "lender"
  | "title"
  | "attorney"
  | "inspector"
  | "appraiser"
  | "contractor"
  | "other"

export const ROLE_LABELS: Record<PartyRole, string> = {
  buyer: "Buyer",
  seller: "Seller",
  listing_agent: "Listing Agent",
  buyers_agent: "Buyer's Agent",
  lender: "Lender",
  title: "Title Company",
  attorney: "Attorney",
  inspector: "Inspector",
  appraiser: "Appraiser",
  contractor: "Contractor",
  other: "Other",
}

// Roles that get a "client" (buyer/seller) portal experience.
export const CLIENT_ROLES: PartyRole[] = ["buyer", "seller"]

// Roles that get a "vendor" portal experience (work to deliver).
export const VENDOR_ROLES: PartyRole[] = [
  "lender",
  "title",
  "attorney",
  "inspector",
  "appraiser",
  "contractor",
]

export const ALL_ROLES: PartyRole[] = [
  "buyer",
  "seller",
  "lender",
  "title",
  "attorney",
  "inspector",
  "appraiser",
  "contractor",
  "listing_agent",
  "buyers_agent",
  "other",
]

export function generatePortalToken(): string {
  // 32 bytes -> 43 chars URL-safe base64; collision-resistant for our scale.
  return crypto.randomBytes(32).toString("base64url")
}

export interface PartyRow {
  id: string
  transaction_id: string
  role: PartyRole
  name: string
  email: string | null
  phone: string | null
  company: string | null
  portal_token: string | null
  invited_at: string | null
  last_viewed_at: string | null
}

export function findPartyByToken(token: string): PartyRow | null {
  const db = getDb()
  const row = db
    .prepare("SELECT * FROM parties WHERE portal_token = ?")
    .get(token) as PartyRow | undefined
  return row ?? null
}

export function ensurePartyToken(partyId: string): string {
  const db = getDb()
  const row = db
    .prepare("SELECT portal_token FROM parties WHERE id = ?")
    .get(partyId) as { portal_token: string | null } | undefined
  if (row?.portal_token) return row.portal_token
  const token = generatePortalToken()
  db.prepare("UPDATE parties SET portal_token = ? WHERE id = ?").run(token, partyId)
  return token
}

export function markPartyViewed(partyId: string): void {
  const db = getDb()
  db.prepare("UPDATE parties SET last_viewed_at = datetime('now') WHERE id = ?").run(partyId)
}

export function isClientRole(role: PartyRole): boolean {
  return CLIENT_ROLES.includes(role)
}

export function isVendorRole(role: PartyRole): boolean {
  return VENDOR_ROLES.includes(role)
}
