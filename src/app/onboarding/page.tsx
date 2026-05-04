"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Zap, ArrowRight, ArrowLeft, CheckCircle2, Loader2, User, Briefcase, Upload,
  Sparkles, Users, FileText, Mail, Phone, Building, X
} from "lucide-react"

type Step = 1 | 2 | 3 | 4

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [brokerage, setBrokerage] = useState("")
  const [licenseNumber, setLicenseNumber] = useState("")

  // Transaction state
  const [createdTxId, setCreatedTxId] = useState<string | null>(null)

  // Load profile on mount
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.user?.name) setName(d.user.name)
      })
      .catch(() => {})
  }, [])

  const next = () => setStep((s) => (Math.min(4, s + 1) as Step))
  const prev = () => setStep((s) => (Math.max(1, s - 1) as Step))

  const saveProfile = async () => {
    setSubmitting(true)
    try {
      // settings update endpoint not built; skip — name is already set at register.
      next()
    } finally {
      setSubmitting(false)
    }
  }

  const startWithSample = async () => {
    setSubmitting(true)
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyAddress: "252 Shelton St, Bridgeport, CT 06608",
          buyerName: "Ayisha Wint",
          sellerName: "Ruth Cogdell",
          purchasePrice: 300000,
          effectiveDate: new Date().toISOString().split("T")[0],
          closingDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        }),
      })
      if (!res.ok) throw new Error("Failed to create sample")
      const tx = await res.json()
      setCreatedTxId(tx.id)
      next()
    } catch (err) {
      alert("Couldn't create sample deal. Try again.")
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const finish = () => router.push(createdTxId ? `/transactions/${createdTxId}` : "/dashboard")
  const skip = () => router.push("/dashboard")

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/30 via-white to-white">
      {/* Top bar */}
      <header className="border-b bg-white/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="container max-w-3xl flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary text-primary-foreground">
              <Zap className="h-4 w-4" />
            </div>
            <span className="font-bold text-base tracking-tight">ClosePilot</span>
          </div>
          <button onClick={skip} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            Skip for now <X className="h-3 w-3" />
          </button>
        </div>
      </header>

      <main className="container max-w-2xl py-10 md:py-16">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all ${
                s === step ? "w-10 bg-primary" : s < step ? "w-6 bg-primary/60" : "w-6 bg-gray-200"
              }`}
            />
          ))}
        </div>

        {step === 1 && (
          <StepContainer
            badge="Welcome"
            title={`Hey${name ? ` ${name.split(" ")[0]}` : ""} 👋  Let's get you set up.`}
            subtitle="Three quick steps. About 90 seconds. Then you'll have your first deal on autopilot."
            primaryCta={{ label: "Let's go", onClick: next }}
          >
            <div className="grid sm:grid-cols-3 gap-3 my-4">
              {[
                { icon: User, t: "Tell us who you are", d: "Name, brokerage, license #" },
                { icon: FileText, t: "Set up your first deal", d: "Sample or your own contract" },
                { icon: Users, t: "Invite the team", d: "Buyer, lender, etc." },
              ].map((s, i) => (
                <div key={i} className="rounded-xl border bg-white p-4">
                  <div className="text-[10px] font-bold text-primary mb-2">STEP {i + 1}</div>
                  <s.icon className="h-4 w-4 text-foreground/70 mb-2" />
                  <p className="text-sm font-medium mb-0.5">{s.t}</p>
                  <p className="text-xs text-muted-foreground">{s.d}</p>
                </div>
              ))}
            </div>
          </StepContainer>
        )}

        {step === 2 && (
          <StepContainer
            badge="Step 1 of 3"
            title="Tell us about you"
            subtitle="Helps personalize your portal — and the emails parties get from you."
            primaryCta={{ label: "Continue", onClick: saveProfile, loading: submitting }}
            secondaryCta={{ label: "Back", onClick: prev }}
          >
            <div className="space-y-4 my-4">
              <Field label="Your name" icon={User}>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md border px-3 h-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Jane Smith"
                />
              </Field>
              <Field label="Phone (optional)" icon={Phone}>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-md border px-3 h-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="(555) 123-4567"
                />
              </Field>
              <Field label="Brokerage" icon={Building}>
                <input
                  type="text"
                  value={brokerage}
                  onChange={(e) => setBrokerage(e.target.value)}
                  className="w-full rounded-md border px-3 h-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Premier Realty Group"
                />
              </Field>
              <Field label="CT license # (optional)" icon={Briefcase}>
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  className="w-full rounded-md border px-3 h-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="REB.0001234"
                />
              </Field>
            </div>
          </StepContainer>
        )}

        {step === 3 && (
          <StepContainer
            badge="Step 2 of 3"
            title="Set up your first deal"
            subtitle="Pick the fastest path. You can do both later — this just gets you to the magic."
            secondaryCta={{ label: "Back", onClick: prev }}
          >
            <div className="grid sm:grid-cols-2 gap-3 my-4">
              <button
                type="button"
                onClick={startWithSample}
                disabled={submitting}
                className="rounded-xl border-2 border-primary bg-gradient-to-br from-blue-50/60 to-indigo-50/60 p-5 text-left hover:shadow-lg hover:border-primary/80 transition-all disabled:opacity-60 group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-bold text-primary bg-white px-2 py-0.5 rounded-full">RECOMMENDED</span>
                </div>
                <p className="text-sm font-semibold mb-1">Try with a sample CT deal</p>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                  Pre-filled $300K Bridgeport contract. Full timeline, parties, everything. See how it feels in 10 seconds.
                </p>
                <span className="text-xs font-medium text-primary inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                  {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowRight className="h-3 w-3" />}
                  {submitting ? "Creating..." : "Start with sample"}
                </span>
              </button>

              <Link
                href="/transactions/new"
                className="rounded-xl border bg-white p-5 hover:shadow-md hover:border-foreground/20 transition-all group block"
              >
                <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-foreground/[0.04] mb-2">
                  <Upload className="h-4 w-4 text-foreground/70" />
                </div>
                <p className="text-sm font-semibold mb-1">Upload your contract</p>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                  Drop your executed PDF. We'll extract every date, party, and contingency in seconds.
                </p>
                <span className="text-xs font-medium text-foreground/70 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                  <ArrowRight className="h-3 w-3" /> Upload mine
                </span>
              </Link>
            </div>
          </StepContainer>
        )}

        {step === 4 && (
          <StepContainer
            badge="Step 3 of 3"
            title="🎉 You're set up — here's what's next"
            subtitle="Your sample deal is live with a 13-step timeline. Now invite your buyer or a vendor to feel the magic."
            primaryCta={{ label: createdTxId ? "Open my first deal" : "Go to dashboard", onClick: finish }}
          >
            <div className="space-y-3 my-4">
              {[
                { icon: Users, t: "Invite a buyer or seller", d: "They get a portal with plain-English explanations of every milestone — and they'll thank you." },
                { icon: Building, t: "Invite a vendor (lender, inspector, attorney)", d: "Vendors get a magic link with their tasks pre-loaded. Drag-and-drop deliverables." },
                { icon: FileText, t: "Run AI clause review", d: "Spot risks (tight deadlines, financing gaps, missing contingencies) before you go firm." },
              ].map((item, i) => (
                <div key={i} className="rounded-xl border bg-white p-4 flex gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/[0.08] flex items-center justify-center shrink-0">
                    <item.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">{item.t}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </StepContainer>
        )}
      </main>
    </div>
  )
}

function StepContainer({
  badge, title, subtitle, primaryCta, secondaryCta, children,
}: {
  badge?: string
  title: string
  subtitle?: string
  primaryCta?: { label: string; onClick: () => void; loading?: boolean }
  secondaryCta?: { label: string; onClick: () => void }
  children?: React.ReactNode
}) {
  return (
    <div className="rounded-2xl bg-white border shadow-sm p-6 md:p-8">
      {badge && (
        <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-2">{badge}</p>
      )}
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2 text-balance">{title}</h1>
      {subtitle && <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{subtitle}</p>}
      {children}
      <div className="flex items-center justify-between gap-3 mt-6">
        {secondaryCta ? (
          <Button type="button" variant="ghost" onClick={secondaryCta.onClick} className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" /> {secondaryCta.label}
          </Button>
        ) : <span />}
        {primaryCta && (
          <Button type="button" onClick={primaryCta.onClick} disabled={primaryCta.loading} className="gap-1.5 ml-auto">
            {primaryCta.loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {primaryCta.label} {!primaryCta.loading && <ArrowRight className="h-3.5 w-3.5" />}
          </Button>
        )}
      </div>
    </div>
  )
}

function Field({ label, icon: Icon, children }: { label: string; icon: typeof User; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-foreground/70 mb-1.5 flex items-center gap-1.5">
        <Icon className="h-3 w-3" /> {label}
      </label>
      {children}
    </div>
  )
}
