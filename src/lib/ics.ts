// iCalendar (.ics) generation — RFC 5545 compatible.

interface IcsEvent {
  uid: string
  summary: string
  description?: string
  location?: string
  start: string // YYYY-MM-DD (all-day)
  end?: string // YYYY-MM-DD (exclusive)
  url?: string
}

function escape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;")
}

function fold(line: string): string {
  // RFC 5545: lines longer than 75 octets must be folded.
  if (line.length <= 75) return line
  const out: string[] = []
  let i = 0
  while (i < line.length) {
    out.push(i === 0 ? line.slice(0, 75) : " " + line.slice(i, i + 74))
    i += i === 0 ? 75 : 74
  }
  return out.join("\r\n")
}

function dt(s: string): string {
  return s.replace(/-/g, "")
}

function addOneDay(yyyymmdd: string): string {
  const d = new Date(yyyymmdd + "T12:00:00Z")
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().split("T")[0]
}

export function buildIcs(opts: {
  calName: string
  calDescription?: string
  events: IcsEvent[]
}): string {
  const dtstamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "").replace(/Z$/, "Z")
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ClosePilot//Real Estate Transaction Coordinator//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    fold(`X-WR-CALNAME:${escape(opts.calName)}`),
  ]
  if (opts.calDescription) {
    lines.push(fold(`X-WR-CALDESC:${escape(opts.calDescription)}`))
  }

  for (const e of opts.events) {
    lines.push("BEGIN:VEVENT")
    lines.push(`UID:${e.uid}`)
    lines.push(`DTSTAMP:${dtstamp}`)
    lines.push(`DTSTART;VALUE=DATE:${dt(e.start)}`)
    lines.push(`DTEND;VALUE=DATE:${dt(e.end || addOneDay(e.start))}`)
    lines.push(fold(`SUMMARY:${escape(e.summary)}`))
    if (e.description) lines.push(fold(`DESCRIPTION:${escape(e.description)}`))
    if (e.location) lines.push(fold(`LOCATION:${escape(e.location)}`))
    if (e.url) lines.push(fold(`URL:${e.url}`))
    lines.push("BEGIN:VALARM")
    lines.push("ACTION:DISPLAY")
    lines.push("TRIGGER:-P1D") // 24 hour reminder
    lines.push(fold(`DESCRIPTION:${escape(e.summary)}`))
    lines.push("END:VALARM")
    lines.push("END:VEVENT")
  }

  lines.push("END:VCALENDAR")
  return lines.join("\r\n") + "\r\n"
}
