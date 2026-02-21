"use client"

import { notFound } from "next/navigation"
import Link from "next/link"
import { MOCK_TRANSACTIONS } from "@/lib/mock-data"
import { TimelineView } from "@/components/timeline-view"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, formatDate, daysUntil } from "@/lib/utils"
import { ArrowLeft } from "lucide-react"

export default function TimelinePage({ params }: { params: { id: string } }) {
  const tx = MOCK_TRANSACTIONS.find((t) => t.id === params.id)
  if (!tx) return notFound()

  const completed = tx.milestones.filter((m) => m.status === "completed").length
  const total = tx.milestones.length
  const progress = Math.round((completed / total) * 100)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/transactions/${tx.id}`}>
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">{tx.propertyAddress}</h1>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(tx.purchasePrice)} · Close {formatDate(tx.closingDate)}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Transaction Progress</span>
            <span className="text-sm text-muted-foreground">{completed}/{total} milestones</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Contract Executed</span>
            <span>{daysUntil(tx.closingDate)} days to closing</span>
            <span>Closing</span>
          </div>
        </CardContent>
      </Card>

      {/* Full timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Full Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <TimelineView milestones={tx.milestones} onStatusChange={(id, status) => {
            console.log(`[MOCK] Milestone ${id} → ${status}`)
          }} />
        </CardContent>
      </Card>
    </div>
  )
}
