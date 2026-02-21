"use client"

import { Nav } from "@/components/nav"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <Nav />
      <main className="container py-6">{children}</main>
    </div>
  )
}
