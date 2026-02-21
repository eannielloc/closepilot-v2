// Mock contract parser — returns realistic structured data as if parsed from a CT SmartMLS Standard Form PDF
// In production, this would use Claude Vision API to extract from actual PDFs

export interface ParsedContract {
  contractType: string
  propertyAddress: string
  purchasePrice: number
  effectiveDate: string
  closingDate: string
  buyer: { name: string; address?: string }
  seller: { name: string; address?: string }
  listingAgent?: { name: string; firm: string; phone?: string; email?: string }
  buyersAgent?: { name: string; firm: string; phone?: string; email?: string }
  financials: {
    purchasePrice: number
    depositAmount: number
    depositDueDate: string
    additionalDeposit?: number
    additionalDepositDue?: string
    mortgageAmount?: number
    sellerConcession?: string
  }
  keyDates: {
    effectiveDate: string
    depositDue: string
    attorneyReviewDeadline: string
    inspectionDeadline: string
    inspectionObjectionDeadline?: string
    titleSearchCompletion?: string
    titleObjectionDeadline?: string
    mortgageCommitmentDeadline: string
    closingDate: string
  }
  contingencies: string[]
  milestones: Array<{
    date: string
    name: string
    type: string
  }>
}

export function mockParseContract(_filename?: string): ParsedContract {
  // Returns sample CT SmartMLS Standard Form parsed data
  return {
    contractType: "CT SmartMLS Standard Form Real Estate Contract (rev 9.24)",
    propertyAddress: "252 Shelton St, Bridgeport, CT 06608",
    purchasePrice: 300000,
    effectiveDate: "2026-01-22",
    closingDate: "2026-03-13",
    buyer: { name: "Ayisha Wint", address: "484 Merritt St, Bridgeport, CT 06606" },
    seller: { name: "Ruth Cogdell & Malika Tulloch", address: "252 Shelton St, Bridgeport, CT 06608" },
    listingAgent: {
      name: "Valerie King",
      firm: "Keller Williams Realty Prtnrs",
      phone: "(203) 555-0142",
      email: "valerie.king@kw.com",
    },
    buyersAgent: {
      name: "Demo Agent",
      firm: "Premier Realty Group",
      phone: "(203) 555-0188",
      email: "chris@closepilot.ai",
    },
    financials: {
      purchasePrice: 300000,
      depositAmount: 3000,
      depositDueDate: "2026-01-22",
      additionalDeposit: 7500,
      additionalDepositDue: "2026-02-06",
      mortgageAmount: 289500,
      sellerConcession: "3% toward buyer closing costs",
    },
    keyDates: {
      effectiveDate: "2026-01-22",
      depositDue: "2026-01-22",
      attorneyReviewDeadline: "2026-01-29",
      inspectionDeadline: "2026-02-02",
      inspectionObjectionDeadline: "2026-02-04",
      titleSearchCompletion: "2026-02-17",
      titleObjectionDeadline: "2026-02-19",
      mortgageCommitmentDeadline: "2026-02-27",
      closingDate: "2026-03-13",
    },
    contingencies: [
      "Mortgage financing contingency",
      "Inspection contingency",
      "Attorney review contingency (5 business days)",
      "Title search contingency",
    ],
    milestones: [
      { date: "2026-01-22", name: "Contract Executed / Initial Deposit Due ($3,000)", type: "deposit" },
      { date: "2026-01-29", name: "Attorney Review Deadline (5 business days)", type: "attorney_review" },
      { date: "2026-02-02", name: "Inspection Completion Deadline", type: "inspection" },
      { date: "2026-02-04", name: "Inspection Objection Deadline (2 business days)", type: "inspection" },
      { date: "2026-02-06", name: "Additional Deposit Due ($7,500)", type: "deposit" },
      { date: "2026-02-17", name: "Title Search Completion (10 business days)", type: "title" },
      { date: "2026-02-19", name: "Title Objection Deadline (2 business days)", type: "title" },
      { date: "2026-02-27", name: "Mortgage Commitment Deadline", type: "loan_approval" },
      { date: "2026-03-13", name: "CLOSING DATE — Fairfield County", type: "closing" },
    ],
  }
}

// Mock signed document parser — simulates AI extracting deal details from a signed document
export function mockParseSignedDocument(
  _docName: string,
  signers: Array<{ signer_role: string; signer_name: string; signer_email: string }>
): {
  buyerName?: string
  sellerName?: string
  purchasePrice?: number
  effectiveDate?: string
  closingDate?: string
  parsedData?: Record<string, unknown>
} {
  const buyer = signers.find(s => s.signer_role === "buyer")
  const seller = signers.find(s => s.signer_role === "seller")

  // Simulate AI extracting data from the signed document
  const today = new Date()
  const closingDate = new Date(today)
  closingDate.setDate(closingDate.getDate() + 45)

  const result = {
    buyerName: buyer?.signer_name || "Extracted Buyer Name",
    sellerName: seller?.signer_name || "Extracted Seller Name",
    purchasePrice: 350000,
    effectiveDate: today.toISOString().split("T")[0],
    closingDate: closingDate.toISOString().split("T")[0],
    parsedData: {
      contractType: "CT SmartMLS Standard Form",
      financials: {
        purchasePrice: 350000,
        depositAmount: 3500,
        mortgageAmount: 332500,
      },
      contingencies: [
        "Mortgage financing contingency",
        "Inspection contingency",
        "Attorney review contingency",
      ],
      parties: signers.map(s => ({
        role: s.signer_role,
        name: s.signer_name,
        email: s.signer_email,
      })),
    },
  }

  console.log(`[MOCK PARSE] Parsed signed document: ${_docName}`)
  console.log(`[MOCK PARSE] Extracted: buyer=${result.buyerName}, seller=${result.sellerName}, price=${result.purchasePrice}`)

  return result
}

// Mock email sender — logs instead of sending
export function mockSendReminder(to: string, subject: string, body: string) {
  console.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`)
  console.log(`[MOCK EMAIL] Body: ${body.substring(0, 100)}...`)
  return { success: true, messageId: `mock_${Date.now()}` }
}
