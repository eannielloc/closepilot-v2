import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { sendTemplatedEmail } from "@/lib/email"

// GET /api/reminders/digest — send weekly digest to all opted-in users
export async function GET() {
  const db = getDb()
  const results: Array<{ user: string; status: string }> = []

  const users = db.prepare(`
    SELECT u.id, u.email, u.name, np.weekly_digest
    FROM users u
    LEFT JOIN notification_preferences np ON u.id = np.user_id
    WHERE np.weekly_digest = 1 OR np.weekly_digest IS NULL
  `).all() as any[]

  for (const user of users) {
    const activeCount = (db.prepare(`
      SELECT COUNT(*) as c FROM transactions WHERE agent_id = ? AND status IN ('active', 'new')
    `).get(user.id) as any).c

    const totalVolume = (db.prepare(`
      SELECT COALESCE(SUM(purchase_price), 0) as v FROM transactions WHERE agent_id = ?
    `).get(user.id) as any).v

    const upcoming = db.prepare(`
      SELECT m.name, m.due_date, t.property_address, t.id as transaction_id
      FROM milestones m JOIN transactions t ON m.transaction_id = t.id
      WHERE t.agent_id = ? AND m.status = 'pending'
        AND m.due_date BETWEEN date('now') AND date('now', '+7 days')
      ORDER BY m.due_date
    `).all(user.id) as any[]

    const overdue = db.prepare(`
      SELECT m.name, m.due_date, t.property_address, t.id as transaction_id
      FROM milestones m JOIN transactions t ON m.transaction_id = t.id
      WHERE t.agent_id = ? AND m.status = 'pending' AND m.due_date < date('now')
      ORDER BY m.due_date
    `).all(user.id) as any[]

    const completed = db.prepare(`
      SELECT m.name, t.property_address
      FROM milestones m JOIN transactions t ON m.transaction_id = t.id
      WHERE t.agent_id = ? AND m.status = 'completed'
        AND m.created_at >= date('now', '-7 days')
      ORDER BY m.created_at DESC
    `).all(user.id) as any[]

    const result = await sendTemplatedEmail(user.email, "weekly_digest", {
      agentName: user.name,
      activeTransactions: activeCount,
      totalVolume,
      upcomingDeadlines: upcoming.map((u: any) => ({
        name: u.name, dueDate: u.due_date, propertyAddress: u.property_address, transactionId: u.transaction_id,
      })),
      overdueItems: overdue.map((o: any) => ({
        name: o.name, dueDate: o.due_date, propertyAddress: o.property_address, transactionId: o.transaction_id,
      })),
      completedThisWeek: completed.map((c: any) => ({
        name: c.name, propertyAddress: c.property_address,
      })),
    })

    results.push({ user: user.email, status: result.success ? "sent" : result.error || "failed" })
  }

  return NextResponse.json({ digest: new Date().toISOString(), users: results, total: results.length })
}
