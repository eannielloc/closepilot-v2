"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { UploadZone } from "@/components/upload-zone"
import { TimelineView } from "@/components/timeline-view"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { mockParseContract, type ParsedContract } from "@/lib/mock-parser"
import { formatCurrency, formatDate } from "@/lib/utils"
import { ArrowRight, CheckCircle, FileText, FolderOpen, Loader2 as Spinner, MapPin } from "lucide-react"

type EntryMode = "choose" | "upload" | "manual"

export default function NewTransactionPage() {
  const router = useRouter()
  const [mode, setMode] = useState<EntryMode>("choose")
  const [isLoading, setIsLoading] = useState(false)
  const [parsed, setParsed] = useState<ParsedContract | null>(null)
  const [propertyAddress, setPropertyAddress] = useState("")
  const [saving, setSaving] = useState(false)

  const handleUpload = async (file: File) => {
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 2000))
    const data = mockParseContract(file.name)
    setParsed(data)
    setIsLoading(false)
  }

  const handleCreateFromUpload = async () => {
    if (!parsed) return
    setSaving(true)
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyAddress: parsed.propertyAddress,
          buyerName: parsed.buyer.name,
          sellerName: parsed.seller.name,
          purchasePrice: parsed.purchasePrice,
          effectiveDate: parsed.effectiveDate,
          closingDate: parsed.closingDate,
          initialDeposit: parsed.financials.depositAmount,
          financingType: "conventional",
        }),
      })
      if (res.ok) router.push("/dashboard")
    } finally {
      setSaving(false)
    }
  }

  const handleCreateManual = async () => {
    if (!propertyAddress.trim()) return
    setSaving(true)
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyAddress: propertyAddress.trim(), mode: "draft" }),
      })
      if (res.ok) {
        const tx = await res.json()
        router.push(`/transactions/${tx.id}`)
      }
    } finally {
      setSaving(false)
    }
  }

  // Mode chooser
  if (mode === "choose") {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">New Transaction</h1>
          <p className="text-sm text-muted-foreground">Choose how to create your transaction</p>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all" onClick={() => setMode("upload")}>
            <CardContent className="py-12 text-center">
              <FileText className="h-10 w-10 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-1">Upload Contract</h3>
              <p className="text-sm text-muted-foreground">Upload an executed purchase agreement PDF — AI extracts key dates</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all" onClick={() => setMode("manual")}>
            <CardContent className="py-12 text-center">
              <FolderOpen className="h-10 w-10 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-1">Manual Transaction</h3>
              <p className="text-sm text-muted-foreground">Create a transaction folder — upload docs, prepare for e-sign, AI parses after signing</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Upload mode (existing flow)
  if (mode === "upload") {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Upload Contract</h1>
            <p className="text-sm text-muted-foreground">Upload an executed purchase agreement to get started</p>
          </div>
          <Button variant="ghost" onClick={() => setMode("choose")}>← Back</Button>
        </div>

        <UploadZone onFileAccepted={handleUpload} isLoading={isLoading} />

        {parsed && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  Contract Parsed Successfully
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Property</span><p className="font-medium">{parsed.propertyAddress}</p></div>
                  <div><span className="text-muted-foreground">Price</span><p className="font-medium">{formatCurrency(parsed.purchasePrice)}</p></div>
                  <div><span className="text-muted-foreground">Buyer</span><p className="font-medium">{parsed.buyer.name}</p></div>
                  <div><span className="text-muted-foreground">Seller</span><p className="font-medium">{parsed.seller.name}</p></div>
                  <div><span className="text-muted-foreground">Effective</span><p className="font-medium">{formatDate(parsed.effectiveDate)}</p></div>
                  <div><span className="text-muted-foreground">Closing</span><p className="font-medium">{formatDate(parsed.closingDate)}</p></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Generated Timeline</CardTitle></CardHeader>
              <CardContent>
                <TimelineView milestones={parsed.milestones.map((m, i) => ({
                  id: `preview_${i}`, name: m.name, type: m.type, dueDate: m.date,
                  status: new Date(m.date) < new Date() ? "completed" : "pending",
                }))} />
              </CardContent>
            </Card>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setParsed(null)}>Upload Different</Button>
              <Button onClick={handleCreateFromUpload} disabled={saving} className="gap-2">
                {saving ? "Creating..." : "Create Transaction"} <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Manual entry mode — property name only
  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">New Transaction</h1>
          <p className="text-sm text-muted-foreground">Enter the property address to create a transaction folder</p>
        </div>
        <Button variant="ghost" onClick={() => setMode("choose")}>← Back</Button>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div className="text-sm">
              <p className="font-medium">How it works</p>
              <p className="text-muted-foreground">Create a folder → upload documents → prepare for e-sign → AI extracts deal details after signing</p>
            </div>
          </div>
          <div>
            <Label htmlFor="address">Property Address</Label>
            <Input
              id="address"
              placeholder="123 Oak Street, Jacksonville, FL 32205"
              value={propertyAddress}
              onChange={(e) => setPropertyAddress(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateManual()}
              className="text-base h-12"
              autoFocus
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleCreateManual} disabled={saving || !propertyAddress.trim()} className="gap-2 h-11 px-6">
          {saving ? <><Spinner className="h-4 w-4 animate-spin" /> Creating...</> : <>Create Transaction <ArrowRight className="h-4 w-4" /></>}
        </Button>
      </div>
    </div>
  )
}
