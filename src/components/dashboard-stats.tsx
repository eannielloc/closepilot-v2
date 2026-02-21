"use client"

import { Card, CardContent } from "@/components/ui/card"
import { FileText, AlertTriangle, CheckCircle, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react"

interface DashboardStatsProps {
  activeCount: number
  upcomingDeadlines: number
  closedCount: number
  totalVolume: number
}

export function DashboardStats({ activeCount, upcomingDeadlines, closedCount, totalVolume }: DashboardStatsProps) {
  const stats = [
    {
      label: "Active Transactions",
      value: activeCount,
      icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-50",
      trend: "+2 this month",
      trendUp: true,
    },
    {
      label: "Upcoming Deadlines",
      value: upcomingDeadlines,
      icon: AlertTriangle,
      color: "text-amber-600",
      bg: "bg-amber-50",
      trend: "Next 7 days",
      trendUp: false,
    },
    {
      label: "Deals Closed",
      value: closedCount,
      icon: CheckCircle,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      trend: "+1 this month",
      trendUp: true,
    },
    {
      label: "Total Volume",
      value: `$${(totalVolume / 1000000).toFixed(1)}M`,
      icon: TrendingUp,
      color: "text-violet-600",
      bg: "bg-violet-50",
      trend: "+$615K this month",
      trendUp: true,
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              {stat.trendUp !== undefined && (
                <div className={`flex items-center gap-0.5 text-xs font-medium ${stat.trendUp ? "text-emerald-600" : "text-amber-600"}`}>
                  {stat.trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                </div>
              )}
            </div>
            <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            <p className="text-[11px] text-muted-foreground/70 mt-2">{stat.trend}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
