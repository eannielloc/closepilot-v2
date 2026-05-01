export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { updateMilestone, primeDb } from "@/lib/db"

// PATCH /api/milestones/[id] — update milestone status
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await primeDb()
  try {
    const body = await req.json()
    const ms = updateMilestone(params.id, body)
    if (!ms) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(ms)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
