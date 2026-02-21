"use client"

import { useEffect, useState } from "react"
import { formatCurrency, formatDate, daysUntil } from "@/lib/utils"
import {
  Zap, CheckCircle2, Circle, Clock, Calendar, DollarSign,
  FileText, AlertTriangle, MapPin, Shield
} from "lucide-react"

function ProgressRing({ progress }: { progress: number }) {
  const r = 40
  const c = 2 * Math.PI * r
  const offset = c - (progress / 100) * c
  return (
    <svg width="100" height="100" className="transform -rotate-90">
      <circle cx="50" cy="50" r={r} stroke="currentColor" strokeWidth="6" fill="none" className="text-gray-100" />
      <circle cx="50" cy="50" r={r} stroke="url(#gradient)" strokeWidth="6" fill="none" strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000" />
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export default function ClientPortalPage({ params }: { params: { id: string } }) {
  const [tx, setTx] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch(`/api/transactions/${params.id}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(data => { setTx(data); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [params.id])

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  )

  if (error || !tx) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 shadow-lg text-center max-w-md">
        <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h1 className="text-xl font-bold mb-2">Transaction Not Found</h1>
        <p className="text-gray-500 text-sm">This link may be invalid or the transaction may no longer be available.</p>
      </div>
    </div>
  )

  const daysLeft = daysUntil(tx.closingDate)
  const completedMs = (tx.milestones || []).filter((m: any) => m.status === "completed").length
  const totalMs = (tx.milestones || []).length
  const progress = totalMs ? Math.round((completedMs / totalMs) * 100) : 0
  const nextMilestone = (tx.milestones || []).find((m: any) => m.status === "pending")

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">ClosePilot</span>
          </div>
          <span className="text-xs text-gray-400">Client Portal</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Property header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 text-sm text-gray-500 mb-2">
            <MapPin className="h-3.5 w-3.5" />
            Transaction Status
          </div>
          <h1 className="text-2xl font-bold">{tx.propertyAddress}</h1>
          <p className="text-sm text-gray-500 mt-1">{tx.buyerName} → {tx.sellerName}</p>
        </div>

        {/* Key stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border p-4 text-center">
            <DollarSign className="h-5 w-5 text-emerald-500 mx-auto mb-1" />
            <p className="text-lg font-bold">{formatCurrency(tx.purchasePrice)}</p>
            <p className="text-[11px] text-gray-500">Purchase Price</p>
          </div>
          <div className="bg-white rounded-xl border p-4 text-center">
            <Calendar className="h-5 w-5 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold">{formatDate(tx.closingDate)}</p>
            <p className="text-[11px] text-gray-500">Target Closing</p>
          </div>
          <div className="bg-white rounded-xl border p-4 text-center">
            <Clock className="h-5 w-5 text-violet-500 mx-auto mb-1" />
            <p className="text-lg font-bold">{daysLeft > 0 ? `${daysLeft}` : daysLeft === 0 ? "TODAY" : "Past"}</p>
            <p className="text-[11px] text-gray-500">{daysLeft > 0 ? "Days to Close" : "Days"}</p>
          </div>
        </div>

        {/* Progress ring */}
        <div className="bg-white rounded-2xl border p-6 flex items-center gap-6">
          <div className="relative">
            <ProgressRing progress={progress} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold">{progress}%</span>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Transaction Progress</h3>
            <p className="text-sm text-gray-500">{completedMs} of {totalMs} milestones completed</p>
            {nextMilestone && (
              <div className="mt-3 p-2.5 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs font-medium text-blue-700">Next up:</p>
                <p className="text-sm font-medium">{nextMilestone.name}</p>
                <p className="text-xs text-gray-500">Due {formatDate(nextMilestone.dueDate)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-2xl border p-6">
          <h3 className="font-semibold mb-4">Timeline</h3>
          <div className="space-y-3">
            {(tx.milestones || []).map((ms: any) => {
              const isOverdue = ms.status === "pending" && new Date(ms.dueDate) < new Date()
              return (
                <div key={ms.id} className="flex items-center gap-3">
                  {ms.status === "completed" ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  ) : isOverdue ? (
                    <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-200 shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className={`text-sm ${ms.status === "completed" ? "text-gray-400 line-through" : isOverdue ? "text-red-700 font-medium" : "font-medium"}`}>
                      {ms.name}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">{formatDate(ms.dueDate)}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Documents */}
        {(tx.documents || []).length > 0 && (
          <div className="bg-white rounded-2xl border p-6">
            <h3 className="font-semibold mb-4">Documents</h3>
            <div className="space-y-2">
              {(tx.documents || []).map((doc: any) => (
                <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border">
                  <FileText className="h-4 w-4 text-red-500 shrink-0" />
                  <span className="text-sm flex-1 truncate">{doc.name}</span>
                  <span className="text-xs text-gray-400 capitalize">{doc.status || "pending"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-8 text-xs text-gray-400">
          <p>Powered by ClosePilot · AI Transaction Coordinator</p>
          <p className="mt-1">Questions? Contact your agent directly.</p>
        </div>
      </main>
    </div>
  )
}
