export const dynamic = "force-dynamic"
import { NextResponse } from "next/server"
import { getDashboardStats, primeDb } from "@/lib/db"

// GET /api/dashboard — stats, upcoming deadlines, overdue items
export async function GET() {
  await primeDb()
  try {
    const stats = getDashboardStats()
    return NextResponse.json(stats)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
