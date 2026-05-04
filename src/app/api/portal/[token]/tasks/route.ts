export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { getDb, primeDb } from "@/lib/db"
import { findPartyByToken } from "@/lib/portal-tokens"
import { v4 as uuid } from "uuid"

// PATCH /api/portal/[token]/tasks — body: { taskId, status }
export async function PATCH(req: NextRequest, { params }: { params: { token: string } }) {
  await primeDb()
  const party = findPartyByToken(params.token)
  if (!party) return NextResponse.json({ error: "Invalid link" }, { status: 404 })

  const { taskId, status } = (await req.json()) as { taskId: string; status: string }
  if (!taskId || !status) return NextResponse.json({ error: "taskId + status required" }, { status: 400 })

  const db = getDb()
  // Make sure this task belongs to this party (or is role-wide for them).
  const task = db
    .prepare(
      "SELECT id FROM portal_tasks WHERE id = ? AND transaction_id = ? AND (party_id = ? OR (party_id IS NULL AND role = ?))"
    )
    .get(taskId, party.transaction_id, party.id, party.role) as { id: string } | undefined
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 })

  if (status === "completed") {
    db.prepare("UPDATE portal_tasks SET status = 'completed', completed_at = datetime('now') WHERE id = ?").run(taskId)
  } else {
    db.prepare("UPDATE portal_tasks SET status = ?, completed_at = NULL WHERE id = ?").run(status, taskId)
  }

  db.prepare(
    "INSERT INTO activity_log (id, transaction_id, action, details) VALUES (?, ?, ?, ?)"
  ).run(`al_${uuid().slice(0, 8)}`, party.transaction_id, "task_updated", `${party.name} marked task ${status}`)

  return NextResponse.json({ ok: true })
}
