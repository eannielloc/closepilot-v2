"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate, daysUntil, statusBadge } from "@/lib/utils"
import { Home, Calendar, DollarSign, Clock, ChevronRight } from "lucide-react"

interface TransactionCardProps {
  transaction: {
    id: string
    propertyAddress: string
    status: string
    buyerName: string
    sellerName: string
    purchasePrice: number
    closingDate: string
    milestones?: Array<{ name: string; dueDate: string; status: string }>
  }
}

export function TransactionCard({ transaction }: TransactionCardProps) {
  const daysLeft = daysUntil(transaction.closingDate)
  const nextMilestone = transaction.milestones?.find((m) => m.status === "pending")
  const completed = transaction.milestones?.filter((m) => m.status === "completed").length || 0
  const total = transaction.milestones?.length || 1
  const progress = Math.round((completed / total) * 100)

  return (
    <Link href={`/transactions/${transaction.id}`}>
      <Card className="hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-primary/[0.08] flex items-center justify-center shrink-0 mt-0.5">
                <Home className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-sm truncate">{transaction.propertyAddress}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {transaction.buyerName} → {transaction.sellerName}
                </p>
              </div>
            </div>
            <Badge className={statusBadge(transaction.status)}>
              {transaction.status.replace("_", " ")}
            </Badge>
          </div>

          {/* Progress bar */}
          <div className="mb-3">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[11px] text-muted-foreground">{completed}/{total} milestones</span>
              <span className="text-[11px] text-muted-foreground">{progress}%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5" />
              <span>{formatCurrency(transaction.purchasePrice)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatDate(transaction.closingDate)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center gap-1.5 text-xs">
              <Clock className="h-3.5 w-3.5" />
              {daysLeft > 0 ? (
                <span className={daysLeft <= 7 ? "text-amber-600 font-medium" : "text-muted-foreground"}>
                  {daysLeft}d to closing
                </span>
              ) : daysLeft === 0 ? (
                <span className="text-red-600 font-bold">TODAY</span>
              ) : (
                <span className="text-emerald-600 font-medium">Closed</span>
              )}
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
