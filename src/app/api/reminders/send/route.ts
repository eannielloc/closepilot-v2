import { NextRequest, NextResponse } from "next/server"
import { sendTemplatedEmail, sendEmail, TemplateType } from "@/lib/email"

// POST /api/reminders/send — send an email using templates or raw HTML
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { to, subject, template, data, html } = body

  if (!to) {
    return NextResponse.json({ error: "Missing 'to' field" }, { status: 400 })
  }

  // If a template type is provided, use templated sending
  if (template) {
    const result = await sendTemplatedEmail(to, template as TemplateType, data || {})
    return NextResponse.json(result)
  }

  // Otherwise send raw HTML
  if (!subject || !html) {
    return NextResponse.json({ error: "Need either 'template' + 'data' or 'subject' + 'html'" }, { status: 400 })
  }

  const result = await sendEmail({ to, subject, html })
  return NextResponse.json(result)
}
