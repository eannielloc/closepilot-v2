"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, Send, Loader2, GripVertical, Type, PenTool, CalendarDays, CheckSquare, Hash, Trash2, ChevronLeft, ChevronRight } from "lucide-react"

const FIELD_TYPES = [
  { type: "signature", label: "Signature", icon: PenTool, w: 200, h: 50 },
  { type: "initials", label: "Initials", icon: Hash, w: 80, h: 40 },
  { type: "date", label: "Date", icon: CalendarDays, w: 150, h: 30 },
  { type: "text", label: "Text", icon: Type, w: 200, h: 30 },
  { type: "checkbox", label: "Checkbox", icon: CheckSquare, w: 24, h: 24 },
]

const ROLES = [
  { role: "buyer", label: "Buyer", color: "bg-blue-500", lightColor: "bg-blue-100 border-blue-400 text-blue-700" },
  { role: "seller", label: "Seller", color: "bg-green-500", lightColor: "bg-green-100 border-green-400 text-green-700" },
  { role: "agent", label: "Agent", color: "bg-orange-500", lightColor: "bg-orange-100 border-orange-400 text-orange-700" },
]

function roleColor(role: string) {
  return ROLES.find(r => r.role === role) || ROLES[0]
}

interface PlacedField {
  id: string
  pageNumber: number
  fieldType: string
  assigneeRole: string
  x: number
  y: number
  width: number
  height: number
}

