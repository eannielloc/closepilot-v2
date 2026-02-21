import nodemailer from "nodemailer"

// ─── SMTP Configuration ─────────────────────────────────────────────
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com"
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587")
const SMTP_USER = process.env.SMTP_USER || ""
const SMTP_PASS = process.env.SMTP_PASS || ""
const SMTP_FROM = process.env.SMTP_FROM || "ClosePilot <noreply@closepilot.ai>"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://closepilot-v2-production.up.railway.app"

let _transporter: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter | null {
  if (!SMTP_USER || !SMTP_PASS) {
    console.warn("[ClosePilot Email] SMTP credentials not configured. Skipping email send.")
    return null
  }
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    })
  }
  return _transporter
}

// ─── Send Email ──────────────────────────────────────────────────────
export async function sendEmail(options: {
  to: string
  subject: string
  html: string
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const transporter = getTransporter()
  if (!transporter) {
    return { success: false, error: "SMTP not configured" }
  }
  try {
    const info = await transporter.sendMail({
      from: SMTP_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
    })
    return { success: true, messageId: info.messageId }
  } catch (err: any) {
    console.error("[ClosePilot Email] Send failed:", err.message)
    return { success: false, error: err.message }
  }
}

// ─── Template Types ──────────────────────────────────────────────────
export type TemplateType = "deadline_reminder" | "overdue_alert" | "milestone_completed" | "weekly_digest"

export interface DeadlineReminderData {
  agentName: string
  milestoneName: string
  dueDate: string
  daysUntil: number
  propertyAddress: string
  transactionId: string
}

export interface OverdueAlertData {
  agentName: string
  milestoneName: string
  dueDate: string
  daysOverdue: number
  propertyAddress: string
  transactionId: string
}

export interface MilestoneCompletedData {
  agentName: string
  milestoneName: string
  propertyAddress: string
  transactionId: string
  completedDate: string
}

export interface WeeklyDigestData {
  agentName: string
  activeTransactions: number
  totalVolume: number
  upcomingDeadlines: Array<{ name: string; dueDate: string; propertyAddress: string; transactionId: string }>
  overdueItems: Array<{ name: string; dueDate: string; propertyAddress: string; transactionId: string }>
  completedThisWeek: Array<{ name: string; propertyAddress: string }>
}

// ─── Render Template ─────────────────────────────────────────────────
export function renderTemplate(type: TemplateType, data: any): { subject: string; html: string } {
  switch (type) {
    case "deadline_reminder":
      return renderDeadlineReminder(data as DeadlineReminderData)
    case "overdue_alert":
      return renderOverdueAlert(data as OverdueAlertData)
    case "milestone_completed":
      return renderMilestoneCompleted(data as MilestoneCompletedData)
    case "weekly_digest":
      return renderWeeklyDigest(data as WeeklyDigestData)
    default:
      throw new Error(`Unknown template type: ${type}`)
  }
}

// ─── Send Templated Email ────────────────────────────────────────────
export async function sendTemplatedEmail(
  to: string,
  type: TemplateType,
  data: any
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { subject, html } = renderTemplate(type, data)
  return sendEmail({ to, subject, html })
}

// ─── Base Layout ─────────────────────────────────────────────────────
function baseLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:32px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
<!-- Header -->
<tr><td style="background:linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%);padding:28px 32px;text-align:center;">
<h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">🏠 ClosePilot</h1>
<p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">AI Transaction Coordinator</p>
</td></tr>
<!-- Body -->
<tr><td style="padding:32px;">
${content}
</td></tr>
<!-- Footer -->
<tr><td style="padding:24px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
<p style="margin:0 0 8px;color:#6b7280;font-size:12px;">You're receiving this because you have notifications enabled in ClosePilot.</p>
<p style="margin:0;color:#9ca3af;font-size:11px;">
<a href="${APP_URL}/settings" style="color:#2563eb;text-decoration:none;">Manage notification preferences</a> · 
<a href="${APP_URL}" style="color:#2563eb;text-decoration:none;">Open ClosePilot</a>
</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`
}

function actionButton(text: string, url: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td>
<a href="${url}" style="display:inline-block;background:#2563eb;color:#ffffff;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;">
${text}</a></td></tr></table>`
}

