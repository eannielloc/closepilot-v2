import { NextRequest, NextResponse } from "next/server"
import { listTransactions, createTransaction, createDraftTransaction } from "@/lib/db"

// GET /api/transactions — list all
export async function GET() {
  try {
    const transactions = listTransactions()
    return NextResponse.json(transactions)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST /api/transactions — create new (full or draft)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { propertyAddress, buyerName, sellerName, purchasePrice, effectiveDate, closingDate, contractType, initialDeposit, additionalDeposit, financingType, mode } = body

    if (!propertyAddress) {
      return NextResponse.json({ error: "Property address is required" }, { status: 400 })
    }

    // Draft mode — just property address
    if (mode === "draft" || (!buyerName && !sellerName && !purchasePrice)) {
      const tx = createDraftTransaction(propertyAddress)
      return NextResponse.json(tx, { status: 201 })
    }

    // Full creation (existing upload flow)
    if (!buyerName || !sellerName || !purchasePrice || !effectiveDate || !closingDate) {
      return NextResponse.json({ error: "Missing required fields for full transaction" }, { status: 400 })
    }

    const tx = createTransaction({
      propertyAddress, buyerName, sellerName,
      purchasePrice: parseFloat(purchasePrice),
      effectiveDate, closingDate, contractType,
      initialDeposit: initialDeposit ? parseFloat(initialDeposit) : undefined,
      additionalDeposit: additionalDeposit ? parseFloat(additionalDeposit) : undefined,
      financingType: financingType || "conventional",
    })

    return NextResponse.json(tx, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