export default function PreparePage({ params }: { params: { id: string; docId: string } }) {
  const [fields, setFields] = useState<PlacedField[]>([])
  const [selectedRole, setSelectedRole] = useState("buyer")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [pdfLoaded, setPdfLoaded] = useState(false)
  const [draggingNew, setDraggingNew] = useState<string | null>(null)
  const [draggingField, setDraggingField] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [selectedField, setSelectedField] = useState<string | null>(null)
  const [showSendModal, setShowSendModal] = useState(false)
  const [signers, setSigners] = useState([
    { role: "buyer", name: "", email: "" },
    { role: "seller", name: "", email: "" },
  ])
  const [sendingStatus, setSendingStatus] = useState<"idle" | "sending" | "sent">("idle")
  const [signingLinks, setSigningLinks] = useState<any[]>([])

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const pdfDocRef = useRef<any>(null)
  const scaleRef = useRef(1)

  // Load PDF via script tag (can't import CDN ESM in Next.js webpack)
  useEffect(() => {
    const loadPdf = async () => {
      // Load pdf.js via script if not already loaded
      if (!(window as any).pdfjsLib) {
        await new Promise<void>((resolve) => {
          const script = document.createElement("script")
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
          script.onload = () => resolve()
          document.head.appendChild(script)
        })
      }
      const pdfjsLib = (window as any).pdfjsLib
      pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"

      const pdf = await pdfjsLib.getDocument(`/api/documents/${params.docId}/file`).promise
      pdfDocRef.current = pdf
      setTotalPages(pdf.numPages)
      setPdfLoaded(true)
    }
    loadPdf()
  }, [params.docId])

  // Render current page
  useEffect(() => {
    if (!pdfDocRef.current || !canvasRef.current) return
    const renderPage = async () => {
      const page = await pdfDocRef.current.getPage(currentPage)
      const canvas = canvasRef.current!
      const ctx = canvas.getContext("2d")!
      const containerWidth = containerRef.current?.clientWidth || 800
      const viewport = page.getViewport({ scale: 1 })
      const scale = (containerWidth - 40) / viewport.width
      scaleRef.current = scale
      const scaledViewport = page.getViewport({ scale })

      canvas.width = scaledViewport.width
      canvas.height = scaledViewport.height
      await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise
    }
    renderPage()
  }, [currentPage, pdfLoaded])

  // Load saved fields
  useEffect(() => {
    fetch(`/api/documents/${params.docId}/fields`)
      .then(r => r.json())
      .then(data => {
        if (data.fields) {
          setFields(data.fields.map((f: any) => ({
            id: f.id,
            pageNumber: f.page_number,
            fieldType: f.field_type,
            assigneeRole: f.assignee_role,
            x: f.x,
            y: f.y,
            width: f.width,
            height: f.height,
          })))
        }
      })
  }, [params.docId])

  const addField = (type: string, e: React.MouseEvent) => {
    if (!containerRef.current || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const ft = FIELD_TYPES.find(f => f.type === type)!
    const x = Math.max(0, Math.min(e.clientX - rect.left - ft.w / 2, canvasRef.current.width - ft.w))
    const y = Math.max(0, Math.min(e.clientY - rect.top - ft.h / 2, canvasRef.current.height - ft.h))

    const newField: PlacedField = {
      id: `fld_${Math.random().toString(36).slice(2, 10)}`,
      pageNumber: currentPage,
      fieldType: type,
      assigneeRole: selectedRole,
      x, y,
      width: ft.w,
      height: ft.h,
    }
    setFields(prev => [...prev, newField])
    setSelectedField(newField.id)
    setSaved(false)
  }

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (draggingNew) {
      addField(draggingNew, e)
      setDraggingNew(null)
    } else {
      setSelectedField(null)
    }
  }

  const startDragField = (fieldId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const field = fields.find(f => f.id === fieldId)!
    setDraggingField(fieldId)
    setSelectedField(fieldId)
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggingField || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const field = fields.find(f => f.id === draggingField)!
    const x = Math.max(0, Math.min(e.clientX - rect.left - dragOffset.x, canvasRef.current.width - field.width))
    const y = Math.max(0, Math.min(e.clientY - rect.top - dragOffset.y, canvasRef.current.height - field.height))
    setFields(prev => prev.map(f => f.id === draggingField ? { ...f, x, y } : f))
  }, [draggingField, dragOffset, fields])

  const handleMouseUp = () => {
    if (draggingField) {
      setDraggingField(null)
      setSaved(false)
    }
  }

  const deleteField = (id: string) => {
    setFields(prev => prev.filter(f => f.id !== id))
    setSelectedField(null)
    setSaved(false)
  }

  const saveFields = async () => {
    setSaving(true)
    try {
      await fetch(`/api/documents/${params.docId}/fields`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: fields.map(f => ({
            id: f.id,
            page_number: f.pageNumber,
            field_type: f.fieldType,
            assignee_role: f.assigneeRole,
            x: f.x,
            y: f.y,
            width: f.width,
            height: f.height,
          }))
        })
      })
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  const sendForSigning = async () => {
    setSendingStatus("sending")
    try {
      // Save fields first
      await saveFields()
      const validSigners = signers.filter(s => s.name && s.email)
      const res = await fetch(`/api/documents/${params.docId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signers: validSigners }),
      })
      const data = await res.json()
      setSigningLinks(data.sessions || [])
      setSendingStatus("sent")
    } catch {
      setSendingStatus("idle")
    }
  }

  const pageFields = fields.filter(f => f.pageNumber === currentPage)

  return (
    <div className="flex h-[calc(100vh-80px)]">
      {/* Sidebar */}
      <div className="w-72 border-r bg-gray-50/50 p-4 flex flex-col gap-4 overflow-y-auto">
        <Link href={`/transactions/${params.id}`}>
          <Button variant="ghost" size="sm" className="gap-1 -ml-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </Link>

        <div>
          <h3 className="text-sm font-semibold mb-2">Assignee</h3>
          <div className="flex gap-1">
            {ROLES.map(r => (
              <button
                key={r.role}
                onClick={() => setSelectedRole(r.role)}
                className={`flex-1 text-xs py-1.5 px-2 rounded-md border font-medium transition-all ${
                  selectedRole === r.role ? r.lightColor + " border-2" : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold mb-2">Fields</h3>
          <p className="text-xs text-muted-foreground mb-2">Click a field, then click on the PDF to place it</p>
          <div className="space-y-1">
            {FIELD_TYPES.map(ft => (
              <button
                key={ft.type}
                onClick={() => setDraggingNew(draggingNew === ft.type ? null : ft.type)}
                className={`w-full flex items-center gap-2 text-sm px-3 py-2 rounded-md border transition-all ${
                  draggingNew === ft.type
                    ? roleColor(selectedRole).lightColor + " border-2 shadow-sm"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                <ft.icon className="h-4 w-4" />
                {ft.label}
              </button>
            ))}
          </div>
        </div>

        {/* Placed fields list */}
        <div>
          <h3 className="text-sm font-semibold mb-2">Placed ({fields.length})</h3>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {fields.map(f => {
              const rc = roleColor(f.assigneeRole)
              return (
                <div
                  key={f.id}
                  className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded border cursor-pointer ${
                    selectedField === f.id ? rc.lightColor : "bg-white"
                  }`}
                  onClick={() => { setSelectedField(f.id); setCurrentPage(f.pageNumber) }}
                >
                  <div className={`w-2 h-2 rounded-full ${rc.color}`} />
                  <span className="flex-1 truncate capitalize">{f.fieldType} · p{f.pageNumber}</span>
                  <button onClick={(e) => { e.stopPropagation(); deleteField(f.id) }} className="text-red-400 hover:text-red-600">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-auto space-y-2">
          <Button onClick={saveFields} disabled={saving} className="w-full gap-1" size="sm">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saved ? "Saved ✓" : "Save Fields"}
          </Button>
          <Button onClick={() => setShowSendModal(true)} variant="outline" className="w-full gap-1" size="sm" disabled={fields.length === 0}>
            <Send className="h-4 w-4" /> Send for Signing
          </Button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 flex flex-col bg-gray-100">
        {/* Page navigation */}
        <div className="flex items-center justify-center gap-3 py-2 bg-white border-b">
          <Button variant="ghost" size="icon" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">Page {currentPage} of {totalPages}</span>
          <Button variant="ghost" size="icon" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          {draggingNew && (
            <Badge className={roleColor(selectedRole).lightColor + " ml-4"}>
              Click on PDF to place {draggingNew}
            </Badge>
          )}
        </div>

        {/* Canvas area */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto flex justify-center p-5"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <div className="relative inline-block shadow-xl">
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              className={`block ${draggingNew ? "cursor-crosshair" : "cursor-default"}`}
            />
            {/* Placed fields overlay */}
            {pageFields.map(f => {
              const rc = roleColor(f.assigneeRole)
              const isSelected = selectedField === f.id
              return (
                <div
                  key={f.id}
                  onMouseDown={(e) => startDragField(f.id, e)}
                  onClick={(e) => { e.stopPropagation(); setSelectedField(f.id) }}
                  className={`absolute border-2 rounded cursor-move flex items-center justify-center text-xs font-medium select-none transition-shadow ${
                    rc.lightColor
                  } ${isSelected ? "ring-2 ring-offset-1 ring-blue-500 shadow-lg" : "shadow"}`}
                  style={{
                    left: f.x,
                    top: f.y,
                    width: f.width,
                    height: f.height,
                    opacity: 0.85,
                  }}
                >
                  <span className="truncate px-1 capitalize">
                    {f.fieldType === "checkbox" ? "☐" : f.fieldType}
                  </span>
                  {isSelected && (
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteField(f.id) }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] hover:bg-red-600"
                    >
                      ×
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Send Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => sendingStatus !== "sending" && setShowSendModal(false)}>
          <div className="bg-white rounded-xl p-6 w-[480px] max-w-[90vw] shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">Send for Signing</h2>
            {sendingStatus === "sent" ? (
              <div className="space-y-3">
                <p className="text-green-600 font-medium">✅ Signing links generated!</p>
                {signingLinks.map((s: any) => (
                  <div key={s.id} className="p-3 rounded-lg border space-y-1">
                    <p className="font-medium capitalize">{s.role}: {s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.email}</p>
                    <div className="flex items-center gap-2">
                      <input
                        readOnly
                        value={`${typeof window !== "undefined" ? window.location.origin : ""}/sign/${s.token}`}
                        className="text-xs bg-gray-50 border rounded px-2 py-1 flex-1 font-mono"
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                      />
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/sign/${s.token}`)
                      }}>
                        Copy
                      </Button>
                    </div>
                  </div>
                ))}
                <Button onClick={() => setShowSendModal(false)} className="w-full mt-2">Done</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {signers.map((s, i) => (
                  <div key={i} className="p-3 rounded-lg border space-y-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${roleColor(s.role).color}`} />
                      <select
                        value={s.role}
                        onChange={e => setSigners(prev => prev.map((p, j) => j === i ? { ...p, role: e.target.value } : p))}
                        className="text-sm border rounded px-2 py-1"
                      >
                        {ROLES.map(r => <option key={r.role} value={r.role}>{r.label}</option>)}
                      </select>
                    </div>
                    <input
                      placeholder="Full Name"
                      value={s.name}
                      onChange={e => setSigners(prev => prev.map((p, j) => j === i ? { ...p, name: e.target.value } : p))}
                      className="w-full text-sm border rounded px-2 py-1.5"
                    />
                    <input
                      placeholder="Email"
                      type="email"
                      value={s.email}
                      onChange={e => setSigners(prev => prev.map((p, j) => j === i ? { ...p, email: e.target.value } : p))}
                      className="w-full text-sm border rounded px-2 py-1.5"
                    />
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setSigners(prev => [...prev, { role: "agent", name: "", email: "" }])}>
                  + Add Signer
                </Button>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setShowSendModal(false)} className="flex-1">Cancel</Button>
                  <Button onClick={sendForSigning} disabled={sendingStatus === "sending" || !signers.some(s => s.name && s.email)} className="flex-1 gap-1">
                    {sendingStatus === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Send
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
