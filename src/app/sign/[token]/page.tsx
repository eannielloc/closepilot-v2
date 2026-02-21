"use client"

import { useEffect, useState, useRef } from "react"

const ROLE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  buyer: { bg: "bg-blue-50", border: "border-blue-400", text: "text-blue-700" },
  seller: { bg: "bg-green-50", border: "border-green-400", text: "text-green-700" },
  agent: { bg: "bg-orange-50", border: "border-orange-400", text: "text-orange-700" },
}

function cursiveSignature(name: string): string {
  // Returns an SVG data URL with cursive-style text
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="60">
    <text x="10" y="42" font-family="'Brush Script MT', 'Segoe Script', 'Dancing Script', cursive" font-size="36" fill="#1a1a2e">${name}</text>
  </svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export default function SignPage({ params }: { params: { token: string } }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [session, setSession] = useState<any>(null)
  const [fields, setFields] = useState<any[]>([])
  const [filledValues, setFilledValues] = useState<Record<string, string>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [activeInput, setActiveInput] = useState<string | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const pdfDocRef = useRef<any>(null)

  // Load signing session data
  useEffect(() => {
    fetch(`/api/sign/${params.token}`)
      .then(r => { if (!r.ok) throw new Error("Invalid link"); return r.json() })
      .then(data => {
        setSession(data.session)
        setFields(data.fields)
        if (data.session.status === "signed") setCompleted(true)
        // Pre-fill existing values
        const vals: Record<string, string> = {}
        for (const v of data.values || []) vals[v.field_id] = v.value
        setFilledValues(vals)
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [params.token])

  // Load PDF
  useEffect(() => {
    if (!session) return
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
      const pdf = await pdfjsLib.getDocument(`/api/documents/${session.documentId}/file`).promise
      pdfDocRef.current = pdf
      setTotalPages(pdf.numPages)
    }
    loadPdf()
  }, [session])

  // Render page
  useEffect(() => {
    if (!pdfDocRef.current || !canvasRef.current) return
    const renderPage = async () => {
      const page = await pdfDocRef.current.getPage(currentPage)
      const canvas = canvasRef.current!
      const ctx = canvas.getContext("2d")!
      const containerWidth = containerRef.current?.clientWidth || 800
      const viewport = page.getViewport({ scale: 1 })
      const scale = Math.min((containerWidth - 40) / viewport.width, 1.5)
      const scaledViewport = page.getViewport({ scale })
      canvas.width = scaledViewport.width
      canvas.height = scaledViewport.height
      await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise
    }
    renderPage()
  }, [currentPage, totalPages])

  const myFields = fields.filter((f: any) => f.assignee_role === session?.signerRole)
  const pageFields = myFields.filter((f: any) => f.page_number === currentPage)
  const filledCount = myFields.filter((f: any) => filledValues[f.id]).length
  const allFilled = filledCount === myFields.length && myFields.length > 0

  const handleFieldClick = (field: any) => {
    if (completed) return
    if (field.field_type === "signature") {
      setFilledValues(prev => ({ ...prev, [field.id]: session.signerName }))
    } else if (field.field_type === "initials") {
      const initials = session.signerName.split(" ").map((n: string) => n[0]).join("").toUpperCase()
      setFilledValues(prev => ({ ...prev, [field.id]: initials }))
    } else if (field.field_type === "date") {
      setFilledValues(prev => ({ ...prev, [field.id]: new Date().toLocaleDateString("en-US") }))
    } else if (field.field_type === "checkbox") {
      setFilledValues(prev => ({ ...prev, [field.id]: prev[field.id] ? "" : "checked" }))
    } else if (field.field_type === "text") {
      setActiveInput(field.id)
    }
  }

  const submitSigning = async () => {
    setSubmitting(true)
    try {
      const fieldValues = Object.entries(filledValues).map(([fieldId, value]) => ({ fieldId, value }))
      const res = await fetch(`/api/sign/${params.token}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fieldValues }),
      })
      if (res.ok) setCompleted(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-xl p-8 shadow-lg text-center max-w-md">
        <div className="text-4xl mb-4">🔗</div>
        <h1 className="text-xl font-bold mb-2">Invalid Signing Link</h1>
        <p className="text-gray-500">This link may have expired or been used already.</p>
      </div>
    </div>
  )

  if (completed) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-xl p-8 shadow-lg text-center max-w-md">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-2xl font-bold mb-2">Document Signed!</h1>
        <p className="text-gray-500">Thank you, {session.signerName}. Your signature has been recorded.</p>
        <p className="text-sm text-gray-400 mt-4">{session.documentName}</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg">Sign: {session.documentName}</h1>
            <p className="text-sm text-gray-500">
              Signing as <span className="font-medium capitalize">{session.signerRole}</span>: {session.signerName}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{filledCount}/{myFields.length} fields</span>
            <button
              onClick={submitSigning}
              disabled={!allFilled || submitting}
              className={`px-5 py-2 rounded-lg font-medium text-sm transition-all ${
                allFilled
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {submitting ? "Submitting..." : "Complete Signing"}
            </button>
          </div>
        </div>
      </div>

      {/* Page nav */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 py-2 bg-white border-b">
          <button disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1 rounded border text-sm disabled:opacity-30">← Prev</button>
          <span className="text-sm">Page {currentPage} of {totalPages}</span>
          <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1 rounded border text-sm disabled:opacity-30">Next →</button>
        </div>
      )}

      {/* PDF with fields */}
      <div ref={containerRef} className="max-w-4xl mx-auto p-5 flex justify-center">
        <div className="relative inline-block shadow-xl rounded-lg overflow-hidden">
          <canvas ref={canvasRef} className="block" />
          {pageFields.map((f: any) => {
            const rc = ROLE_COLORS[f.assignee_role] || ROLE_COLORS.buyer
            const filled = filledValues[f.id]
            return (
              <div
                key={f.id}
                onClick={() => handleFieldClick(f)}
                className={`absolute border-2 rounded cursor-pointer transition-all ${
                  filled
                    ? "border-green-400 bg-green-50/80"
                    : `${rc.border} ${rc.bg} animate-pulse hover:shadow-lg`
                }`}
                style={{ left: f.x, top: f.y, width: f.width, height: f.height }}
              >
                {filled ? (
                  <div className="w-full h-full flex items-center justify-center overflow-hidden">
                    {f.field_type === "signature" ? (
                      <img src={cursiveSignature(filled)} alt="signature" className="h-full object-contain" />
                    ) : f.field_type === "checkbox" ? (
                      <span className="text-green-600 font-bold">✓</span>
                    ) : (
                      <span className="text-sm font-medium text-gray-800 px-1 truncate">{filled}</span>
                    )}
                  </div>
                ) : (
                  <div className={`w-full h-full flex items-center justify-center text-xs font-medium ${rc.text}`}>
                    {f.field_type === "signature" ? "Click to Sign" :
                     f.field_type === "initials" ? "Initials" :
                     f.field_type === "date" ? "Date" :
                     f.field_type === "checkbox" ? "☐" :
                     "Click to type"}
                  </div>
                )}

                {/* Text input overlay */}
                {activeInput === f.id && f.field_type === "text" && (
                  <input
                    autoFocus
                    className="absolute inset-0 w-full h-full px-1 text-sm border-2 border-blue-500 rounded outline-none"
                    value={filledValues[f.id] || ""}
                    onChange={e => setFilledValues(prev => ({ ...prev, [f.id]: e.target.value }))}
                    onBlur={() => setActiveInput(null)}
                    onKeyDown={e => e.key === "Enter" && setActiveInput(null)}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Instructions */}
      <div className="max-w-4xl mx-auto px-5 pb-10">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <strong>Instructions:</strong> Click each highlighted field to fill it in. Signature and initials auto-generate from your name.
          Date fields auto-fill with today&apos;s date. When all fields are filled, click &quot;Complete Signing&quot;.
        </div>
      </div>
    </div>
  )
}
