"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, FileText, CheckCircle2, Upload, Send, UserPlus, Clock } from "lucide-react"

interface ActivityItem {
  id: string
  action: string
  details: string
  createdAt: string
  propertyAddress?: string
}

function getActivityIcon(action: string) {
  switch (action) {
    case "transaction_created": return <FileText className="h-3.5 w-3.5 text-blue-500" />
    case "milestone_updated": return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
    case "document_uploaded": return <Upload className="h-3.5 w-3.5 text-violet-500" />
    case "signing_sent": return <Send className="h-3.5 w-3.5 text-orange-500" />
    case "party_added": return <UserPlus className="h-3.5 w-3.5 text-emerald-500" />
    default: return <Activity className="h-3.5 w-3.5 text-muted-foreground" />
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function ActivityFeed({ activities }: { activities: ActivityItem[] }) {
  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-sm text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
            No activity yet. Create a transaction to get started.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {activities.slice(0, 10).map((item) => (
            <div key={item.id} className="flex items-start gap-3 py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="mt-0.5 shrink-0">
                {getActivityIcon(item.action)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-tight">{item.details}</p>
                {item.propertyAddress && (
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">{item.propertyAddress}</p>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                {timeAgo(item.createdAt)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
