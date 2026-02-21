import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const db = getDb()
  let prefs = db.prepare("SELECT * FROM notification_preferences WHERE user_id = ?").get(session.userId) as any
  if (!prefs) {
    db.prepare("INSERT INTO notification_preferences (user_id) VALUES (?)").run(session.userId)
    prefs = db.prepare("SELECT * FROM notification_preferences WHERE user_id = ?").get(session.userId) as any
  }

  return NextResponse.json({
    deadlineReminders: !!prefs.deadline_reminders,
    overdueAlerts: !!prefs.overdue_alerts,
    weeklyDigest: !!prefs.weekly_digest,
    reminderDaysBefore: prefs.reminder_days_before,
  })
}

export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const db = getDb()

  // Ensure row exists
  db.prepare("INSERT OR IGNORE INTO notification_preferences (user_id) VALUES (?)").run(session.userId)

  db.prepare(`
    UPDATE notification_preferences 
    SET deadline_reminders = ?, overdue_alerts = ?, weekly_digest = ?, reminder_days_before = ?
    WHERE user_id = ?
  `).run(
    body.deadlineReminders ? 1 : 0,
    body.overdueAlerts ? 1 : 0,
    body.weeklyDigest ? 1 : 0,
    body.reminderDaysBefore || 3,
    session.userId
  )

  return NextResponse.json({ success: true })
}
