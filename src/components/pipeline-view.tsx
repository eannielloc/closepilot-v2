"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, daysUntil } from "@/lib/utils"
import { Home, Clock, ChevronRight } from "lucide-react"

const PIPELINE_STAGES = [
  { key: "new", label: "New", color: "bg-blue-500", lightBg: "bg-blue-50", lightBorder: "border-blue-200" },
  { key: "active", label: "Under Contract", color: "bg-emerald-500", lightBg: "bg-emerald-50", lightBorder: "border-emerald-200" },
  { key: "attorney_review", label: "Attorney Review", color: "bg-purple-500", lightBg: "bg-purple-50", lightBorder: "border-purple-200" },
  { key: "inspection", label: "Inspection", color: "bg-amber-500", lightBg: "bg-amber-50", lightBorder: "border-amber-200" },
  { key: "pending_closing", label: "Clear to Close", color: "bg-orange-500", lightBg: "bg-orange-50", lightBorder: "border-orange-200" },
  { key: "closed", label: "Closed", color: "bg-gray-400", lightBg: "bg-gray-50", lightBorder: "border-gray-200" },
]

function getStageForTransaction(tx: any): string {
  if (tx.status === "closed") return "closed"
  if (tx.status === "cancelled") return "closed"
  if (tx.status === "pending_closing") return "pending_closing"
  
  // Determine stage based on milestones
  const milestones = tx.milestones || []
  const completedTypes = new Set(
    milestones.filter((m: any) => m.status === "completed").map((m: any) => m.type)
  )
  
  if (completedTypes.has("inspection")) return "inspection"
  if (completedTypes.has("attorney_review")) return "attorney_review"
  if (tx.status === "active") return "active"
  return "new"
}

interface PipelineViewProps {
  transactions: any[]
}

export function PipelineView({ transactions }: PipelineViewProps) {
  const stageMap: Record<string, any[]> = {}
  for (const stage of PIPELINE_STAGES) stageMap[stage.key] = []
  for (const tx of transactions) {
    const stage = getStageForTransaction(tx)
    if (stageMap[stage]) stageMap[stage].push(tx)
  }

  return (
    <div className="overflow-x-auto pb-4 -mx-2">
      <div className="flex gap-3 min-w-max px-2">
        {PIPELINE_STAGES.map((stage) => {
          const items = stageMap[stage.key] || []
          return (
            <div key={stage.key} className={`w-[260px] shrink-0 rounded-xl border ${stage.lightBorder} ${stage.lightBg} p-3`}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                <span className="text-sm font-semibold">{stage.label}</span>
                <span className="text-xs text-muted-foreground ml-auto">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((tx: any) => {
                  const daysLeft = daysUntil(tx.closingDate)
                  const completed = (tx.milestones || []).filter((m: any) => m.status === "completed").length
                  const total = (tx.milestones || []).length || 1
                  const progress = Math.round((completed / total) * 100)
                  
                  return (
                    <Link key={tx.id} href={`/transactions/${tx.id}`}>
                      <div className="bg-white rounded-lg border p-3 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group">
                        <div className="flex items-start gap-2 mb-2">
                          <div className="w-7 h-7 rounded-md bg-primary/[0.08] flex items-center justify-center shrink-0">
                            <Home className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold truncate leading-tight">{tx.propertyAddress}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{tx.buyerName}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span className="font-medium">{formatCurrency(tx.purchasePrice)}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            {daysLeft > 0 ? `${daysLeft}d` : daysLeft === 0 ? "Today" : "Past"}
                          </span>
                        </div>
                        <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </Link>
                  )
                })}
                {items.length === 0 && (
                  <div className="text-center py-6 text-xs text-muted-foreground/60">
                    No deals
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
