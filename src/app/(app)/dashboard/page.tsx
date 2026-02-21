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
import { Plus, Zap, Clock, LayoutGrid, Kanban, List } from "lucide-react"
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

  useEffect(() => {
    async function init() {
      try {
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
          <p className="text-sm text-muted-foreground mt-0.5">Welcome back, Chris. Here&apos;s your deal overview.</p>
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

      {/* Urgent deadlines */}
      {urgentDeadlines.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              Upcoming Deadlines
              <span className="text-xs font-normal text-muted-foreground ml-1">Next 7 days</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {urgentDeadlines.slice(0, 5).map((d: any) => (
              <DeadlineAlert key={d.id} name={`${d.name} — ${d.propertyAddress}`} dueDate={d.dueDate} status={d.status} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Overdue Alert */}
      {allUpcoming.filter((m: any) => new Date(m.dueDate) < new Date()).length > 0 && (
        <Card className="border-red-200 bg-red-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-red-700">
              ⚠️ Overdue Milestones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {allUpcoming.filter((m: any) => new Date(m.dueDate) < new Date()).slice(0, 5).map((d: any) => (
              <DeadlineAlert key={d.id} name={`${d.name} — ${d.propertyAddress}`} dueDate={d.dueDate} status="overdue" />
            ))}
          </CardContent>
        </Card>
      )}

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
            <CardContent className="py-16 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/[0.08] mb-4">
                <Zap className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">No transactions yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Upload your first contract to get started</p>
              <Link href="/transactions/new">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" /> New Transaction
                </Button>
              </Link>
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
