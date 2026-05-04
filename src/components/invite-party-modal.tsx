"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { UserPlus, Loader2, CheckCircle2, Copy, X, Mail } from "lucide-react"

const ROLES: Array<{ value: string; label: string; description: string }> = [
  { value: "buyer", label: "Buyer", description: "The person purchasing the property" },
  { value: "seller", label: "Seller", description: "The person selling the property" },
  { value: "lender", label: "Lender", description: "Loan officer / mortgage rep" },
  { value: "title", label: "Title Company", description: "Title search + insurance" },
  { value: "attorney", label: "Attorney", description: "Real estate counsel" },
  { value: "inspector", label: "Inspector", description: "Home inspector" },
  { value: "appraiser", label: "Appraiser", description: "Independent appraiser" },
  { value: "contractor", label: "Contractor", description: "Repairs / improvements vendor" },
  { value: "other", label: "Other", description: "Any other party" },
]

interface Props {
  transactionId: string
  open: boolean
  onClose: () => void
  onCreated?: () => void
}

export function InvitePartyModal({ transactionId, open, onClose, onCreated }: Props) {
  const [role, setRole] = useState("buyer")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [company, setCompany] = useState("")
  const [sendInvite, setSendInvite] = useState(true)
  const [busy, setBusy] = useState(false)
  const [created, setCreated] = useState<{ portalUrl: string; invited: boolean; email?: string } | null>(null)
  const [copied, setCopied] = useState(false)

  if (!open) return null

  const reset = () => {
    setRole("buyer"); setName(""); setEmail(""); setPhone(""); setCompany("")
    setSendInvite(true); setCreated(null); setCopied(false)
  }

  const close = () => {
    reset()
    onClose()
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await fetch(`/api/transactions/${transactionId}/parties`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, name, email: email || undefined, phone: phone || undefined, company: company || undefined, sendInvite }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        alert(j.error || "Failed to add party")
        return
      }
      const data = await res.json()
      setCreated({ portalUrl: data.portalUrl, invited: data.invited, email })
      onCreated?.()
    } finally {
      setBusy(false)
    }
  }

  const copy = async () => {
    if (!created?.portalUrl) return
    await navigator.clipboard.writeText(created.portalUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={close}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="font-semibold flex items-center gap-2">
            <UserPlus className="h-4 w-4" /> {created ? "Party invited" : "Add a party to this deal"}
          </h2>
          <button type="button" onClick={close} className="text-gray-400 hover:text-gray-700"><X className="h-4 w-4" /></button>
        </div>

        {created ? (
          <div className="p-5 space-y-4">
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div className="text-sm text-green-900">
                <p className="font-semibold">{name} added as {ROLES.find((r) => r.value === role)?.label}.</p>
                {created.invited ? (
                  <p className="text-xs mt-1 text-green-800">Invite email sent to {created.email}.</p>
                ) : email ? (
                  <p className="text-xs mt-1 text-amber-800">SMTP not configured — send the link below manually.</p>
                ) : (
                  <p className="text-xs mt-1 text-green-800">No email provided — share the portal link below.</p>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-700 mb-1.5">Portal link (unique to this party)</p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={created.portalUrl}
                  className="flex-1 rounded-md border bg-gray-50 px-3 h-9 text-xs font-mono"
                  onFocus={(e) => e.target.select()}
                />
                <Button size="sm" type="button" onClick={copy} variant="outline" className="h-9 gap-1.5">
                  {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              <p className="text-[10px] text-gray-500 mt-1">
                Anyone with this link can see this deal as the {ROLES.find((r) => r.value === role)?.label}. Don't share it publicly.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setCreated(null)} className="flex-1">Add another</Button>
              <Button type="button" onClick={close} className="flex-1">Done</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Role</label>
              <select
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-md border px-3 h-9 text-sm bg-white"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label} — {r.description}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Name *</label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border px-3 h-9 text-sm"
                  placeholder="Jane Smith"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border px-3 h-9 text-sm"
                  placeholder="jane@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-md border px-3 h-9 text-sm"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Company</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full rounded-md border px-3 h-9 text-sm"
                  placeholder="Webster Bank"
                />
              </div>
            </div>

            <label className="flex items-start gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={sendInvite}
                onChange={(e) => setSendInvite(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                <span className="font-medium flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" /> Email them their portal link
                </span>
                <span className="text-xs text-gray-500 block">Requires SMTP env vars set. Otherwise you can copy the link after.</span>
              </span>
            </label>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={close} className="flex-1" disabled={busy}>Cancel</Button>
              <Button type="submit" className="flex-1 gap-1.5" disabled={busy}>
                {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {busy ? "Adding…" : "Add Party"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
