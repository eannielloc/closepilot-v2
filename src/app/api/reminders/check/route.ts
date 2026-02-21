import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { sendTemplatedEmail } from "@/lib/email"
import { v4 as uuid } from "uuid"

// GET /api/reminders/check — scan milestones and send reminders
export async function GET() {
  const db = getDb()
  const results: Array<{ type: string; milestone: string; property: string; status: string }> = []

  // Get all users with notification preferences
  const users = db.prepare(`
    SELECT u.id, u.email, u.name, np.deadline_reminders, np.overdue_alerts, np.reminder_days_before
    FROM users u
    LEFT JOIN notification_preferences np ON u.id = np.user_id
  `).all() as any[]

  for (const user of users) {
    const deadlineReminders = user.deadline_reminders ?? 1
    const overdueAlerts = user.overdue_alerts ?? 1
    const daysBefore = user.reminder_days_before ?? 3

    // Get upcoming milestones for this user's transactions
    if (deadlineReminders) {
      const upcoming = db.prepare(`
        SELECT m.id, m.name, m.due_date, t.property_address, t.id as transaction_id
        FROM milestones m
        JOIN transactions t ON m.transaction_id = t.id
        WHERE t.agent_id = ?
          AND m.status = 'pending'
          AND m.due_date BETWEEN date('now') AND date('now', '+' || ? || ' days')
      `).all(user.id, daysBefore) as any[]

      for (const ms of upcoming) {
        // Check if already sent today
        const alreadySent = db.prepare(`
          SELECT id FROM sent_reminders 
          WHERE milestone_id = ? AND user_id = ? AND type = 'deadline_reminder'
          AND date(sent_at) = date('now')
        `).get(ms.id, user.id)

        if (alreadySent) continue

        const daysUntil = Math.ceil((new Date(ms.due_date + "T12:00:00Z").getTime() - Date.now()) / 86400000)
        const result = await sendTemplatedEmail(user.email, "deadline_reminder", {
          agentName: user.name,
          milestoneName: ms.name,
          dueDate: ms.due_date,
          daysUntil: Math.max(0, daysUntil),
          propertyAddress: ms.property_address,
          transactionId: ms.transaction_id,
        })

        db.prepare("INSERT INTO sent_reminders (id, milestone_id, user_id, type) VALUES (?, ?, ?, ?)")
          .run(`sr_${uuid().slice(0, 8)}`, ms.id, user.id, "deadline_reminder")

        results.push({ type: "deadline_reminder", milestone: ms.name, property: ms.property_address, status: result.success ? "sent" : result.error || "failed" })
      }
    }

    // Overdue milestones
    if (overdueAlerts) {
      const overdue = db.prepare(`
        SELECT m.id, m.name, m.due_date, t.property_address, t.id as transaction_id
        FROM milestones m
        JOIN transactions t ON m.transaction_id = t.id
        WHERE t.agent_id = ?
          AND m.status = 'pending'
          AND m.due_date < date('now')
      `).all(user.id) as any[]

      for (const ms of overdue) {
        const alreadySent = db.prepare(`
          SELECT id FROM sent_reminders 
          WHERE milestone_id = ? AND user_id = ? AND type = 'overdue_alert'
          AND date(sent_at) = date('now')
        `).get(ms.id, user.id)

        if (alreadySent) continue

        const daysOverdue = Math.ceil((Date.now() - new Date(ms.due_date + "T12:00:00Z").getTime()) / 86400000)
        const result = await sendTemplatedEmail(user.email, "overdue_alert", {
          agentName: user.name,
          milestoneName: ms.name,
          dueDate: ms.due_date,
          daysOverdue,
          propertyAddress: ms.property_address,
          transactionId: ms.transaction_id,
        })

        db.prepare("INSERT INTO sent_reminders (id, milestone_id, user_id, type) VALUES (?, ?, ?, ?)")
          .run(`sr_${uuid().slice(0, 8)}`, ms.id, user.id, "overdue_alert")

        results.push({ type: "overdue_alert", milestone: ms.name, property: ms.property_address, status: result.success ? "sent" : result.error || "failed" })
      }
    }
  }

  return NextResponse.json({ checked: new Date().toISOString(), reminders: results, total: results.length })
}
