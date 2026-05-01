export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { addParty, primeDb } from "@/lib/db"

// POST /api/transactions/[id]/parties — add a party to a transaction
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await primeDb()
  try {
    const body = await req.json()
    const { role, name, email, phone, company } = body
    if (!role || !name) {
      return NextResponse.json({ error: "role and name required" }, { status: 400 })
    }
    const party = addParty(params.id, { role, name, email, phone, company })
    return NextResponse.json(party, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
