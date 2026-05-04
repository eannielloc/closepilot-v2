"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"
import { explainMilestone } from "@/lib/milestone-explanations"
import {
  Zap, CheckCircle2, Circle, Clock, Calendar, DollarSign, FileText, AlertTriangle,
  MapPin, Shield, ChevronDown, ChevronUp, Info, Upload, Send, Loader2, MessageSquare,
  Home, Briefcase, Phone, Mail, Building2, ListChecks, ExternalLink, Eye
} from "lucide-react"

type Role =
  | "buyer" | "seller" | "lender" | "title" | "attorney" | "inspector"
  | "appraiser" | "contractor" | "listing_agent" | "buyers_agent" | "other"

interface PortalData {
  party: {
    id: string
    role: Role
    roleLabel: string
    name: string
    email: string | null
    phone: string | null
    company: string | null
  }
  transaction: {
    id: string
    propertyAddress: string
    status: string
    buyerName: string
    sellerName: string
    purchasePrice: number
    effectiveDate: string
    closingDate: string
    contractType: string
  }
  agent: {
    name: string
    email: string
    phone: string | null
    brokerage: string | null
  } | null
  milestones: Array<{
    id: string
    name: string
    type: string
    dueDate: string
    status: string
    notes: string | null
  }>
  parties: Array<{
    id: string
    role: Role
    roleLabel: string
    name: string
    email: string | null
    phone: string | null
    company: string | null
  }>
  documents: Array<{ id: string; name: string; status: string; hasFile: boolean }>
  tasks: Array<{
    id: string
    title: string
    description: string | null
    status: string
    dueDate: string | null
    completedAt: string | null
    documentId: string | null
  }>
  messages: Array<{
    id: string
    authorRole: string
    authorName: string | null
    body: string
    createdAt: string
  }>
}

const VENDOR_ROLES: Role[] = ["lender", "title", "attorney", "inspector", "appraiser", "contractor"]

function isVendor(role: Role): boolean {
  return VENDOR_ROLES.includes(role)
}

function roleIcon(role: Role) {
  if (role === "buyer" || role === "seller") return Home
  if (role === "lender") return Building2
  if (role === "inspector" || role === "appraiser") return Eye
  if (role === "attorney" || role === "title") return Shield
  return Briefcase
}

export default function PortalPage({ params }: { params: { token: string } }) {
  const [data, setData] = useState<PortalData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = async () => {
    try {
      const res = await fetch(`/api/portal/${params.token}`, { cache: "no-store" })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setError(j.error || "Could not load portal")
        return
      }
      setData(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refresh() }, [params.token]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-8 shadow-lg text-center max-w-md">
          <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Link Invalid</h1>
          <p className="text-gray-500 text-sm">
            {error || "This invite link may have expired or been revoked. Ask the agent for a new one."}
          </p>
        </div>
      </div>
    )
  }

  return <PortalView data={data} token={params.token} onRefresh={refresh} />
}

