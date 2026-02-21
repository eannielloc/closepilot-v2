"use client"

import { daysUntil, formatDate } from "@/lib/utils"
import { AlertTriangle, Clock, CheckCircle } from "lucide-react"

interface DeadlineAlertProps {
  name: string
  dueDate: string
  status: string
}

export function DeadlineAlert({ name, dueDate, status }: DeadlineAlertProps) {
  if (status === "completed" || status === "waived") return null

  const days = daysUntil(dueDate)

  if (days < 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span className="font-medium">{name}</span>
        <span className="ml-auto text-xs">{Math.abs(days)}d overdue</span>
      </div>
    )
  }
  if (days <= 3) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
        <Clock className="h-4 w-4 shrink-0" />
        <span className="font-medium">{name}</span>
        <span className="ml-auto text-xs">{days === 0 ? "TODAY" : `${days}d left`}</span>
      </div>
    )
  }
  if (days <= 7) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm">
        <Clock className="h-4 w-4 shrink-0" />
        <span className="font-medium">{name}</span>
        <span className="ml-auto text-xs">{days}d left</span>
      </div>
    )
  }
  return null
}
