"use client"

import { formatDate, daysUntil, statusColor } from "@/lib/utils"
import { Check, Clock, AlertTriangle, X } from "lucide-react"

interface Milestone {
  id: string
  name: string
  type: string
  dueDate: string
  status: string
  notes?: string
}

interface TimelineViewProps {
  milestones: Milestone[]
  onStatusChange?: (id: string, status: string) => void
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return <Check className="h-4 w-4 text-white" />
    case "overdue":
      return <AlertTriangle className="h-4 w-4 text-white" />
    case "waived":
      return <X className="h-4 w-4 text-white" />
    default:
      return <Clock className="h-4 w-4 text-white" />
  }
}

function typeIcon(type: string): string {
  switch (type) {
    case "deposit": return "💰"
    case "inspection": return "🔍"
    case "attorney_review": return "⚖️"
    case "appraisal": return "📊"
    case "loan_approval": return "🏦"
    case "title": return "📋"
    case "closing": return "🏠"
    default: return "📌"
  }
}

export function TimelineView({ milestones, onStatusChange }: TimelineViewProps) {
  const sorted = [...milestones].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-blue-300 to-green-200" />

      <div className="space-y-0">
        {sorted.map((milestone, i) => {
          const days = daysUntil(milestone.dueDate)
          const isLast = i === sorted.length - 1
          const isPast = milestone.status === "completed" || milestone.status === "waived"

          return (
            <div key={milestone.id} className="relative flex gap-4 pb-8 group">
              {/* Dot */}
              <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 border-white shadow-md ${statusColor(milestone.status)} shrink-0`}>
                <StatusIcon status={milestone.status} />
              </div>

              {/* Content */}
              <div className={`flex-1 pt-1 ${isPast ? "opacity-70" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base">{typeIcon(milestone.type)}</span>
                      <h4 className={`font-semibold text-sm ${isLast ? "text-lg" : ""} ${milestone.status === "overdue" ? "text-red-600" : ""}`}>
                        {milestone.name}
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(milestone.dueDate)}
                      {!isPast && days >= 0 && (
                        <span className={`ml-2 font-medium ${days <= 3 ? "text-red-500" : days <= 7 ? "text-yellow-500" : "text-green-600"}`}>
                          {days === 0 ? "TODAY" : `${days} day${days !== 1 ? "s" : ""} away`}
                        </span>
                      )}
                      {!isPast && days < 0 && (
                        <span className="ml-2 font-medium text-red-600">
                          {Math.abs(days)} day{Math.abs(days) !== 1 ? "s" : ""} overdue
                        </span>
                      )}
                    </p>
                  </div>

                  {onStatusChange && !isPast && (
                    <button
                      onClick={() => onStatusChange(milestone.id, "completed")}
                      className="text-xs px-2.5 py-1 rounded-md bg-green-50 text-green-700 hover:bg-green-100 transition-colors border border-green-200"
                    >
                      Mark Complete
                    </button>
                  )}

                  {isPast && (
                    <span className={`text-xs px-2.5 py-1 rounded-md ${milestone.status === "completed" ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500"}`}>
                      {milestone.status === "completed" ? "✓ Done" : "Waived"}
                    </span>
                  )}
                </div>

                {milestone.notes && (
                  <p className="text-xs text-muted-foreground mt-1 italic">{milestone.notes}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
