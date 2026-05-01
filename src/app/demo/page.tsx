"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate, daysUntil } from "@/lib/utils"
import {
  Zap, ArrowLeft, CalendarDays, Share2, MapPin, DollarSign, Calendar, Clock,
  CheckCircle2, FileText, Users, AlertTriangle, ShieldCheck, Sparkles,
  ListChecks, MessageSquare, ChevronRight, Eye, Lock
} from "lucide-react"

// Sample transaction with realistic CT SmartMLS data — read-only.
const SAMPLE_TX = {
  id: "demo",
  propertyAddress: "252 Shelton St, Bridgeport, CT 06608",
  buyerName: "Ayisha Wint",
  sellerName: "Ruth Cogdell & Malika Tulloch",
  purchasePrice: 300000,
  effectiveDate: "2026-01-22",
  closingDate: "2026-03-13",
  contractType: "CT SmartMLS Standard Form",
  status: "active",
  milestones: [
    { id: "ms_1", name: "Contract Executed / Initial Deposit ($3,000)", type: "deposit", dueDate: "2026-01-22", status: "completed" },
    { id: "ms_2", name: "Attorney Review Deadline (5 business days)", type: "attorney_review", dueDate: "2026-01-29", status: "completed" },
    { id: "ms_3", name: "Inspection Completion Deadline", type: "inspection", dueDate: "2026-02-02", status: "completed" },
    { id: "ms_4", name: "Inspection Objection Deadline", type: "inspection", dueDate: "2026-02-04", status: "completed" },
    { id: "ms_5", name: "Additional Deposit Due ($7,500)", type: "deposit", dueDate: "2026-02-06", status: "completed" },
    { id: "ms_6", name: "Title Search Completion", type: "title", dueDate: "2026-02-17", status: "pending" },
    { id: "ms_7", name: "Title Objection Deadline", type: "title", dueDate: "2026-02-19", status: "pending" },
    { id: "ms_8", name: "Mortgage Commitment Deadline", type: "loan_approval", dueDate: "2026-02-27", status: "pending" },
    { id: "ms_9", name: "Final Walkthrough", type: "other", dueDate: "2026-03-12", status: "pending" },
    { id: "ms_10", name: "CLOSING DATE — Fairfield County", type: "closing", dueDate: "2026-03-13", status: "pending" },
  ],
  parties: [
    { id: "p_1", role: "buyer", name: "Ayisha Wint", email: "ayisha.wint@email.com", phone: "(203) 555-0142" },
    { id: "p_2", role: "seller", name: "Ruth Cogdell", email: "ruth.c@email.com" },
    { id: "p_3", role: "listing_agent", name: "Valerie King", company: "Keller Williams Realty Prtnrs", email: "valerie.king@kw.com", phone: "(203) 555-0142" },
    { id: "p_4", role: "buyers_agent", name: "Demo Agent", company: "Premier Realty Group", email: "demo@closepilot.ai" },
    { id: "p_5", role: "lender", name: "Sarah Chen", company: "Webster Bank", email: "schen@websterbank.com" },
  ],
}

const SAMPLE_REVIEW = {
  summary: "Identified 3 items worth attention before going firm.",
  flags: [
    {
      severity: "medium" as const,
      category: "concession",
      title: "3% seller concession",
      detail: "Concession of \"3% toward buyer closing costs\" — verify lender allows this amount and that appraisal supports the inflated price.",
      recommendation: "Run the concession by buyer's lender before going firm. Document reason in case appraisal questions arise.",
    },
    {
      severity: "medium" as const,
      category: "financing",
      title: "Very high LTV: 97%",
      detail: "Mortgage of $289,500 is 97% of purchase price. Limited margin if appraisal comes in low.",
      recommendation: "Discuss appraisal gap coverage with buyer. Consider FHA/VA paths if conventional becomes risky.",
    },
    {
      severity: "low" as const,
      category: "deposit",
      title: "Earnest money below 1%",
      detail: "Initial deposit of $3,000 is only 1.00% of purchase price.",
      recommendation: "Buyer may appear weak vs competing offers. Consider increasing if escalating.",
    },
  ],
  source: "ai" as const,
}