function PortalView({ data, token, onRefresh }: { data: PortalData; token: string; onRefresh: () => Promise<void> }) {
  const { party, transaction: tx, agent } = data
  const RoleIcon = roleIcon(party.role)
  const completedTasks = data.tasks.filter((t) => t.status === "completed").length
  const totalTasks = data.tasks.length
  const completedMs = data.milestones.filter((m) => m.status === "completed").length
  const totalMs = data.milestones.length
  const closeDate = new Date(tx.closingDate + "T12:00:00Z")
  const today = new Date()
  const daysToClose = Math.ceil((closeDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const nextMilestone = data.milestones.find((m) => m.status !== "completed")

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-base tracking-tight">ClosePilot</span>
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-gray-500">
              <RoleIcon className="h-3.5 w-3.5" />
              {party.roleLabel} portal
            </span>
            <a
              href={`/api/transactions/${tx.id}/calendar.ics`}
              className="inline-flex items-center gap-1.5 px-3 h-8 rounded-md border bg-white hover:bg-gray-50 text-xs"
              title="Add deadlines to your calendar"
            >
              <Calendar className="h-3 w-3" />
              <span className="hidden sm:inline">Add to Calendar</span>
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Welcome, {party.name.split(" ")[0]}</p>
          <h1 className="text-2xl font-bold tracking-tight">{tx.propertyAddress}</h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
            <Briefcase className="h-3.5 w-3.5" />
            {tx.buyerName} {tx.buyerName && tx.sellerName ? "→" : ""} {tx.sellerName}
            {agent && <> · Agent: <span className="text-gray-700 font-medium">{agent.name}</span></>}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={DollarSign} label="Purchase" value={formatCurrency(tx.purchasePrice)} />
          <StatCard icon={Calendar} label="Closing" value={formatDate(tx.closingDate)} />
          <StatCard icon={Clock} label={daysToClose >= 0 ? "Days to Close" : "Days past"} value={Math.abs(daysToClose).toString()} highlight={daysToClose >= 0 && daysToClose <= 7} />
        </div>

        {/* What's next */}
        {nextMilestone && (
          <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-blue-600 text-white w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">!</div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider mb-0.5">What's next</p>
                <p className="text-sm font-semibold text-blue-900">{nextMilestone.name}</p>
                <p className="text-xs text-blue-800 mt-0.5">Target {formatDate(nextMilestone.dueDate)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Role-specific main content */}
        {isVendor(party.role) ? (
          <VendorView data={data} token={token} onRefresh={onRefresh} />
        ) : (
          <ClientView data={data} token={token} onRefresh={onRefresh} />
        )}

        {/* Progress + Timeline (shared) */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <ListChecks className="h-4 w-4" /> Transaction Timeline
            </h2>
            <span className="text-xs text-gray-500">{completedMs} of {totalMs} done</span>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all"
                style={{ width: `${totalMs ? (completedMs / totalMs) * 100 : 0}%` }}
              />
            </div>
            <div className="space-y-2">
              {data.milestones.map((ms) => (
                <MilestoneRow key={ms.id} milestone={ms} />
              ))}
            </div>
          </div>
        </section>

        {/* Messages */}
        <section>
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> Messages with your agent
          </h2>
          <MessagesPanel data={data} token={token} onRefresh={onRefresh} />
        </section>

        {/* Parties */}
        <section>
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
            <Briefcase className="h-4 w-4" /> Everyone on this deal
          </h2>
          <div className="bg-white rounded-xl border divide-y">
            {data.parties.map((p) => (
              <div key={p.id} className="p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <Briefcase className="h-3.5 w-3.5 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {p.roleLabel}{p.company ? ` · ${p.company}` : ""}
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
                  {p.email && <a href={`mailto:${p.email}`} className="hover:text-gray-900"><Mail className="h-3.5 w-3.5" /></a>}
                  {p.phone && <a href={`tel:${p.phone}`} className="hover:text-gray-900"><Phone className="h-3.5 w-3.5" /></a>}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-xs text-gray-400 py-8">
          <p>Powered by ClosePilot · AI Transaction Coordinator</p>
          <p className="mt-1">This portal is yours alone — please don't share the link.</p>
        </footer>
      </main>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, highlight }: { icon: typeof Calendar; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`bg-white rounded-xl border p-3 ${highlight ? "border-red-200 bg-red-50" : ""}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={`h-3 w-3 ${highlight ? "text-red-500" : "text-gray-400"}`} />
        <p className="text-[10px] uppercase tracking-wider text-gray-500">{label}</p>
      </div>
      <p className={`text-base font-bold ${highlight ? "text-red-700" : ""}`}>{value}</p>
    </div>
  )
}

function MilestoneRow({ milestone }: { milestone: PortalData["milestones"][number] }) {
  const [open, setOpen] = useState(false)
  const isOverdue = milestone.status === "pending" && new Date(milestone.dueDate) < new Date()
  const explanation = explainMilestone(milestone.name, milestone.type)

  return (
    <div className={`rounded-lg border ${isOverdue ? "border-red-200 bg-red-50/30" : milestone.status === "completed" ? "border-green-200 bg-green-50/30" : "border-gray-200 bg-white"}`}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="w-full flex items-center gap-3 p-3 text-left">
        {milestone.status === "completed" ? (
          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
        ) : isOverdue ? (
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
        ) : (
          <Circle className="h-5 w-5 text-gray-300 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${milestone.status === "completed" ? "text-gray-400 line-through" : isOverdue ? "text-red-700 font-medium" : "font-medium"}`}>
            {milestone.name}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{formatDate(milestone.dueDate)}</p>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />}
      </button>
      {open && (
        <div className="px-3 pb-3 -mt-1">
          <div className="rounded-md bg-blue-50 border border-blue-100 p-3">
            <div className="flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-blue-900 uppercase tracking-wide">What this is</p>
                <p className="text-xs text-blue-900 leading-relaxed">{explanation.whatItIs}</p>
                <p className="text-[10px] font-semibold text-blue-900 uppercase tracking-wide pt-1">What you should do</p>
                <p className="text-xs text-blue-900 leading-relaxed">{explanation.whatYouNeedToDo}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function VendorView({ data, token, onRefresh }: { data: PortalData; token: string; onRefresh: () => Promise<void> }) {
  return (
    <section>
      <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
        <ListChecks className="h-4 w-4" /> Your tasks for this deal
      </h2>
      <TasksPanel data={data} token={token} onRefresh={onRefresh} />
    </section>
  )
}

function ClientView({ data, token, onRefresh }: { data: PortalData; token: string; onRefresh: () => Promise<void> }) {
  if (data.tasks.length === 0) return null
  return (
    <section>
      <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
        <ListChecks className="h-4 w-4" /> Your action items
      </h2>
      <TasksPanel data={data} token={token} onRefresh={onRefresh} />
    </section>
  )
}

function TasksPanel({ data, token, onRefresh }: { data: PortalData; token: string; onRefresh: () => Promise<void> }) {
  if (data.tasks.length === 0) {
    return (
      <div className="bg-white rounded-xl border p-6 text-center">
        <CheckCircle2 className="h-8 w-8 mx-auto text-gray-300 mb-2" />
        <p className="text-sm text-gray-500">No outstanding tasks for you right now.</p>
      </div>
    )
  }
  return (
    <div className="space-y-2">
      {data.tasks.map((t) => (
        <TaskRow key={t.id} task={t} token={token} onRefresh={onRefresh} />
      ))}
    </div>
  )
}

function TaskRow({ task, token, onRefresh }: { task: PortalData["tasks"][number]; token: string; onRefresh: () => Promise<void> }) {
  const [busy, setBusy] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const setStatus = async (status: string) => {
    setBusy(true)
    try {
      await fetch(`/api/portal/${token}/tasks`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.id, status }),
      })
      await onRefresh()
    } finally {
      setBusy(false)
    }
  }

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setBusy(true)
    try {
      const fd = new FormData()
      for (const f of files) fd.append("files", f)
      fd.append("taskId", task.id)
      await fetch(`/api/portal/${token}/upload`, { method: "POST", body: fd })
      await onRefresh()
    } finally {
      setBusy(false)
      if (fileInput.current) fileInput.current.value = ""
    }
  }

  const completed = task.status === "completed"
  const isUploadTask = /upload/i.test(task.title)
  const overdue = !completed && task.dueDate && new Date(task.dueDate) < new Date()

  return (
    <div className={`bg-white rounded-xl border p-4 ${completed ? "opacity-60" : ""} ${overdue ? "border-red-200" : ""}`}>
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => setStatus(completed ? "pending" : "completed")}
          disabled={busy}
          className="mt-0.5 shrink-0"
          aria-label="Toggle complete"
        >
          {completed ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <Circle className="h-5 w-5 text-gray-300 hover:text-gray-500" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${completed ? "line-through text-gray-400" : ""}`}>{task.title}</p>
          {task.description && (
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{task.description}</p>
          )}
          {task.dueDate && (
            <p className={`text-[11px] mt-1 ${overdue ? "text-red-600 font-medium" : "text-gray-400"}`}>
              Due {formatDate(task.dueDate)} {overdue && "· overdue"}
            </p>
          )}
          {isUploadTask && !completed && (
            <div className="mt-2.5">
              <input ref={fileInput} type="file" hidden onChange={upload} multiple />
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={busy}
                className="inline-flex items-center gap-1.5 px-3 h-8 rounded-md bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-60"
              >
                {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                Upload file
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MessagesPanel({ data, token, onRefresh }: { data: PortalData; token: string; onRefresh: () => Promise<void> }) {
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)

  const send = async () => {
    const body = draft.trim()
    if (!body) return
    setSending(true)
    try {
      await fetch(`/api/portal/${token}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      })
      setDraft("")
      await onRefresh()
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border">
      <div className="max-h-72 overflow-y-auto p-4 space-y-3">
        {data.messages.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">No messages yet. Drop a note below.</p>
        ) : (
          data.messages.map((m) => {
            const mine = m.authorRole === data.party.role && m.authorName === data.party.name
            return (
              <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"}`}>
                  {m.body}
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5 px-1">
                  {m.authorName || m.authorRole} · {new Date(m.createdAt).toLocaleString()}
                </p>
              </div>
            )
          })
        )}
      </div>
      <div className="border-t p-3 flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="Type a quick message…"
          className="flex-1 rounded-md border px-3 h-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={sending}
        />
        <button
          type="button"
          onClick={send}
          disabled={sending || !draft.trim()}
          className="inline-flex items-center gap-1.5 px-3 h-9 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          Send
        </button>
      </div>
    </div>
  )
}
