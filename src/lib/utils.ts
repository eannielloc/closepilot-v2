import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function daysUntil(date: Date | string): number {
  const target = new Date(date)
  const now = new Date()
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export function urgencyColor(daysLeft: number): string {
  if (daysLeft < 0) return "text-red-600 bg-red-50 border-red-200"
  if (daysLeft <= 3) return "text-red-600 bg-red-50 border-red-200"
  if (daysLeft <= 7) return "text-yellow-600 bg-yellow-50 border-yellow-200"
  return "text-green-600 bg-green-50 border-green-200"
}

export function statusColor(status: string): string {
  switch (status) {
    case "completed": return "bg-green-500"
    case "overdue": return "bg-red-500"
    case "pending": return "bg-blue-500"
    case "waived": return "bg-gray-400"
    default: return "bg-gray-400"
  }
}

export function statusBadge(status: string): string {
  switch (status) {
    case "draft": return "bg-slate-100 text-slate-700"
    case "new": return "bg-blue-100 text-blue-800"
    case "active": return "bg-green-100 text-green-800"
    case "pending_closing": return "bg-yellow-100 text-yellow-800"
    case "closed": return "bg-gray-100 text-gray-800"
    case "cancelled": return "bg-red-100 text-red-800"
    default: return "bg-gray-100 text-gray-800"
  }
}