const SEV_STYLES = {
  high:   { bg: "bg-red-50",     border: "border-red-200",     text: "text-red-900",    chip: "bg-red-100 text-red-700",       icon: "text-red-600" },
  medium: { bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-900",  chip: "bg-amber-100 text-amber-700", icon: "text-amber-600" },
  low:    { bg: "bg-blue-50",    border: "border-blue-200",    text: "text-blue-900",   chip: "bg-blue-100 text-blue-700",    icon: "text-blue-600" },
  info:   { bg: "bg-slate-50",   border: "border-slate-200",   text: "text-slate-900",  chip: "bg-slate-100 text-slate-700", icon: "text-slate-500" },
}

const ROLE_LABELS: Record<string, string> = {
  buyer: "Buyer", seller: "Seller", listing_agent: "Listing Agent",
  buyers_agent: "Buyer's Agent", lender: "Lender", attorney: "Attorney",
  inspector: "Inspector", title: "Title Co.",
}

function DemoBanner() {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 px-4 text-sm">
      <div className="container flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          <span className="font-medium">Demo mode</span>
          <span className="text-blue-100 hidden sm:inline">— sample transaction, read-only</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/register">
            <Button size="sm" variant="secondary" className="h-7 text-xs gap-1">
              Sign up to save your own
              <ChevronRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

function ReadOnlyTooltip({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative group">
      {children}
      <div className="absolute -top-9 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center gap-1 bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap pointer-events-none">
        <Lock className="h-2.5 w-2.5" /> Sign up to enable
      </div>
    </div>
  )
}

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState<"timeline" | "documents" | "parties" | "review">("timeline")
  const tx = SAMPLE_TX
  const closeDays = daysUntil(tx.closingDate)
  const completedCount = tx.milestones.filter((m) => m.status === "completed").length
  const progress = (completedCount / tx.milestones.length) * 100

  return (
    <div className="min-h-screen bg-background">
      <DemoBanner />

      {/* Header */}
      <header className="border-b bg-white">
        <div className="container flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary text-primary-foreground">
              <Zap className="h-4 w-4" />
            </div>
            <span className="font-bold text-base tracking-tight">ClosePilot</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login"><Button size="sm" variant="ghost">Sign In</Button></Link>
            <Link href="/register"><Button size="sm">Get Started Free</Button></Link>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to home
        </Link>

        {/* Title row */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div className="space-y-1">
            <Badge variant="outline" className="text-xs">
              {tx.contractType}
            </Badge>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{tx.propertyAddress}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Users className="h-3.5 w-3.5" />
              {tx.buyerName} ← {tx.sellerName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ReadOnlyTooltip>
              <Button variant="outline" size="sm" className="gap-1.5" disabled>
                <CalendarDays className="h-3.5 w-3.5" /> Add to Calendar
              </Button>
            </ReadOnlyTooltip>
            <ReadOnlyTooltip>
              <Button variant="outline" size="sm" className="gap-1.5" disabled>
                <Share2 className="h-3.5 w-3.5" /> Share
              </Button>
            </ReadOnlyTooltip>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Purchase Price", value: formatCurrency(tx.purchasePrice), icon: DollarSign, color: "text-emerald-600" },
            { label: "Effective Date", value: formatDate(tx.effectiveDate), icon: Calendar, color: "text-blue-600" },
            { label: "Closing Date", value: formatDate(tx.closingDate), icon: Calendar, color: "text-violet-600" },
            { label: "Days to Close", value: closeDays !== null ? (closeDays > 0 ? `${closeDays} days` : "Past") : "—", icon: Clock, color: closeDays !== null && closeDays <= 7 ? "text-red-600" : "text-blue-600" },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{stat.label}</p>
                </div>
                <p className="text-base font-semibold">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Progress */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-muted-foreground">Progress</p>
              <p className="text-xs text-muted-foreground">{completedCount} of {tx.milestones.length} milestones</p>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Tabs */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex gap-1 border-b">
              {[
                { v: "timeline", label: "Timeline", icon: Clock },
                { v: "review", label: "AI Review", icon: Sparkles },
                { v: "parties", label: "Parties", icon: Users },
                { v: "documents", label: "Documents", icon: FileText },
              ].map((t) => (
                <button
                  key={t.v}
                  onClick={() => setActiveTab(t.v as typeof activeTab)}
                  className={`px-3 py-2 text-xs font-medium gap-1.5 inline-flex items-center border-b-2 -mb-px transition-colors ${
                    activeTab === t.v
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <t.icon className="h-3.5 w-3.5" /> {t.label}
                </button>
              ))}
            </div>

            {activeTab === "timeline" && (
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base">Milestone Timeline</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {tx.milestones.map((ms) => {
                      const overdue = ms.status === "pending" && new Date(ms.dueDate) < new Date()
                      return (
                        <div
                          key={ms.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border ${
                            ms.status === "completed" ? "bg-green-50/50 border-green-200" :
                            overdue ? "bg-red-50/50 border-red-200" :
                            "bg-white"
                          }`}
                        >
                          <CheckCircle2 className={`h-5 w-5 shrink-0 ${
                            ms.status === "completed" ? "text-green-600" :
                            overdue ? "text-red-500" : "text-muted-foreground/30"
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${ms.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                              {ms.name}
                            </p>
                            <p className="text-xs text-muted-foreground">{formatDate(ms.dueDate)}</p>
                          </div>
                          <Badge variant="outline" className="text-[10px]">
                            {ms.status === "completed" ? "Done" : overdue ? "Overdue" : "Pending"}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "review" && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" /> Contract Review
                    <Badge variant="outline" className="text-[10px]">AI</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{SAMPLE_REVIEW.summary}</p>
                  {SAMPLE_REVIEW.flags.map((flag, idx) => {
                    const style = SEV_STYLES[flag.severity]
                    return (
                      <div key={idx} className={`rounded-lg border ${style.border} ${style.bg} p-3`}>
                        <div className="flex items-start gap-2">
                          <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${style.icon}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className={`text-sm font-semibold ${style.text}`}>{flag.title}</h4>
                              <Badge variant="outline" className={`text-[10px] capitalize ${style.chip} border-0`}>{flag.category}</Badge>
                            </div>
                            <p className={`text-xs ${style.text} opacity-90 mb-2`}>{flag.detail}</p>
                            <p className="text-xs text-muted-foreground"><span className="font-medium">Recommendation:</span> {flag.recommendation}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            )}

            {activeTab === "parties" && (
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base">Parties on this Deal</CardTitle></CardHeader>
                <CardContent>
                  <div className="divide-y">
                    {tx.parties.map((p) => (
                      <div key={p.id} className="py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{p.name}</p>
                            <Badge variant="outline" className="text-[10px]">{ROLE_LABELS[p.role] || p.role}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {[p.company, p.email, p.phone].filter(Boolean).join(" • ")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "documents" && (
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base">Documents</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm mb-1">In a real deal, you'd see uploaded contracts, addendums, disclosures, signing status — all here.</p>
                    <Link href="/register">
                      <Button size="sm" className="mt-3">Try it free</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right rail */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><ListChecks className="h-4 w-4" /> What ClosePilot does</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {[
                  "Reads your purchase agreement and auto-builds the timeline",
                  "Tracks every CT-specific deadline (attorney review, title, mortgage commitment)",
                  "Sends email reminders before deadlines slip",
                  "Lets buyers/sellers see their own portal so you stop fielding 'what's next?' calls",
                  "Flags contract risks (high LTV, tight timelines, missing contingencies) before you go firm",
                  "Exports the whole calendar to Google/Apple/Outlook in one click",
                ].map((line, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <p className="text-muted-foreground">{line}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-blue-600" />
                  <p className="text-sm font-semibold text-blue-900">$99 per closed deal</p>
                </div>
                <p className="text-xs text-blue-800">
                  No subscription. No setup fees. Pay only when you close. ~75% cheaper than a human TC.
                </p>
                <Link href="/register" className="block">
                  <Button className="w-full gap-1.5">
                    Start your first deal free
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="border-t mt-12 py-6">
        <div className="container text-center text-xs text-muted-foreground">
          ClosePilot — AI Transaction Coordinator for real estate
        </div>
      </footer>
    </div>
  )
}
