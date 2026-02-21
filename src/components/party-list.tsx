"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Phone, Building, Users } from "lucide-react"

interface Party {
  id: string
  role: string
  name: string
  email?: string | null
  phone?: string | null
  company?: string | null
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
    case "title_company": return "bg-indigo-100 text-indigo-700 border-indigo-200"
    case "attorney": return "bg-slate-100 text-slate-700 border-slate-200"
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
    case "title_company": return "bg-indigo-500"
    case "attorney": return "bg-slate-500"
    default: return "bg-gray-500"
  }
}

export function PartyList({ parties }: { parties: Party[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          Parties
          <span className="text-xs font-normal text-muted-foreground">({parties.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {parties.map((party) => (
            <div key={party.id} className="flex items-start gap-3 p-3 rounded-xl border bg-background hover:bg-muted/30 transition-colors">
              <div className={`w-9 h-9 rounded-full ${roleBgColor(party.role)} flex items-center justify-center shrink-0`}>
                <span className="text-[11px] font-bold text-white">{roleInitials(party.name)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm truncate">{party.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${roleColor(party.role)}`}>
                    {roleLabel(party.role)}
                  </span>
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
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
