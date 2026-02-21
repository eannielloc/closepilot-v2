import { NextRequest, NextResponse } from "next/server"
import { getTransaction, updateTransaction, deleteTransaction } from "@/lib/db"

// GET /api/transactions/[id]
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const tx = getTransaction(params.id)
  if (!tx) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(tx)
}

// PATCH /api/transactions/[id]
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const tx = updateTransaction(params.id, body)
    if (!tx) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(tx)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE /api/transactions/[id]
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    deleteTransaction(params.id)
    return NextResponse.json({ deleted: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
