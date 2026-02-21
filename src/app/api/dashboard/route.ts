import { NextResponse } from "next/server"
import { getDashboardStats } from "@/lib/db"

// GET /api/dashboard — stats, upcoming deadlines, overdue items
export async function GET() {
  try {
    const stats = getDashboardStats()
    return NextResponse.json(stats)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
