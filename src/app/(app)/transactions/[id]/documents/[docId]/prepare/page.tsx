"use client"

import { useEffect, useState, useRef, useCallback, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, Send, Loader2, Type, PenTool, CalendarDays, CheckSquare, Hash, Trash2, ChevronLeft, ChevronRight, PanelRightOpen, PanelRightClose, Sparkles, FileText } from "lucide-react"

// ─── Constants ────────────────────────────────────────────────────────

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

// ─── Deal Data Config ─────────────────────────────────────────────────

interface DealData {
  propertyAddress: string
  city: string
  state: string
  zip: string
  mlsNumber: string
  purchasePrice: string
  earnestMoney: string
  closingDate: string
  buyerName: string
  buyerEmail: string
  sellerName: string
  sellerEmail: string
  listingAgent: string
  listingBrokerage: string
  buyerAgent: string
  buyerBrokerage: string
  loanType: string
  loanAmount: string
}

const DEAL_DATA_FIELDS: Array<{ key: keyof DealData; label: string; type?: string; section: string }> = [
  { key: "propertyAddress", label: "Property Address", section: "Property" },
  { key: "city", label: "City", section: "Property" },
  { key: "state", label: "State", section: "Property" },
  { key: "zip", label: "ZIP", section: "Property" },
  { key: "mlsNumber", label: "MLS #", section: "Property" },
  { key: "purchasePrice", label: "Purchase Price", section: "Terms" },
  { key: "earnestMoney", label: "Earnest Money", section: "Terms" },
  { key: "closingDate", label: "Closing Date", type: "date", section: "Terms" },
  { key: "loanType", label: "Loan Type", section: "Terms" },
  { key: "loanAmount", label: "Loan Amount", section: "Terms" },
  { key: "buyerName", label: "Buyer Name(s)", section: "Buyer" },
  { key: "buyerEmail", label: "Buyer Email", type: "email", section: "Buyer" },
  { key: "sellerName", label: "Seller Name(s)", section: "Seller" },
  { key: "sellerEmail", label: "Seller Email", type: "email", section: "Seller" },
  { key: "listingAgent", label: "Listing Agent", section: "Agents" },
  { key: "listingBrokerage", label: "Listing Brokerage", section: "Agents" },
  { key: "buyerAgent", label: "Buyer's Agent", section: "Agents" },
  { key: "buyerBrokerage", label: "Buyer's Brokerage", section: "Agents" },
]

const EMPTY_DEAL_DATA: DealData = {
  propertyAddress: "", city: "", state: "", zip: "", mlsNumber: "",
  purchasePrice: "", earnestMoney: "", closingDate: "",
  buyerName: "", buyerEmail: "", sellerName: "", sellerEmail: "",
  listingAgent: "", listingBrokerage: "", buyerAgent: "", buyerBrokerage: "",
  loanType: "", loanAmount: "",
}

// Field name matching patterns for auto-fill
const FIELD_MATCH_PATTERNS: Array<{ patterns: RegExp[]; dataKey: keyof DealData }> = [
  { patterns: [/property.?addr/i, /^address$/i, /prop.?add/i, /street/i, /location/i], dataKey: "propertyAddress" },
  { patterns: [/^city$/i], dataKey: "city" },
  { patterns: [/^state$/i], dataKey: "state" },
  { patterns: [/^zip/i, /postal/i], dataKey: "zip" },
  { patterns: [/mls/i, /listing.?num/i], dataKey: "mlsNumber" },
  { patterns: [/purchase.?price/i, /sale.?price/i, /^price$/i, /contract.?price/i], dataKey: "purchasePrice" },
  { patterns: [/earnest/i, /deposit/i, /emd/i], dataKey: "earnestMoney" },
  { patterns: [/closing.?date/i, /close.?date/i, /settlement.?date/i], dataKey: "closingDate" },
  { patterns: [/buyer.?name/i, /purchaser/i, /buyer_1/i, /buyer1/i, /^buyer$/i], dataKey: "buyerName" },
  { patterns: [/buyer.?email/i, /purchaser.?email/i], dataKey: "buyerEmail" },
  { patterns: [/seller.?name/i, /vendor/i, /seller_1/i, /seller1/i, /^seller$/i], dataKey: "sellerName" },
  { patterns: [/seller.?email/i, /vendor.?email/i], dataKey: "sellerEmail" },
  { patterns: [/listing.?agent/i, /seller.?agent/i], dataKey: "listingAgent" },
  { patterns: [/listing.?brok/i, /seller.?brok/i], dataKey: "listingBrokerage" },
  { patterns: [/buyer.?agent/i, /selling.?agent/i, /cooperating/i], dataKey: "buyerAgent" },
  { patterns: [/buyer.?brok/i, /selling.?brok/i], dataKey: "buyerBrokerage" },
  { patterns: [/loan.?type/i, /mortgage.?type/i, /financing/i], dataKey: "loanType" },
  { patterns: [/loan.?amount/i, /mortgage.?amount/i], dataKey: "loanAmount" },
]

