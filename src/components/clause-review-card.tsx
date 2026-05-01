"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, ShieldCheck, Sparkles, Loader2, RefreshCw } from "lucide-react"

type Severity = "info" | "low" | "medium" | "high"

interface ClauseFlag {
  severity: Severity
  category: string
  title: string
  detail: string
  recommendation: string
}

interface ClauseReview {
  summary: string
  flags: ClauseFlag[]
  generatedAt: string
  source: "ai" | "heuristic"
}

const SEV_STYLES: Record<Severity, { bg: string; border: string; text: string; chip: string; icon: string }> = {
  high:   { bg: "bg-red-50",     border: "border-red-200",     text: "text-red-900",    chip: "bg-red-100 text-red-700 border-red-200",       icon: "text-red-600" },
  medium: { bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-900",  chip: "bg-amber-100 text-amber-700 border-amber-200", icon: "text-amber-600" },
  low:    { bg: "bg-blue-50",    border: "border-blue-200",    text: "text-blue-900",   chip: "bg-blue-100 text-blue-700 border-blue-200",    icon: "text-blue-600" },
  info:   { bg: "bg-slate-50",   border: "border-slate-200",   text: "text-slate-900",  chip: "bg-slate-100 text-slate-700 border-slate-200", icon: "text-slate-500" },
}

export function ClauseReviewCard({ transactionId }: { transactionId: string }) {
  const [review, setReview] = useState<ClauseReview | null>(null)
  const [loading, setLoading] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/transactions/${transactionId}/clause-review`)
      .then((r) => (r.ok ? r.json() : { review: null }))
      .then((data) => { if (!cancelled) { setReview(data.review || null); setHasFetched(true) } })
      .catch(() => { if (!cancelled) setHasFetched(true) })
    return () => { cancelled = true }
  }, [transactionId])

  const runReview = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/transactions/${transactionId}/clause-review`, { method: "POST" })
      if (res.ok) setReview(await res.json())
    } finally {
      setLoading(false)
    }
  }

  if (!hasFetched) {
    return (
      <Card>
        <CardContent className="p-5"><div className="text-sm text-muted-foreground">Loading review…</div></CardContent>
      </Card>
    )
  }

  if (!review) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2"><Sparkles className="h-5 w-5 text-primary" /></div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">AI Clause Review</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Scan the contract for tight deadlines, financing risk, missing contingencies, and other red flags before going firm.
              </p>
              <Button size="sm" onClick={runReview} disabled={loading} className="gap-1.5">
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {loading ? "Reviewing…" : "Run Review"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const counts = review.flags.reduce<Record<Severity, number>>((acc, f) => {
    acc[f.severity] = (acc[f.severity] || 0) + 1
    return acc
  }, { high: 0, medium: 0, low: 0, info: 0 })

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {review.flags.length === 0 ? (
              <ShieldCheck className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            )}
            Contract Review
            <Badge variant="outline" className="text-[10px] capitalize">{review.source === "ai" ? "AI" : "heuristic"}</Badge>
          </CardTitle>
          <Button size="sm" variant="ghost" onClick={runReview} disabled={loading} className="h-7 gap-1.5 text-xs">
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            Re-run
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{review.summary}</p>
        {review.flags.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {(["high", "medium", "low", "info"] as Severity[]).map((s) =>
              counts[s] > 0 ? (
                <Badge key={s} className={`${SEV_STYLES[s].chip} border text-[11px] capitalize`} variant="outline">
                  {counts[s]} {s}
                </Badge>
              ) : null,
            )}
          </div>
        )}
        <div className="space-y-2">
          {review.flags.map((flag, idx) => {
            const style = SEV_STYLES[flag.severity]
            return (
              <div key={idx} className={`rounded-lg border ${style.border} ${style.bg} p-3`}>
                <div className="flex items-start gap-2">
                  <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${style.icon}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`text-sm font-semibold ${style.text}`}>{flag.title}</h4>
                      <Badge variant="outline" className={`text-[10px] capitalize ${style.chip} border-0`}>{flag.category}</Badge>
                    </div>
                    <p className={`text-xs ${style.text} opacity-90 mb-2`}>{flag.detail}</p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">Recommendation:</span> {flag.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <p className="text-[10px] text-muted-foreground pt-2 border-t">
          Generated {new Date(review.generatedAt).toLocaleString()} • Not legal advice — confirm with attorney/broker.
        </p>
      </CardContent>
    </Card>
  )
}
