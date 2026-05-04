"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, Phone, Building, Users, UserPlus, ExternalLink, Copy, Check } from "lucide-react"
import { useState } from "react"

interface Party {
  id: string
  role: string
  name: string
  email?: string | null
  phone?: string | null
  company?: string | null
  portalUrl?: string | null
  invitedAt?: string | null
  lastViewedAt?: string | null
}

function roleLabel(role: string): string {
  return role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function roleColor(role: string): string {
  switch (role) {
    case "buyer": return "bg-blue-100 text-blue-700 border-blue-200"
    case "seller": return "bg-violet-100 text-violet-700 border-violet-200"
    case "listing_agent": return "bg-orange-100 text-orange-700 border-orange-200"
    case "buyers_agent": return "bg-emerald-100 text-emerald-700 border-emerald-200"
    case "lender": return "bg-amber-100 text-amber-700 border-amber-200"
    case "title": return "bg-indigo-100 text-indigo-700 border-indigo-200"
    case "title_company": return "bg-indigo-100 text-indigo-700 border-indigo-200"
    case "attorney": return "bg-slate-100 text-slate-700 border-slate-200"
    case "inspector": return "bg-teal-100 text-teal-700 border-teal-200"
    case "appraiser": return "bg-cyan-100 text-cyan-700 border-cyan-200"
    case "contractor": return "bg-rose-100 text-rose-700 border-rose-200"
    default: return "bg-gray-100 text-gray-700 border-gray-200"
  }
}

function roleInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()
}

function roleBgColor(role: string): string {
  switch (role) {
    case "buyer": return "bg-blue-500"
    case "seller": return "bg-violet-500"
    case "listing_agent": return "bg-orange-500"
    case "buyers_agent": return "bg-emerald-500"
    case "lender": return "bg-amber-500"
    case "title":
    case "title_company": return "bg-indigo-500"
    case "attorney": return "bg-slate-500"
    case "inspector": return "bg-teal-500"
    case "appraiser": return "bg-cyan-500"
    case "contractor": return "bg-rose-500"
    default: return "bg-gray-500"
  }
}

export function PartyList({ parties, onInvite }: { parties: Party[]; onInvite?: () => void }) {
  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          Parties
          <span className="text-xs font-normal text-muted-foreground">({parties.length})</span>
        </CardTitle>
        {onInvite && (
          <Button size="sm" variant="outline" onClick={onInvite} className="h-7 gap-1.5 text-xs">
            <UserPlus className="h-3 w-3" /> Invite
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {parties.length === 0 ? (
          <div className="text-center py-6 px-3 border border-dashed rounded-lg">
            <Users className="h-7 w-7 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
              Invite buyers, sellers, lenders, inspectors, attorneys — each gets their own portal with relevant tasks and deadlines.
            </p>
            {onInvite && (
              <Button size="sm" onClick={onInvite} className="gap-1.5">
                <UserPlus className="h-3 w-3" /> Invite first party
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {parties.map((party) => (
              <PartyRow key={party.id} party={party} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function PartyRow({ party }: { party: Party }) {
  const [copied, setCopied] = useState(false)
  const copyLink = async () => {
    if (!party.portalUrl) return
    await navigator.clipboard.writeText(party.portalUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  const lastViewed = party.lastViewedAt ? new Date(party.lastViewedAt) : null

  return (
    <div className="rounded-xl border bg-background hover:bg-muted/30 transition-colors">
      <div className="flex items-start gap-3 p-3">
        <div className={`w-9 h-9 rounded-full ${roleBgColor(party.role)} flex items-center justify-center shrink-0`}>
          <span className="text-[11px] font-bold text-white">{roleInitials(party.name)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-medium text-sm truncate">{party.name}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${roleColor(party.role)}`}>
              {roleLabel(party.role)}
            </span>
            {lastViewed && (
              <span className="text-[10px] text-emerald-600 font-medium" title={lastViewed.toLocaleString()}>
                · viewed
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {party.email && (
              <a href={`mailto:${party.email}`} className="flex items-center gap-1 hover:text-foreground transition-colors">
                <Mail className="h-3 w-3" /> {party.email}
              </a>
            )}
            {party.phone && (
              <a href={`tel:${party.phone}`} className="flex items-center gap-1 hover:text-foreground transition-colors">
                <Phone className="h-3 w-3" /> {party.phone}
              </a>
            )}
            {party.company && (
              <span className="flex items-center gap-1">
                <Building className="h-3 w-3" /> {party.company}
              </span>
            )}
          </div>
        </div>
      </div>
      {party.portalUrl && (
        <div className="border-t px-3 py-2 flex items-center justify-between gap-2">
          <span className="text-[10px] text-muted-foreground truncate flex-1">
            Portal link {party.invitedAt ? "· emailed" : "· not yet emailed"}
          </span>
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded hover:bg-muted transition-colors"
          >
            {copied ? <><Check className="h-3 w-3 text-green-500" /> Copied</> : <><Copy className="h-3 w-3" /> Copy link</>}
          </button>
          <a
            href={party.portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded hover:bg-muted transition-colors"
          >
            <ExternalLink className="h-3 w-3" /> Open
          </a>
        </div>
      )}
    </div>
  )
}
