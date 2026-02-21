import { NextResponse } from "next/server"
import { getDb, createTransaction, addParty, updateMilestone } from "@/lib/db"

// POST /api/seed — populate demo data (idempotent)
export async function POST() {
  try {
    const db = getDb()
    const count = (db.prepare("SELECT COUNT(*) as c FROM transactions").get() as any).c
    if (count > 0) {
      return NextResponse.json({ message: `Already seeded (${count} transactions exist)`, seeded: false })
    }

    // Transaction 1: Active deal
    const tx1 = createTransaction({
      propertyAddress: "252 Shelton St, Bridgeport, CT 06608",
      buyerName: "Ayisha Wint",
      sellerName: "Ruth Cogdell & Malika Tulloch",
      purchasePrice: 300000,
      effectiveDate: "2026-01-22",
      closingDate: "2026-03-13",
      initialDeposit: 3000,
      additionalDeposit: 7500,
      financingType: "conventional",
    })
    if (tx1) {
      addParty(tx1.id, { role: "buyer", name: "Ayisha Wint", email: "awint@email.com", phone: "(203) 555-0101" })
      addParty(tx1.id, { role: "seller", name: "Ruth Cogdell", email: "rcogdell@email.com", phone: "(203) 555-0201" })
      addParty(tx1.id, { role: "listing_agent", name: "Valerie King", email: "valerie.king@kw.com", phone: "(203) 555-0142", company: "Keller Williams" })
      addParty(tx1.id, { role: "lender", name: "David Park", email: "dpark@mortgageco.com", phone: "(203) 555-0301", company: "First National Mortgage" })
      addParty(tx1.id, { role: "attorney", name: "Michael Rosen", email: "mrosen@ctlaw.com", phone: "(203) 555-0401", company: "Rosen & Associates" })
      // Mark early milestones as completed
      const milestones = tx1.milestones || []
      for (const ms of milestones.slice(0, 5)) {
        updateMilestone(ms.id, { status: "completed" })
      }
    }

    // Transaction 2: Near closing
    const tx2 = createTransaction({
      propertyAddress: "47 Prospect Ridge, Ridgefield, CT 06877",
      buyerName: "Jennifer & Mark Walsh",
      sellerName: "Robert & Linda Martinez",
      purchasePrice: 615000,
      effectiveDate: "2026-01-05",
      closingDate: "2026-02-21",
      initialDeposit: 5000,
      additionalDeposit: 10000,
      financingType: "conventional",
    })
    if (tx2) {
      addParty(tx2.id, { role: "buyer", name: "Jennifer Walsh", email: "jwalsh@email.com", phone: "(203) 555-1101" })
      addParty(tx2.id, { role: "buyer", name: "Mark Walsh", email: "mwalsh@email.com", phone: "(203) 555-1102" })
      addParty(tx2.id, { role: "seller", name: "Robert Martinez", email: "rmartinez@email.com" })
      addParty(tx2.id, { role: "attorney", name: "Sarah Klein", email: "sklein@ctlaw.com", company: "Klein & Partners" })
      // Mark most milestones as completed (near closing)
      const milestones = tx2.milestones || []
      for (const ms of milestones.slice(0, milestones.length - 2)) {
        updateMilestone(ms.id, { status: "completed" })
      }
      // Update status
      db.prepare("UPDATE transactions SET status = 'pending_closing' WHERE id = ?").run(tx2.id)
    }

    // Transaction 3: Fresh cash deal
    const tx3 = createTransaction({
      propertyAddress: "652-664 Black Rock Tpke, Fairfield, CT 06825",
      buyerName: "Ayman",
      sellerName: "Estate of Johnson",
      purchasePrice: 789000,
      effectiveDate: "2026-02-15",
      closingDate: "2026-04-15",
      financingType: "conventional",
    })
    if (tx3) {
      addParty(tx3.id, { role: "buyer", name: "Ayman", email: "ayman@email.com" })
      addParty(tx3.id, { role: "buyers_agent", name: "Demo Agent", email: "agent@closepilot.ai", company: "Premier Realty Group" })
    }

    return NextResponse.json({ message: "Seeded 3 demo transactions", seeded: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
