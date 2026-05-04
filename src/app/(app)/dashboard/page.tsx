"use client"

import { useEffect, useState } from "react"
import { TransactionCard } from "@/components/transaction-card"
import { DashboardStats } from "@/components/dashboard-stats"
import { DeadlineAlert } from "@/components/deadline-alert"
import { PipelineView } from "@/components/pipeline-view"
import { ActivityFeed } from "@/components/activity-feed"
import { QuickActions } from "@/components/quick-actions"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Zap, Clock, LayoutGrid, Kanban, CheckCircle2 } from "lucide-react"
import Link from "next/link"

type ViewMode = "cards" | "pipeline"

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}><CardContent className="p-5"><Skeleton className="h-4 w-12 mb-3" /><Skeleton className="h-8 w-16 mb-1" /><Skeleton className="h-3 w-24" /></CardContent></Card>
        ))}
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}><CardContent className="p-5"><Skeleton className="h-5 w-full mb-3" /><Skeleton className="h-4 w-3/4 mb-2" /><Skeleton className="h-1.5 w-full mb-2" /><Skeleton className="h-4 w-1/2" /></CardContent></Card>
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>("cards")
  const [userName, setUserName] = useState<string>("")

  useEffect(() => {
    async function init() {
      try {
        // load current user for greeting
        try {
          const meRes = await fetch("/api/auth/me")
          if (meRes.ok) {
            const me = await meRes.json()
            setUserName(me?.user?.name?.split(" ")[0] || "")
          }
        } catch {}
        await fetch("/api/seed", { method: "POST" })
        const res = await fetch("/api/transactions")
        const data = await res.json()
        const txs = Array.isArray(data) ? data : []
        setTransactions(txs)
        
        // Gather activities from all transactions
        const allActivities: any[] = []
        for (const tx of txs) {
          if (tx.activity) {
            for (const a of tx.activity) {
              allActivities.push({ ...a, propertyAddress: tx.propertyAddress })
            }
          }
        }
        // Also fetch from dashboard API
        try {
          const dashRes = await fetch("/api/dashboard")
          const dashData = await dashRes.json()
          if (dashData.recentActivity) {
            allActivities.push(...dashData.recentActivity)
          }
        } catch {}
        
        allActivities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setActivities(allActivities)
      } catch (err) {
        console.error("Failed to load transactions:", err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const activeCount = transactions.filter((t) => t.status !== "closed" && t.status !== "cancelled").length
  const closedCount = transactions.filter((t) => t.status === "closed").length
  const totalVolume = transactions.reduce((sum, t) => sum + (t.purchasePrice || 0), 0)

  const allUpcoming = transactions.flatMap((t) =>
    (t.milestones || [])
      .filter((m: any) => m.status === "pending")
      .map((m: any) => ({ ...m, propertyAddress: t.propertyAddress, transactionId: t.id }))
  ).sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

  const urgentDeadlines = allUpcoming.filter((m: any) => {
    const days = Math.ceil((new Date(m.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return days <= 7
  })

  if (loading) return <DashboardSkeleton />

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {userName ? `Welcome back, ${userName}.` : "Welcome back."} Here&apos;s your deal overview.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <QuickActions />
        </div>
      </div>

      {/* Stats */}
      <DashboardStats
        activeCount={activeCount}
        upcomingDeadlines={urgentDeadlines.length}
        closedCount={closedCount}
        totalVolume={totalVolume}
      />

      {/* Action panel — overdue + this week, deep-linked */}
      {(() => {
        const overdue = allUpcoming.filter((m: any) => new Date(m.dueDate) < new Date())
        const thisWeek = urgentDeadlines.filter((m: any) => new Date(m.dueDate) >= new Date())
        const all = [...overdue, ...thisWeek].slice(0, 6)
        if (all.length === 0) {
          return (
            <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50/60 to-white">
              <CardContent className="py-5 px-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold">All clear for the next 7 days 🎉</p>
                  <p className="text-xs text-muted-foreground">No deadlines need your attention. Good time to check in with active buyers/sellers.</p>
                </div>
              </CardContent>
            </Card>
          )
        }
        return (
          <Card className="border-amber-200">
            <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                Action needed
                <span className="text-xs font-normal text-muted-foreground ml-0.5">
                  {overdue.length > 0 && <span className="text-red-700 font-medium">{overdue.length} overdue</span>}
                  {overdue.length > 0 && thisWeek.length > 0 && " · "}
                  {thisWeek.length > 0 && <span>{thisWeek.length} this week</span>}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-1.5">
              {all.map((d: any) => {
                const isOverdue = new Date(d.dueDate) < new Date()
                const days = Math.ceil((new Date(d.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                const dayLabel = isOverdue ? `${Math.abs(days)}d overdue` : days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${days} days`
                return (
                  <Link
                    key={d.id}
                    href={`/transactions/${d.transactionId}`}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all hover:shadow-sm ${
                      isOverdue ? "border-red-200 bg-red-50/40 hover:bg-red-50/70" : "border-amber-200 bg-amber-50/30 hover:bg-amber-50/60"
                    }`}
                  >
                    <div className={`w-1.5 self-stretch rounded-full ${isOverdue ? "bg-red-500" : "bg-amber-500"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{d.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{d.propertyAddress}</p>
                    </div>
                    <span className={`text-xs font-medium shrink-0 ${isOverdue ? "text-red-700" : "text-amber-700"}`}>{dayLabel}</span>
                  </Link>
                )
              })}
            </CardContent>
          </Card>
        )
      })()}

      {/* View Toggle + Transactions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Transactions</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground mr-2">{activeCount} deals · ${(totalVolume / 1000000).toFixed(1)}M volume</span>
            <div className="flex items-center bg-muted rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("cards")}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === "cards" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode("pipeline")}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === "pipeline" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Kanban className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {transactions.length > 0 ? (
          viewMode === "pipeline" ? (
            <PipelineView transactions={transactions} />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {transactions.map((t) => (
                <TransactionCard key={t.id} transaction={t} />
              ))}
            </div>
          )
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/[0.08] mb-4">
                <Zap className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-semibold mb-1 text-lg">Let&apos;s set up your first deal</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                Drop your purchase agreement PDF — we&apos;ll parse the contract, build the timeline, and let you invite buyers, sellers, lenders, inspectors, and attorneys to their own portal.
              </p>
              <div className="grid sm:grid-cols-3 gap-3 max-w-2xl mx-auto mb-6 text-left">
                {[
                  { n: "1", t: "Upload contract", d: "AI extracts every date, party, and contingency." },
                  { n: "2", t: "Invite the team", d: "Each party gets a role-specific portal with one click." },
                  { n: "3", t: "Stay on autopilot", d: "Reminders + task tracking handle the rest." },
                ].map((s) => (
                  <div key={s.n} className="rounded-xl border bg-background p-4">
                    <div className="text-xs font-bold text-primary mb-2">STEP {s.n}</div>
                    <div className="text-sm font-medium mb-1">{s.t}</div>
                    <div className="text-xs text-muted-foreground leading-relaxed">{s.d}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-2">
                <Link href="/transactions/new">
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" /> New Transaction
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button variant="outline" className="gap-2">See sample first</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Activity Feed */}
      {activities.length > 0 && (
        <ActivityFeed activities={activities} />
      )}
    </div>
  )
}
