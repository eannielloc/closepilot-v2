"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  FileText, Upload, Loader2, Trash2, PenTool, ExternalLink, Send,
  GripVertical, MoreVertical, CheckCircle2, Clock, AlertCircle, Eye
} from "lucide-react"

const DOCUMENT_TYPES = [
  "Purchase Agreement", "Addendum", "Lead Paint Disclosure", "Property Disclosure",
  "Home Inspection Report", "Appraisal", "Mortgage Commitment", "Title Search",
  "Survey", "Insurance Binder", "Pre-Approval Letter", "Other"
]

function docTypeColor(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes("purchase") || lower.includes("agreement")) return "bg-blue-100 text-blue-700 border-blue-200"
  if (lower.includes("inspection")) return "bg-amber-100 text-amber-700 border-amber-200"
  if (lower.includes("appraisal")) return "bg-violet-100 text-violet-700 border-violet-200"
  if (lower.includes("mortgage") || lower.includes("commitment") || lower.includes("pre-approval")) return "bg-green-100 text-green-700 border-green-200"
  if (lower.includes("title")) return "bg-indigo-100 text-indigo-700 border-indigo-200"
  if (lower.includes("disclosure") || lower.includes("lead")) return "bg-orange-100 text-orange-700 border-orange-200"
  if (lower.includes("addendum")) return "bg-pink-100 text-pink-700 border-pink-200"
  if (lower.includes("survey")) return "bg-teal-100 text-teal-700 border-teal-200"
  if (lower.includes("insurance")) return "bg-cyan-100 text-cyan-700 border-cyan-200"
  return "bg-gray-100 text-gray-700 border-gray-200"
}

function statusIcon(status: string) {
  switch (status) {
    case "completed": case "signed": return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
    case "sent": return <Send className="h-3.5 w-3.5 text-blue-500" />
    case "reviewed": return <Eye className="h-3.5 w-3.5 text-violet-500" />
    case "pending": case "draft": return <Clock className="h-3.5 w-3.5 text-gray-400" />
    default: return <Clock className="h-3.5 w-3.5 text-gray-400" />
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "completed": return "Signed"
    case "sent": return "Sent for Signing"
    case "reviewed": return "Reviewed"
    case "pending": case "draft": return "Pending"
    default: return status || "Draft"
  }
}

interface DocumentListProps {
  documents: any[]
  transactionId: string
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onDelete: (docId: string) => void
  uploading: boolean
  signingLinks?: Record<string, any[]>
  onFetchSigningStatus?: (docId: string) => void
}

export function DocumentList({
  documents,
  transactionId,
  onUpload,
  onDelete,
  uploading,
  signingLinks = {},
  onFetchSigningStatus,
}: DocumentListProps) {
  const [renaming, setRenaming] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      {/* Upload bar */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {documents.length} document{documents.length !== 1 ? "s" : ""}
        </div>
        <label className="cursor-pointer">
          <input type="file" accept=".pdf" multiple className="hidden" onChange={onUpload} disabled={uploading} />
          <span className="inline-flex items-center gap-1.5 text-xs bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-all shadow-sm font-medium">
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            Upload Documents
          </span>
        </label>
      </div>

      {documents.length > 0 ? (
        <div className="space-y-2">
          {documents.map((doc: any, index: number) => (
            <div
              key={doc.id}
              className="group flex items-center gap-3 p-3 rounded-xl border bg-white hover:shadow-sm hover:border-primary/20 transition-all"
            >
              {/* Drag handle + icon */}
              <div className="flex items-center gap-2 shrink-0">
                <GripVertical className="h-4 w-4 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-red-500" />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium truncate">{doc.name}</span>
                  <Badge variant="outline" className={`text-[10px] border ${docTypeColor(doc.name)}`}>
                    {guessDocType(doc.name)}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    {statusIcon(doc.status)}
                    {statusLabel(doc.status)}
                  </span>
                  {doc.uploadedAt && (
                    <span>
                      Uploaded {new Date(doc.uploadedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {doc.filePath && (
                  <Link href={`/transactions/${transactionId}/documents/${doc.id}/prepare`}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Prepare for signing">
                      <PenTool className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                )}
                <a href={`/api/documents/${doc.id}/file`} target="_blank" rel="noopener">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View document">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => onDelete(doc.id)}
                  title="Delete document"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed rounded-xl">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-muted mb-3">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium mb-1">No documents yet</p>
          <p className="text-xs text-muted-foreground mb-4">Upload PDFs to manage and prepare for signing</p>
          <label className="cursor-pointer">
            <input type="file" accept=".pdf" multiple className="hidden" onChange={onUpload} disabled={uploading} />
            <span className="inline-flex items-center gap-1.5 text-xs bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-all shadow-sm font-medium">
              <Upload className="h-3.5 w-3.5" />
              Upload Documents
            </span>
          </label>
        </div>
      )}

      {/* Signing status per doc */}
      {Object.entries(signingLinks).map(([docId, sessions]) => (
        sessions.length > 0 && (
          <div key={docId} className="p-3 rounded-lg border bg-muted/30">
            <p className="text-xs font-medium mb-2">Signing Status</p>
            <div className="space-y-1">
              {sessions.map((s: any) => (
                <div key={s.id} className="flex items-center gap-2 text-xs">
                  <span className="capitalize font-medium">{s.signer_role || s.signerRole}:</span>
                  <span className={s.status === "signed" ? "text-green-600" : s.status === "viewed" ? "text-blue-600" : "text-gray-500"}>
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      ))}
    </div>
  )
}

function guessDocType(filename: string): string {
  const lower = filename.toLowerCase()
  if (lower.includes("purchase") || lower.includes("agreement") || lower.includes("contract")) return "Purchase Agreement"
  if (lower.includes("addendum")) return "Addendum"
  if (lower.includes("lead") || lower.includes("paint")) return "Lead Paint"
  if (lower.includes("property") && lower.includes("disclos")) return "Disclosure"
  if (lower.includes("inspection")) return "Inspection"
  if (lower.includes("appraisal")) return "Appraisal"
  if (lower.includes("mortgage") || lower.includes("commitment")) return "Mortgage"
  if (lower.includes("title")) return "Title"
  if (lower.includes("survey")) return "Survey"
  if (lower.includes("insurance")) return "Insurance"
  if (lower.includes("pre-approval") || lower.includes("preapproval")) return "Pre-Approval"
  return "Document"
}