function formatDate(d: string): string {
  return new Date(d + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
}

// ─── Template: Deadline Reminder ─────────────────────────────────────
function renderDeadlineReminder(data: DeadlineReminderData): { subject: string; html: string } {
  const urgency = data.daysUntil <= 1 ? "🔴" : data.daysUntil <= 3 ? "🟡" : "🔵"
  const subject = `${urgency} Deadline in ${data.daysUntil} day${data.daysUntil !== 1 ? "s" : ""}: ${data.milestoneName}`
  const html = baseLayout(`
<h2 style="margin:0 0 8px;font-size:20px;color:#111827;">Upcoming Deadline</h2>
<p style="margin:0 0 24px;color:#6b7280;font-size:14px;">Hi ${data.agentName}, you have a milestone due soon.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border-radius:8px;border-left:4px solid #2563eb;padding:0;">
<tr><td style="padding:16px 20px;">
<p style="margin:0 0 4px;font-size:16px;font-weight:600;color:#1e3a5f;">${data.milestoneName}</p>
<p style="margin:0 0 4px;font-size:14px;color:#4b5563;">📍 ${data.propertyAddress}</p>
<p style="margin:0;font-size:14px;color:#4b5563;">📅 Due: <strong>${formatDate(data.dueDate)}</strong> (${data.daysUntil} day${data.daysUntil !== 1 ? "s" : ""} away)</p>
</td></tr></table>
${actionButton("View Transaction →", `${APP_URL}/transactions/${data.transactionId}`)}
`)
  return { subject, html }
}

// ─── Template: Overdue Alert ─────────────────────────────────────────
function renderOverdueAlert(data: OverdueAlertData): { subject: string; html: string } {
  const subject = `🚨 OVERDUE: ${data.milestoneName} — ${data.propertyAddress}`
  const html = baseLayout(`
<h2 style="margin:0 0 8px;font-size:20px;color:#dc2626;">⚠️ Overdue Milestone</h2>
<p style="margin:0 0 24px;color:#6b7280;font-size:14px;">Hi ${data.agentName}, this milestone is past due and needs attention.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border-radius:8px;border-left:4px solid #dc2626;padding:0;">
<tr><td style="padding:16px 20px;">
<p style="margin:0 0 4px;font-size:16px;font-weight:600;color:#991b1b;">${data.milestoneName}</p>
<p style="margin:0 0 4px;font-size:14px;color:#4b5563;">📍 ${data.propertyAddress}</p>
<p style="margin:0;font-size:14px;color:#dc2626;">📅 Was due: <strong>${formatDate(data.dueDate)}</strong> (${data.daysOverdue} day${data.daysOverdue !== 1 ? "s" : ""} overdue)</p>
</td></tr></table>
${actionButton("Take Action →", `${APP_URL}/transactions/${data.transactionId}`)}
`)
  return { subject, html }
}

// ─── Template: Milestone Completed ───────────────────────────────────
function renderMilestoneCompleted(data: MilestoneCompletedData): { subject: string; html: string } {
  const subject = `✅ Completed: ${data.milestoneName} — ${data.propertyAddress}`
  const html = baseLayout(`
<h2 style="margin:0 0 8px;font-size:20px;color:#059669;">🔑 Milestone Completed</h2>
<p style="margin:0 0 24px;color:#6b7280;font-size:14px;">Great news, ${data.agentName}! A milestone has been completed.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#ecfdf5;border-radius:8px;border-left:4px solid #059669;padding:0;">
<tr><td style="padding:16px 20px;">
<p style="margin:0 0 4px;font-size:16px;font-weight:600;color:#065f46;">${data.milestoneName}</p>
<p style="margin:0 0 4px;font-size:14px;color:#4b5563;">📍 ${data.propertyAddress}</p>
<p style="margin:0;font-size:14px;color:#4b5563;">📅 Completed: <strong>${formatDate(data.completedDate)}</strong></p>
</td></tr></table>
${actionButton("View Transaction →", `${APP_URL}/transactions/${data.transactionId}`)}
`)
  return { subject, html }
}

// ─── Template: Weekly Digest ─────────────────────────────────────────
function renderWeeklyDigest(data: WeeklyDigestData): { subject: string; html: string } {
  const subject = `📊 Your Weekly ClosePilot Digest`

  const overdueSection = data.overdueItems.length > 0 ? `
<h3 style="margin:24px 0 12px;font-size:16px;color:#dc2626;">🚨 Overdue Items (${data.overdueItems.length})</h3>
${data.overdueItems.map(item => `
<div style="padding:10px 16px;background:#fef2f2;border-radius:6px;margin-bottom:8px;border-left:3px solid #dc2626;">
<p style="margin:0;font-size:14px;"><strong>${item.name}</strong></p>
<p style="margin:2px 0 0;font-size:12px;color:#6b7280;">${item.propertyAddress} · Due: ${formatDate(item.dueDate)}</p>
</div>`).join("")}` : ""

  const upcomingSection = data.upcomingDeadlines.length > 0 ? `
<h3 style="margin:24px 0 12px;font-size:16px;color:#1e3a5f;">📅 Upcoming This Week (${data.upcomingDeadlines.length})</h3>
${data.upcomingDeadlines.map(item => `
<div style="padding:10px 16px;background:#eff6ff;border-radius:6px;margin-bottom:8px;border-left:3px solid #2563eb;">
<p style="margin:0;font-size:14px;"><strong>${item.name}</strong></p>
<p style="margin:2px 0 0;font-size:12px;color:#6b7280;">${item.propertyAddress} · Due: ${formatDate(item.dueDate)}</p>
</div>`).join("")}` : ""

  const completedSection = data.completedThisWeek.length > 0 ? `
<h3 style="margin:24px 0 12px;font-size:16px;color:#059669;">✅ Completed This Week (${data.completedThisWeek.length})</h3>
${data.completedThisWeek.map(item => `
<div style="padding:10px 16px;background:#ecfdf5;border-radius:6px;margin-bottom:8px;border-left:3px solid #059669;">
<p style="margin:0;font-size:14px;"><strong>${item.name}</strong></p>
<p style="margin:2px 0 0;font-size:12px;color:#6b7280;">${item.propertyAddress}</p>
</div>`).join("")}` : ""

  const html = baseLayout(`
<h2 style="margin:0 0 8px;font-size:20px;color:#111827;">Weekly Summary</h2>
<p style="margin:0 0 24px;color:#6b7280;font-size:14px;">Hi ${data.agentName}, here's your week at a glance.</p>

<!-- Stats Row -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
<tr>
<td width="50%" style="padding:4px;">
<div style="background:#f0f9ff;border-radius:8px;padding:16px;text-align:center;">
<p style="margin:0;font-size:28px;font-weight:700;color:#2563eb;">${data.activeTransactions}</p>
<p style="margin:4px 0 0;font-size:12px;color:#6b7280;">Active Transactions</p>
</div>
</td>
<td width="50%" style="padding:4px;">
<div style="background:#f0fdf4;border-radius:8px;padding:16px;text-align:center;">
<p style="margin:0;font-size:28px;font-weight:700;color:#059669;">$${(data.totalVolume / 1000000).toFixed(1)}M</p>
<p style="margin:4px 0 0;font-size:12px;color:#6b7280;">Total Volume</p>
</div>
</td>
</tr>
</table>

${overdueSection}
${upcomingSection}
${completedSection}

${!data.overdueItems.length && !data.upcomingDeadlines.length && !data.completedThisWeek.length ? `
<div style="padding:24px;text-align:center;background:#f9fafb;border-radius:8px;">
<p style="margin:0;color:#6b7280;font-size:14px;">🎉 All clear this week! No pending items.</p>
</div>` : ""}

${actionButton("Open Dashboard →", APP_URL)}
`)
  return { subject, html }
}
