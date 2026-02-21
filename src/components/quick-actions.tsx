"use client"

import Link from "next/link"
import { Plus, Upload, Bell, FileText, Users, BarChart3 } from "lucide-react"

const actions = [
  { label: "Add Transaction", href: "/transactions/new", icon: Plus, color: "bg-blue-500 text-white", hoverColor: "hover:bg-blue-600" },
  { label: "Upload Document", href: "/transactions/new", icon: Upload, color: "bg-violet-500 text-white", hoverColor: "hover:bg-violet-600" },
  { label: "Send Reminder", href: "/dashboard", icon: Bell, color: "bg-amber-500 text-white", hoverColor: "hover:bg-amber-600" },
]

export function QuickActions() {
  return (
    <div className="flex items-center gap-2">
      {actions.map((action) => (
        <Link key={action.label} href={action.href}>
          <button className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all shadow-sm ${action.color} ${action.hoverColor}`}>
            <action.icon className="h-3.5 w-3.5" />
            {action.label}
          </button>
        </Link>
      ))}
    </div>
  )
}