function matchFieldToData(fieldName: string): keyof DealData | null {
  for (const { patterns, dataKey } of FIELD_MATCH_PATTERNS) {
    for (const p of patterns) {
      if (p.test(fieldName)) return dataKey
    }
  }
  return null
}

// ─── Types ────────────────────────────────────────────────────────────

interface PlacedField {
  id: string
  pageNumber: number
  fieldType: string
  assigneeRole: string
  x: number
  y: number
  width: number
  height: number
  value?: string
  dataTag?: keyof DealData | null
  autoFilled?: boolean
}

interface PdfFormField {
  id: string
  pageNumber: number
  fieldName: string
  fieldType: "text" | "checkbox" | "radio" | "dropdown"
  rect: { x: number; y: number; width: number; height: number }
  options?: string[]
  defaultValue?: string
  value?: string
  dataTag?: keyof DealData | null
  autoFilled?: boolean
}

// ─── Cursive signature SVG ────────────────────────────────────────────

function cursiveSignatureSvg(name: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="60"><text x="10" y="42" font-family="'Brush Script MT','Segoe Script','Dancing Script',cursive" font-size="36" fill="#1a1a2e">${name.replace(/[<>&"]/g, '')}</text></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

// ─── Main Component ───────────────────────────────────────────────────

export default function PreparePage({ params }: { params: { id: string; docId: string } }) {
  // Existing state
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

  // New state for form fields & deal data
  const [pdfFormFields, setPdfFormFields] = useState<PdfFormField[]>([])
  const [dealData, setDealData] = useState<DealData>(EMPTY_DEAL_DATA)
  const [showDealPanel, setShowDealPanel] = useState(false)
  const [dealDataSaving, setDealDataSaving] = useState(false)
  const [dealDataLoaded, setDealDataLoaded] = useState(false)
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null)
  const [resizingField, setResizingField] = useState<string | null>(null)
  const [resizeDir, setResizeDir] = useState<string | null>(null)
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, w: 0, h: 0, fx: 0, fy: 0 })

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const pdfDocRef = useRef<any>(null)
  const scaleRef = useRef(1)
  const fieldInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // ─── Load PDF ────────────────────────────────────────────────────────

  useEffect(() => {
    const loadPdf = async () => {
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

      // Detect form fields across all pages
      const allFormFields: PdfFormField[] = []
      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p)
        const annotations = await page.getAnnotations()
        const viewport = page.getViewport({ scale: 1 })

        for (const ann of annotations) {
          if (ann.subtype !== "Widget") continue
          if (!["Tx", "Btn", "Ch"].includes(ann.fieldType)) continue

          const rect = ann.rect // [x1, y1, x2, y2] in PDF coords (bottom-left origin)
          // Convert PDF coords to top-left screen coords
          const x1 = rect[0]
          const y1 = viewport.height - rect[3]
          const w = rect[2] - rect[0]
          const h = rect[3] - rect[1]

          let fieldType: PdfFormField["fieldType"] = "text"
          if (ann.fieldType === "Btn") fieldType = ann.checkBox || ann.radioButton ? "checkbox" : "checkbox"
          if (ann.fieldType === "Ch") fieldType = "dropdown"

          const fieldName = ann.fieldName || `field_${allFormFields.length}`
          const dataTag = matchFieldToData(fieldName)

          allFormFields.push({
            id: `pdf_${p}_${allFormFields.length}`,
            pageNumber: p,
            fieldName,
            fieldType,
            rect: { x: x1, y: y1, width: Math.max(w, 20), height: Math.max(h, 16) },
            options: ann.options?.map((o: any) => o.displayValue || o.exportValue) || [],
            defaultValue: ann.fieldValue || "",
            value: ann.fieldValue || "",
            dataTag,
            autoFilled: false,
          })
        }
      }

      setPdfFormFields(allFormFields)
    }
    loadPdf()
  }, [params.docId])

  // ─── Render current page ─────────────────────────────────────────────

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

      // Render with form fields disabled (we overlay our own)
      await page.render({
        canvasContext: ctx,
        viewport: scaledViewport,
        renderInteractiveForms: false,
      }).promise
    }
    renderPage()
  }, [currentPage, pdfLoaded])

  // ─── Load saved fields ───────────────────────────────────────────────

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
            value: "",
            dataTag: null,
            autoFilled: false,
          })))
        }
      })
  }, [params.docId])

  // ─── Load deal data ──────────────────────────────────────────────────

  useEffect(() => {
    fetch(`/api/transactions/${params.id}/deal-data`)
      .then(r => r.json())
      .then(data => {
        if (data.dealData && Object.keys(data.dealData).length > 0) {
          setDealData(prev => ({ ...prev, ...data.dealData }))
        }
        setDealDataLoaded(true)
      })
      .catch(() => setDealDataLoaded(true))
  }, [params.id])

  // ─── Auto-fill when deal data changes ────────────────────────────────

  useEffect(() => {
    if (!dealDataLoaded) return

    // Auto-fill PDF form fields
    setPdfFormFields(prev => prev.map(f => {
      if (!f.dataTag) return f
      const val = dealData[f.dataTag]
      if (val && val.trim()) {
        return { ...f, value: val, autoFilled: true }
      }
      return f.autoFilled ? { ...f, value: "", autoFilled: false } : f
    }))

    // Auto-fill placed fields that have dataTags
    setFields(prev => prev.map(f => {
      if (!f.dataTag) return f
      const val = dealData[f.dataTag]
      if (val && val.trim()) {
        return { ...f, value: val, autoFilled: true }
      }
      return f.autoFilled ? { ...f, value: "", autoFilled: false } : f
    }))
  }, [dealData, dealDataLoaded])

  // ─── Auto-fill stats ─────────────────────────────────────────────────

  const autoFillStats = useMemo(() => {
    const pdfAutoFilled = pdfFormFields.filter(f => f.autoFilled).length
    const placedAutoFilled = fields.filter(f => f.autoFilled).length
    const totalAutoFilled = pdfAutoFilled + placedAutoFilled
    const totalFields = pdfFormFields.length + fields.length
    return { totalAutoFilled, totalFields }
  }, [pdfFormFields, fields])

  // ─── Save deal data ──────────────────────────────────────────────────

  const saveDealData = async () => {
    setDealDataSaving(true)
    try {
      await fetch(`/api/transactions/${params.id}/deal-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealData }),
      })
    } finally {
      setDealDataSaving(false)
    }
  }

  // Debounced auto-save deal data
  const dealDataTimerRef = useRef<NodeJS.Timeout | null>(null)
  const updateDealData = (key: keyof DealData, value: string) => {
    setDealData(prev => ({ ...prev, [key]: value }))
    if (dealDataTimerRef.current) clearTimeout(dealDataTimerRef.current)
    dealDataTimerRef.current = setTimeout(() => {
      saveDealData()
    }, 1500)
  }

  // ─── Field placement ─────────────────────────────────────────────────

  const addField = (type: string, e: React.MouseEvent) => {
    if (!containerRef.current || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const ft = FIELD_TYPES.find(f => f.type === type)!
    const x = Math.max(0, Math.min(e.clientX - rect.left - ft.w / 2, canvasRef.current.width - ft.w))
    const y = Math.max(0, Math.min(e.clientY - rect.top - ft.h / 2, canvasRef.current.height - ft.h))

    const defaultValue = type === "date" ? new Date().toLocaleDateString("en-US") : ""

    const newField: PlacedField = {
      id: `fld_${Math.random().toString(36).slice(2, 10)}`,
      pageNumber: currentPage,
      fieldType: type,
      assigneeRole: selectedRole,
      x, y,
      width: ft.w,
      height: ft.h,
      value: defaultValue,
      dataTag: null,
      autoFilled: false,
    }
    setFields(prev => [...prev, newField])
    setSelectedField(newField.id)
    if (type === "text") setActiveFieldId(newField.id)
    setSaved(false)
  }

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (draggingNew) {
      addField(draggingNew, e)
      setDraggingNew(null)
    } else {
      setSelectedField(null)
      setActiveFieldId(null)
    }
  }

  const startDragField = (fieldId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setDraggingField(fieldId)
    setSelectedField(fieldId)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  const startResize = (fieldId: string, dir: string, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const field = fields.find(f => f.id === fieldId)
    if (!field) return
    setResizingField(fieldId)
    setResizeDir(dir)
    setResizeStart({ x: e.clientX, y: e.clientY, w: field.width, h: field.height, fx: field.x, fy: field.y })
  }

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggingField && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      const field = fields.find(f => f.id === draggingField)!
      const x = Math.max(0, Math.min(e.clientX - rect.left - dragOffset.x, canvasRef.current.width - field.width))
      const y = Math.max(0, Math.min(e.clientY - rect.top - dragOffset.y, canvasRef.current.height - field.height))
      setFields(prev => prev.map(f => f.id === draggingField ? { ...f, x, y } : f))
    }
    if (resizingField) {
      const dx = e.clientX - resizeStart.x
      const dy = e.clientY - resizeStart.y
      setFields(prev => prev.map(f => {
        if (f.id !== resizingField) return f
        let { w, h, fx, fy } = resizeStart
        const dir = resizeDir || ""
        if (dir.includes("e")) w = Math.max(40, w + dx)
        if (dir.includes("s")) h = Math.max(20, h + dy)
        if (dir.includes("w")) { w = Math.max(40, w - dx); fx = resizeStart.fx + dx }
        if (dir.includes("n")) { h = Math.max(20, h - dy); fy = resizeStart.fy + dy }
        return { ...f, width: w, height: h, x: fx, y: fy }
      }))
    }
  }, [draggingField, dragOffset, fields, resizingField, resizeDir, resizeStart])

  const handleMouseUp = () => {
    if (draggingField) { setDraggingField(null); setSaved(false) }
    if (resizingField) { setResizingField(null); setSaved(false) }
  }

  const deleteField = (id: string) => {
    setFields(prev => prev.filter(f => f.id !== id))
    setSelectedField(null)
    setSaved(false)
  }

  // ─── Update placed field value ───────────────────────────────────────

  const updateFieldValue = (fieldId: string, value: string) => {
    setFields(prev => prev.map(f => f.id === fieldId ? { ...f, value, autoFilled: false } : f))
  }

  // ─── Update PDF form field value ─────────────────────────────────────

  const updatePdfFieldValue = (fieldId: string, value: string) => {
    setPdfFormFields(prev => prev.map(f => f.id === fieldId ? { ...f, value, autoFilled: false } : f))
  }

  // ─── Tab order for fields ────────────────────────────────────────────

  const pageFieldsOrdered = useMemo(() => {
    const pdfOnPage = pdfFormFields
      .filter(f => f.pageNumber === currentPage)
      .map(f => ({ id: f.id, y: f.rect.y * scaleRef.current, x: f.rect.x * scaleRef.current, kind: "pdf" as const }))
    const placedOnPage = fields
      .filter(f => f.pageNumber === currentPage && f.fieldType === "text")
      .map(f => ({ id: f.id, y: f.y, x: f.x, kind: "placed" as const }))
    return [...pdfOnPage, ...placedOnPage].sort((a, b) => a.y - b.y || a.x - b.x)
  }, [pdfFormFields, fields, currentPage])

  const handleFieldTab = (currentFieldId: string, e: React.KeyboardEvent) => {
    if (e.key !== "Tab") return
    e.preventDefault()
    const idx = pageFieldsOrdered.findIndex(f => f.id === currentFieldId)
    const next = e.shiftKey
      ? pageFieldsOrdered[idx - 1] || pageFieldsOrdered[pageFieldsOrdered.length - 1]
      : pageFieldsOrdered[idx + 1] || pageFieldsOrdered[0]
    if (next) {
      setActiveFieldId(next.id)
      setTimeout(() => fieldInputRefs.current[next.id]?.focus(), 0)
    }
  }

  // ─── Save ────────────────────────────────────────────────────────────

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
            x: f.x, y: f.y,
            width: f.width, height: f.height,
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

  // ─── Filtered page fields ────────────────────────────────────────────

  const pageFields = fields.filter(f => f.pageNumber === currentPage)
  const pagePdfFields = pdfFormFields.filter(f => f.pageNumber === currentPage)
  const scale = scaleRef.current

  // ─── Render ──────────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-80px)]">
      {/* ─── Left Sidebar: Field Tools ─── */}
      <div className="w-64 border-r bg-gray-50/50 p-4 flex flex-col gap-4 overflow-y-auto flex-shrink-0">
        <Link href={`/transactions/${params.id}`}>
          <Button variant="ghost" size="sm" className="gap-1 -ml-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </Link>

        {/* PDF form field detection badge */}
        {pdfFormFields.length > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-emerald-700 text-sm font-medium">
              <FileText className="h-4 w-4" />
              {pdfFormFields.length} form fields detected
            </div>
            <p className="text-xs text-emerald-600 mt-1">
              This PDF has built-in form fields. Click any field to type directly.
            </p>
          </div>
        )}

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
          <h3 className="text-sm font-semibold mb-2">Add Fields</h3>
          <p className="text-xs text-muted-foreground mb-2">Click a field type, then click on the PDF</p>
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
                  {f.value && <span className="text-green-500 text-[10px]">✓</span>}
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
          <Button onClick={() => setShowSendModal(true)} variant="outline" className="w-full gap-1" size="sm" disabled={fields.length === 0 && pdfFormFields.length === 0}>
            <Send className="h-4 w-4" /> Send for Signing
          </Button>
        </div>
      </div>

      {/* ─── Center: PDF Viewer ─── */}
      <div className="flex-1 flex flex-col bg-gray-100 min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-white border-b">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">Page {currentPage} of {totalPages}</span>
            <Button variant="ghost" size="icon" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-3">
            {draggingNew && (
              <Badge className={roleColor(selectedRole).lightColor}>
                Click on PDF to place {draggingNew}
              </Badge>
            )}
            {autoFillStats.totalAutoFilled > 0 && (
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                <Sparkles className="h-3 w-3 mr-1" />
                Auto-filled {autoFillStats.totalAutoFilled}/{autoFillStats.totalFields}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDealPanel(!showDealPanel)}
              className="gap-1 text-xs"
            >
              {showDealPanel ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
              Deal Data
            </Button>
          </div>
        </div>

        {/* Canvas area */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto flex justify-center p-5"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <div className="relative inline-block shadow-xl bg-white">
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              className={`block ${draggingNew ? "cursor-crosshair" : "cursor-default"}`}
            />

            {/* ─── PDF Form Fields (detected from PDF) ─── */}
            {pagePdfFields.map(f => {
              const isFocused = activeFieldId === f.id
              const hasValue = !!(f.value && f.value.trim())

              return (
                <div
                  key={f.id}
                  className="absolute"
                  style={{
                    left: f.rect.x * scale,
                    top: f.rect.y * scale,
                    width: f.rect.width * scale,
                    height: f.rect.height * scale,
                  }}
                >
                  {f.fieldType === "text" && (
                    <input
                      ref={el => { fieldInputRefs.current[f.id] = el }}
                      type="text"
                      value={f.value || ""}
                      placeholder={f.fieldName.replace(/_/g, " ")}
                      onChange={e => updatePdfFieldValue(f.id, e.target.value)}
                      onFocus={() => setActiveFieldId(f.id)}
                      onBlur={() => { if (activeFieldId === f.id) setActiveFieldId(null) }}
                      onKeyDown={e => handleFieldTab(f.id, e)}
                      className={`w-full h-full px-1.5 text-sm font-serif bg-transparent border rounded-sm outline-none transition-all
                        ${isFocused ? "border-blue-500 ring-2 ring-blue-200 bg-white shadow-sm" :
                          hasValue ? (f.autoFilled ? "border-emerald-300 bg-emerald-50/60" : "border-gray-300 bg-blue-50/30") :
                          "border-gray-200 bg-white/80 hover:border-blue-300 hover:bg-white"
                        }
                      `}
                      style={{ fontSize: `${Math.min(f.rect.height * scale * 0.7, 14)}px` }}
                    />
                  )}
                  {f.fieldType === "checkbox" && (
                    <label
                      className={`w-full h-full flex items-center justify-center cursor-pointer rounded-sm border transition-all
                        ${f.value === "checked" ? "bg-blue-50 border-blue-400" : "bg-white/80 border-gray-300 hover:border-blue-300"}
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={f.value === "checked"}
                        onChange={e => updatePdfFieldValue(f.id, e.target.checked ? "checked" : "")}
                        className="sr-only"
                      />
                      {f.value === "checked" && <span className="text-blue-600 font-bold" style={{ fontSize: `${f.rect.height * scale * 0.7}px` }}>✓</span>}
                    </label>
                  )}
                  {f.fieldType === "dropdown" && (
                    <select
                      value={f.value || ""}
                      onChange={e => updatePdfFieldValue(f.id, e.target.value)}
                      className={`w-full h-full px-1 text-sm border rounded-sm outline-none transition-all bg-white/80
                        ${isFocused ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200 hover:border-blue-300"}
                      `}
                      onFocus={() => setActiveFieldId(f.id)}
                      style={{ fontSize: `${Math.min(f.rect.height * scale * 0.6, 13)}px` }}
                    >
                      <option value="">Select...</option>
                      {(f.options || []).map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                    </select>
                  )}
                  {/* Auto-fill indicator */}
                  {f.autoFilled && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full flex items-center justify-center" title="Auto-filled from deal data">
                      <Sparkles className="h-2 w-2 text-white" />
                    </div>
                  )}
                </div>
              )
            })}

            {/* ─── Placed Fields (user-added) ─── */}
            {pageFields.map(f => {
              const rc = roleColor(f.assigneeRole)
              const isSelected = selectedField === f.id
              const isFocused = activeFieldId === f.id
              const hasValue = !!(f.value && f.value.trim())

              return (
                <div
                  key={f.id}
                  onMouseDown={(e) => {
                    if (resizingField) return
                    startDragField(f.id, e)
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedField(f.id)
                    if (f.fieldType === "text") {
                      setActiveFieldId(f.id)
                      setTimeout(() => fieldInputRefs.current[f.id]?.focus(), 0)
                    } else if (f.fieldType === "date") {
                      updateFieldValue(f.id, f.value || new Date().toLocaleDateString("en-US"))
                    } else if (f.fieldType === "checkbox") {
                      updateFieldValue(f.id, f.value === "checked" ? "" : "checked")
                    } else if (f.fieldType === "signature") {
                      updateFieldValue(f.id, f.value || "Signature")
                    } else if (f.fieldType === "initials") {
                      updateFieldValue(f.id, f.value || "AB")
                    }
                  }}
                  className={`absolute group transition-shadow
                    ${isSelected ? "ring-2 ring-blue-500 ring-offset-1 z-10" : ""}
                    ${!hasValue && !isFocused ? "cursor-move" : ""}
                  `}
                  style={{
                    left: f.x,
                    top: f.y,
                    width: f.width,
                    height: f.height,
                  }}
                >
                  {/* ─── Text field ─── */}
                  {f.fieldType === "text" && (
                    <input
                      ref={el => { fieldInputRefs.current[f.id] = el }}
                      type="text"
                      value={f.value || ""}
                      placeholder="Type here..."
                      onChange={e => updateFieldValue(f.id, e.target.value)}
                      onFocus={() => setActiveFieldId(f.id)}
                      onBlur={() => { if (activeFieldId === f.id) setActiveFieldId(null) }}
                      onKeyDown={e => handleFieldTab(f.id, e)}
                      onMouseDown={e => { if (isFocused) e.stopPropagation() }}
                      className={`w-full h-full px-2 text-sm border rounded-sm outline-none transition-all font-serif
                        ${isFocused ? "border-blue-500 ring-2 ring-blue-200 bg-white shadow-sm cursor-text" :
                          hasValue ? (f.autoFilled ? "border-emerald-300 bg-emerald-50/60" : "border-gray-300 bg-blue-50/30") :
                          "border-dashed border-gray-300 bg-white/90 hover:border-blue-300"
                        }
                      `}
                    />
                  )}

                  {/* ─── Signature field ─── */}
                  {f.fieldType === "signature" && (
                    <div className={`w-full h-full border rounded-sm flex items-center justify-center transition-all
                      ${hasValue ? "border-gray-300 bg-white" : `border-dashed ${rc.lightColor} hover:shadow-md cursor-pointer`}
                    `}>
                      {hasValue ? (
                        <img src={cursiveSignatureSvg(f.value!)} alt="signature" className="h-full object-contain" />
                      ) : (
                        <span className={`text-xs font-medium ${rc.lightColor.split(" ").pop()}`}>Click to Sign</span>
                      )}
                    </div>
                  )}

                  {/* ─── Initials field ─── */}
                  {f.fieldType === "initials" && (
                    <div className={`w-full h-full border rounded-sm flex items-center justify-center transition-all
                      ${hasValue ? "border-gray-300 bg-white" : `border-dashed ${rc.lightColor} hover:shadow-md cursor-pointer`}
                    `}>
                      {hasValue ? (
                        <span className="font-serif italic text-lg text-gray-800">{f.value}</span>
                      ) : (
                        <span className={`text-xs font-medium ${rc.lightColor.split(" ").pop()}`}>Initials</span>
                      )}
                    </div>
                  )}

                  {/* ─── Date field ─── */}
                  {f.fieldType === "date" && (
                    <div className={`w-full h-full border rounded-sm flex items-center px-2 transition-all cursor-pointer
                      ${hasValue ? "border-gray-300 bg-blue-50/30" : `border-dashed ${rc.lightColor} hover:shadow-md`}
                    `}>
                      {hasValue ? (
                        <span className="text-sm font-serif text-gray-800">{f.value}</span>
                      ) : (
                        <span className={`text-xs font-medium ${rc.lightColor.split(" ").pop()}`}>Click for Date</span>
                      )}
                    </div>
                  )}

                  {/* ─── Checkbox field ─── */}
                  {f.fieldType === "checkbox" && (
                    <div className={`w-full h-full border rounded-sm flex items-center justify-center transition-all cursor-pointer
                      ${f.value === "checked" ? "border-blue-400 bg-blue-50" : "border-gray-300 bg-white hover:border-blue-300"}
                    `}>
                      {f.value === "checked" && <span className="text-blue-600 font-bold text-sm">✓</span>}
                    </div>
                  )}

                  {/* ─── Resize handles (when selected) ─── */}
                  {isSelected && f.fieldType !== "checkbox" && (
                    <>
                      <div onMouseDown={e => startResize(f.id, "se", e)} className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-se-resize z-20 hover:bg-blue-600" />
                      <div onMouseDown={e => startResize(f.id, "e", e)} className="absolute top-1/2 -right-1 w-2 h-4 -mt-2 bg-blue-400 rounded-full cursor-e-resize z-20 hover:bg-blue-500" />
                      <div onMouseDown={e => startResize(f.id, "s", e)} className="absolute -bottom-1 left-1/2 w-4 h-2 -ml-2 bg-blue-400 rounded-full cursor-s-resize z-20 hover:bg-blue-500" />
                    </>
                  )}

                  {/* ─── Delete button ─── */}
                  {isSelected && (
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteField(f.id) }}
                      className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 shadow-sm z-20"
                    >
                      ×
                    </button>
                  )}

                  {/* Auto-fill indicator */}
                  {f.autoFilled && (
                    <div className="absolute -top-1 -left-1 w-3 h-3 bg-emerald-500 rounded-full flex items-center justify-center z-20" title="Auto-filled from deal data">
                      <Sparkles className="h-2 w-2 text-white" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ─── Right Sidebar: Deal Data ─── */}
      {showDealPanel && (
        <div className="w-80 border-l bg-white flex flex-col flex-shrink-0">
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">Deal Data</h3>
              <p className="text-xs text-muted-foreground">Auto-fills matching fields</p>
            </div>
            {dealDataSaving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {["Property", "Terms", "Buyer", "Seller", "Agents"].map(section => (
              <div key={section} className="mb-5">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{section}</h4>
                <div className="space-y-2">
                  {DEAL_DATA_FIELDS.filter(f => f.section === section).map(f => (
                    <div key={f.key}>
                      <label className="text-xs text-gray-600 mb-0.5 block">{f.label}</label>
                      <input
                        type={f.type || "text"}
                        value={dealData[f.key]}
                        onChange={e => updateDealData(f.key, e.target.value)}
                        placeholder={f.label}
                        className="w-full text-sm border border-gray-200 rounded-md px-2.5 py-1.5 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition-all bg-gray-50/50 hover:bg-white"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t">
            <Button onClick={saveDealData} size="sm" variant="outline" className="w-full text-xs" disabled={dealDataSaving}>
              {dealDataSaving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
              Save Deal Data
            </Button>
          </div>
        </div>
      )}

      {/* ─── Send Modal ─── */}
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
