"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { PartyList } from "@/components/party-list"
import { DocumentList } from "@/components/document-list"
import { NotesSection } from "@/components/notes-section"
import { TaskChecklist } from "@/components/task-checklist"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency, formatDate, daysUntil, statusBadge } from "@/lib/utils"
import {
  ArrowLeft, Calendar, DollarSign, FileText, MapPin, Loader2,
  CheckCircle2, Upload, Trash2, PenTool, Send, ExternalLink,
  Clock, ListChecks, MessageSquare, Users, Share2, Copy
} from "lucide-react"

function DetailSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="flex-1">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-96 mt-1" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}><CardContent className="p-4"><Skeleton className="h-3 w-20 mb-2" /><Skeleton className="h-5 w-16" /></CardContent></Card>
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card><CardContent className="p-6"><Skeleton className="h-6 w-32 mb-4" />{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full mb-2" />)}</CardContent></Card>
        </div>
        <div><Card><CardContent className="p-6">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full mb-2" />)}</CardContent></Card></div>
      </div>
    </div>
  )
}

export default function TransactionDetailPage({ params }: { params: { id: string } }) {
  const [tx, setTx] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [signingLinks, setSigningLinks] = useState<Record<string, any[]>>({})
  const [showShareModal, setShowShareModal] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const fetchTx = async () => {
    try {
      const res = await fetch(`/api/transactions/${params.id}`)
      if (res.ok) setTx(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTx() }, [params.id])

  const toggleMilestone = async (msId: string, currentStatus: string) => {
    const newStatus = currentStatus === "completed" ? "pending" : "completed"
    await fetch(`/api/milestones/${msId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
    fetchTx()
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("transactionId", params.id)
      for (const file of Array.from(files)) formData.append("files", file)
      await fetch("/api/documents/upload", { method: "POST", body: formData })
      fetchTx()
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  const deleteDoc = async (docId: string) => {
    if (!confirm("Delete this document?")) return
    await fetch(`/api/documents/${docId}/file`, { method: "DELETE" })
    fetchTx()
  }

  const copyClientLink = () => {
    const link = `${window.location.origin}/portal/${params.id}`
    navigator.clipboard.writeText(link)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  if (loading) return <DetailSkeleton />
  if (!tx) return (
    <div className="text-center py-20 animate-in fade-in duration-300">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted mb-4">
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="text-lg font-medium mb-1">Transaction not found</p>
      <p className="text-sm text-muted-foreground mb-4">This transaction may have been deleted.</p>
      <Link href="/dashboard"><Button>← Back to Dashboard</Button></Link>
    </div>
  )

  const isDraft = tx.status === "draft"
  const daysLeft = tx.closingDate ? daysUntil(tx.closingDate) : null
  const completedMs = (tx.milestones || []).filter((m: any) => m.status === "completed").length
  const totalMs = (tx.milestones || []).length
  const progress = totalMs ? Math.round((completedMs / totalMs) * 100) : 0

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="shrink-0"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold truncate">{tx.propertyAddress}</h1>
            <Badge className={statusBadge(tx.status)}>{tx.status.replace("_", " ")}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isDraft
              ? `Draft · ${(tx.documents || []).length} document${(tx.documents || []).length !== 1 ? "s" : ""} · Upload docs & prepare for signing`
              : `${tx.buyerName} → ${tx.sellerName} · ${formatCurrency(tx.purchasePrice)} · ${completedMs}/${totalMs} milestones`
            }
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 shrink-0"
          onClick={copyClientLink}
        >
          {copiedLink ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <Share2 className="h-3.5 w-3.5" />}
          {copiedLink ? "Copied!" : "Share"}
        </Button>
      </div>

      {/* Key info cards — hidden for draft, shown for active */}
      {!isDraft && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Purchase Price", value: tx.purchasePrice ? formatCurrency(tx.purchasePrice) : "—", icon: DollarSign, color: "text-emerald-600" },
            { label: "Effective Date", value: tx.effectiveDate ? formatDate(tx.effectiveDate) : "—", icon: Calendar, color: "text-blue-600" },
            { label: "Closing Date", value: tx.closingDate ? formatDate(tx.closingDate) : "—", icon: Calendar, color: "text-violet-600" },
            { label: "Days to Close", value: daysLeft !== null ? (daysLeft > 0 ? `${daysLeft} days` : daysLeft === 0 ? "TODAY" : "Past due") : "—", icon: Clock, color: daysLeft !== null && daysLeft <= 7 ? "text-red-600" : "text-blue-600" },
          ].map((item) => (
            <Card key={item.label} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
                  <span className="text-xs">{item.label}</span>
                </div>
                <p className="font-semibold">{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Draft info banner */}
      {isDraft && (
        <Card className="border-slate-200 bg-slate-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Draft Transaction</p>
                <p className="text-xs text-muted-foreground">Upload documents, prepare signature fields, and send for signing. Deal details will be auto-extracted by AI after all parties sign.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress bar — hidden for drafts */}
      {!isDraft && totalMs > 0 && (
        <div className="px-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">Transaction Progress</span>
            <span className="text-xs font-medium">{progress}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content with tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue={isDraft ? "documents" : "timeline"} className="w-full">
            <TabsList className="w-full justify-start bg-muted/50 h-11">
              <TabsTrigger value="timeline" className="gap-1.5 text-xs">
                <Clock className="h-3.5 w-3.5" /> Timeline
              </TabsTrigger>
              <TabsTrigger value="documents" className="gap-1.5 text-xs">
                <FileText className="h-3.5 w-3.5" /> Documents
                {(tx.documents || []).length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-4 text-[10px] px-1.5">{(tx.documents || []).length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="tasks" className="gap-1.5 text-xs">
                <ListChecks className="h-3.5 w-3.5" /> Tasks
              </TabsTrigger>
              <TabsTrigger value="notes" className="gap-1.5 text-xs">
                <MessageSquare className="h-3.5 w-3.5" /> Notes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="timeline">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Timeline — Click to toggle status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(tx.milestones || []).map((ms: any) => {
                      const isOverdue = ms.status === "pending" && new Date(ms.dueDate) < new Date()
                      return (
                        <div
                          key={ms.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
                            ms.status === "completed" ? "bg-green-50/50 border-green-200" :
                            isOverdue ? "bg-red-50/50 border-red-200" :
                            "bg-white border-border hover:border-primary/30"
                          }`}
                          onClick={() => toggleMilestone(ms.id, ms.status)}
                        >
                          <CheckCircle2 className={`h-5 w-5 shrink-0 transition-colors ${
                            ms.status === "completed" ? "text-green-600" :
                            isOverdue ? "text-red-500" : "text-muted-foreground/30"
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${ms.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                              {ms.name}
                            </p>
                            <p className="text-xs text-muted-foreground">{formatDate(ms.dueDate)}</p>
                          </div>
                          <Badge variant="outline" className={`text-[10px] ${
                            ms.status === "completed" ? "text-green-700 border-green-300" :
                            isOverdue ? "text-red-700 border-red-300" :
                            "text-muted-foreground"
                          }`}>
                            {ms.status === "completed" ? "Done" : isOverdue ? "Overdue" : "Pending"}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents">
              <Card>
                <CardContent className="p-5">
                  <DocumentList
                    documents={tx.documents || []}
                    transactionId={params.id}
                    onUpload={handleUpload}
                    onDelete={deleteDoc}
                    uploading={uploading}
                    signingLinks={signingLinks}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tasks">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Task Checklist</CardTitle>
                </CardHeader>
                <CardContent>
                  <TaskChecklist transactionId={params.id} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Notes & Comments</CardTitle>
                </CardHeader>
                <CardContent>
                  <NotesSection transactionId={params.id} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Activity Log */}
          {tx.activity && tx.activity.length > 0 && (
            <Card className="mt-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Activity Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {tx.activity.map((a: any) => (
                    <div key={a.id} className="flex items-center gap-3 text-sm py-1.5 px-2 rounded hover:bg-muted/50 transition-colors">
                      <span className="text-xs text-muted-foreground w-32 shrink-0">{formatDate(a.createdAt)}</span>
                      <span>{a.details}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <PartyList parties={tx.parties || []} />

          {/* Quick document upload card (always visible in sidebar) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" /> Quick Upload
              </CardTitle>
            </CardHeader>
            <CardContent>
              <label className="cursor-pointer block">
                <input type="file" accept=".pdf" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/40 hover:bg-muted/30 transition-all">
                  {uploading ? (
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  ) : (
                    <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                  )}
                  <p className="text-xs text-muted-foreground">
                    {uploading ? "Uploading..." : "Drop PDFs here or click to browse"}
                  </p>
                </div>
              </label>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
