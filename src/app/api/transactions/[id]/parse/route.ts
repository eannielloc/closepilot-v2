import { NextResponse } from "next/server"
import { mockParseContract } from "@/lib/mock-parser"

// POST /api/transactions/[id]/parse — parse uploaded contract PDF
export async function POST() {
  // Simulate processing time
  await new Promise((r) => setTimeout(r, 1000))
  const parsed = mockParseContract()
  return NextResponse.json(parsed)
}
