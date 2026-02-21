import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  // Create agent
  const agent = await prisma.user.upsert({
    where: { email: "chris@closepilot.ai" },
    update: {},
    create: {
      email: "chris@closepilot.ai",
      name: "Chris Eanniello",
      phone: "(203) 555-0188",
      licenseNumber: "CT-REB.0795xxx",
      brokerage: "William Raveis Real Estate",
    },
  })

  // Transaction 1: Active, mid-process (Bridgeport)
  const tx1 = await prisma.transaction.create({
    data: {
      propertyAddress: "252 Shelton St, Bridgeport, CT 06608",
      status: "active",
      buyerName: "Ayisha Wint",
      sellerName: "Ruth Cogdell & Malika Tulloch",
      purchasePrice: 300000,
      effectiveDate: new Date("2026-01-22"),
      closingDate: new Date("2026-03-13"),
      contractType: "CT SmartMLS Standard Form",
      agentId: agent.id,
      milestones: {
        create: [
          { name: "Contract Executed / Initial Deposit ($3,000)", type: "deposit", dueDate: new Date("2026-01-22"), status: "completed" },
          { name: "Attorney Review Deadline", type: "attorney_review", dueDate: new Date("2026-01-29"), status: "completed", remindersSent: 1 },
          { name: "Inspection Completion Deadline", type: "inspection", dueDate: new Date("2026-02-02"), status: "completed", remindersSent: 2 },
          { name: "Inspection Objection Deadline", type: "inspection", dueDate: new Date("2026-02-04"), status: "completed", remindersSent: 1 },
          { name: "Additional Deposit Due ($7,500)", type: "deposit", dueDate: new Date("2026-02-06"), status: "completed", remindersSent: 2 },
          { name: "Title Search Completion", type: "title", dueDate: new Date("2026-02-17"), status: "pending" },
          { name: "Title Objection Deadline", type: "title", dueDate: new Date("2026-02-19"), status: "pending" },
          { name: "Mortgage Commitment Deadline", type: "loan_approval", dueDate: new Date("2026-02-27"), status: "pending" },
          { name: "CLOSING DATE — Fairfield County", type: "closing", dueDate: new Date("2026-03-13"), status: "pending" },
        ],
      },
      parties: {
        create: [
          { role: "buyer", name: "Ayisha Wint", email: "awint@email.com", phone: "(203) 555-0101" },
          { role: "seller", name: "Ruth Cogdell", email: "rcogdell@email.com", phone: "(203) 555-0201" },
          { role: "seller", name: "Malika Tulloch", email: "mtulloch@email.com", phone: "(203) 555-0202" },
          { role: "listing_agent", name: "Valerie King", email: "valerie.king@kw.com", phone: "(203) 555-0142", company: "Keller Williams Realty Prtnrs" },
          { role: "buyers_agent", name: "Chris Eanniello", email: "chris@closepilot.ai", phone: "(203) 555-0188", company: "William Raveis Real Estate" },
          { role: "lender", name: "David Park", email: "dpark@mortgageco.com", phone: "(203) 555-0301", company: "First National Mortgage" },
          { role: "attorney", name: "Michael Rosen", email: "mrosen@ctlaw.com", phone: "(203) 555-0401", company: "Rosen & Associates" },
        ],
      },
    },
  })

  // Transaction 2: Near closing (Ridgefield)
  const tx2 = await prisma.transaction.create({
    data: {
      propertyAddress: "47 Prospect Ridge, Ridgefield, CT 06877",
      status: "pending_closing",
      buyerName: "Jennifer & Mark Walsh",
      sellerName: "Robert & Linda Martinez",
      purchasePrice: 615000,
      effectiveDate: new Date("2026-01-05"),
      closingDate: new Date("2026-02-14"),
      contractType: "CT SmartMLS Standard Form",
      agentId: agent.id,
      milestones: {
        create: [
          { name: "Contract Executed / Initial Deposit ($5,000)", type: "deposit", dueDate: new Date("2026-01-05"), status: "completed" },
          { name: "Attorney Review Deadline", type: "attorney_review", dueDate: new Date("2026-01-12"), status: "completed", remindersSent: 1 },
          { name: "Inspection Completion Deadline", type: "inspection", dueDate: new Date("2026-01-16"), status: "completed", remindersSent: 2 },
          { name: "Inspection Objection Deadline", type: "inspection", dueDate: new Date("2026-01-20"), status: "completed", remindersSent: 1 },
          { name: "Additional Deposit Due ($10,000)", type: "deposit", dueDate: new Date("2026-01-19"), status: "completed", remindersSent: 2 },
          { name: "Title Search Completion", type: "title", dueDate: new Date("2026-01-30"), status: "completed", remindersSent: 1 },
          { name: "Mortgage Commitment Deadline", type: "loan_approval", dueDate: new Date("2026-02-04"), status: "completed", remindersSent: 2 },
          { name: "Final Walkthrough", type: "other", dueDate: new Date("2026-02-13"), status: "pending" },
          { name: "CLOSING DATE — Fairfield County", type: "closing", dueDate: new Date("2026-02-14"), status: "pending" },
        ],
      },
      parties: {
        create: [
          { role: "buyer", name: "Jennifer Walsh", email: "jwalsh@email.com", phone: "(203) 555-1101" },
          { role: "buyer", name: "Mark Walsh", email: "mwalsh@email.com", phone: "(203) 555-1102" },
          { role: "seller", name: "Robert Martinez", email: "rmartinez@email.com", phone: "(203) 555-1201" },
          { role: "listing_agent", name: "Tom Bradley", email: "tbradley@compass.com", phone: "(203) 555-1142", company: "Compass CT" },
          { role: "buyers_agent", name: "Chris Eanniello", email: "chris@closepilot.ai", phone: "(203) 555-0188", company: "William Raveis Real Estate" },
          { role: "attorney", name: "Sarah Klein", email: "sklein@ctlaw.com", phone: "(203) 555-1401", company: "Klein & Partners" },
        ],
      },
    },
  })

  // Transaction 3: New, just started (Darien)
  const tx3 = await prisma.transaction.create({
    data: {
      propertyAddress: "189 Tokeneke Rd, Darien, CT 06820",
      status: "new",
      buyerName: "David & Karen Liu",
      sellerName: "Estate of William Foster",
      purchasePrice: 925000,
      effectiveDate: new Date("2026-02-05"),
      closingDate: new Date("2026-04-01"),
      contractType: "CT SmartMLS Standard Form",
      agentId: agent.id,
      milestones: {
        create: [
          { name: "Contract Executed / Initial Deposit ($15,000)", type: "deposit", dueDate: new Date("2026-02-05"), status: "completed" },
          { name: "Attorney Review Deadline (5 business days)", type: "attorney_review", dueDate: new Date("2026-02-12"), status: "pending" },
          { name: "Inspection Completion Deadline", type: "inspection", dueDate: new Date("2026-02-19"), status: "pending" },
          { name: "Inspection Objection Deadline", type: "inspection", dueDate: new Date("2026-02-23"), status: "pending" },
          { name: "Additional Deposit Due ($25,000)", type: "deposit", dueDate: new Date("2026-02-19"), status: "pending" },
          { name: "Title Search Completion", type: "title", dueDate: new Date("2026-03-05"), status: "pending" },
          { name: "Title Objection Deadline", type: "title", dueDate: new Date("2026-03-09"), status: "pending" },
          { name: "Mortgage Commitment Deadline", type: "loan_approval", dueDate: new Date("2026-03-19"), status: "pending" },
          { name: "Final Walkthrough", type: "other", dueDate: new Date("2026-03-31"), status: "pending" },
          { name: "CLOSING DATE — Fairfield County", type: "closing", dueDate: new Date("2026-04-01"), status: "pending" },
        ],
      },
      parties: {
        create: [
          { role: "buyer", name: "David Liu", email: "dliu@email.com", phone: "(203) 555-2101" },
          { role: "buyer", name: "Karen Liu", email: "kliu@email.com", phone: "(203) 555-2102" },
          { role: "seller", name: "Estate of William Foster (c/o Attorney)", email: "probate@ctlawfirm.com", phone: "(203) 555-2201", company: "Foster & Associates Law" },
          { role: "listing_agent", name: "Rachel Green", email: "rgreen@sothebys.com", phone: "(203) 555-2142", company: "Sotheby's Intl Realty" },
          { role: "buyers_agent", name: "Chris Eanniello", email: "chris@closepilot.ai", phone: "(203) 555-0188", company: "William Raveis Real Estate" },
          { role: "attorney", name: "James Whitfield", email: "jwhitfield@ctlaw.com", phone: "(203) 555-2401", company: "Whitfield & Shaw" },
        ],
      },
    },
  })

  console.log("Seeded:", { tx1: tx1.id, tx2: tx2.id, tx3: tx3.id })
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1) })
