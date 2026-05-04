import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Zap, ArrowRight, CheckCircle, Sparkles, Users, Building, Eye, Home,
  Upload, MessageSquare, Calendar, FileText, Shield, Bell,
  Star, Clock, ChevronDown, Briefcase
} from "lucide-react"

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground shadow-sm shadow-primary/30">
        <Zap className="h-4 w-4" />
      </div>
      <span className="font-bold text-lg tracking-tight">ClosePilot</span>
    </Link>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b border-border/40 bg-white/85 backdrop-blur-xl sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14 md:h-16">
          <Logo />
          <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#for-everyone" className="hover:text-foreground transition-colors">Who it's for</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="gap-1.5">
                Start free <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid mask-radial opacity-30 pointer-events-none" />
        <div className="absolute top-0 left-1/3 w-[640px] h-[640px] bg-blue-100 rounded-full blur-[140px] opacity-50 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[420px] h-[420px] bg-indigo-100 rounded-full blur-[110px] opacity-40 translate-y-1/2 pointer-events-none" />

        <div className="container relative pt-16 pb-10 md:pt-24 md:pb-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/[0.08] text-primary text-xs md:text-sm font-medium mb-6 border border-primary/15">
              <Sparkles className="h-3.5 w-3.5" />
              Built by an agent, for the entire deal team
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance mb-5 leading-[1.05]">
              The shared workspace for{" "}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent">
                every real estate deal.
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed text-balance">
              Your buyer, seller, lender, inspector, and attorney — all in one link, all on the same page, from contract to close. The agent's tool everyone else <em>actually wants to use too</em>.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-7">
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto h-12 px-7 text-base gap-2 shadow-lg shadow-primary/25">
                  Start 30-day free trial <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/demo" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-7 text-base">
                  See live sample deal
                </Button>
              </Link>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground flex items-center justify-center gap-1.5 flex-wrap">
              <CheckCircle className="h-3.5 w-3.5 text-green-500" /> No credit card required
              <span className="mx-1.5">·</span>
              <CheckCircle className="h-3.5 w-3.5 text-green-500" /> $29/mo unlimited deals
              <span className="mx-1.5">·</span>
              <CheckCircle className="h-3.5 w-3.5 text-green-500" /> Cancel anytime
            </p>
          </div>

          {/* Hero product preview */}
          <div className="mt-12 md:mt-16 max-w-5xl mx-auto">
            <div className="rounded-2xl border bg-white shadow-2xl shadow-blue-900/10 overflow-hidden">
              <div className="bg-gray-50 border-b px-4 py-2.5 flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
                </div>
                <div className="flex-1 text-center text-xs text-gray-400 font-mono">closepilot.app/transactions/tx_a3b7</div>
              </div>
              <div className="p-5 md:p-7 space-y-4 bg-gradient-to-br from-white to-gray-50/50">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-gray-500 mb-1">Active Transaction</div>
                    <div className="text-lg md:text-xl font-bold">252 Shelton St, Bridgeport, CT</div>
                    <div className="text-xs text-gray-500 mt-0.5">Ayisha Wint → Ruth Cogdell · $300,000 · Closes Mar 13</div>
                  </div>
                  <div className="flex gap-1.5">
                    <span className="text-[10px] px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 font-medium">5 of 13 milestones</span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Mock timeline */}
                  <div className="rounded-xl border bg-white p-4 space-y-2">
                    <div className="text-xs font-semibold text-gray-700 mb-2">Timeline</div>
                    {[
                      { name: "Initial deposit ($3,000)", date: "Jan 22", done: true },
                      { name: "Attorney review", date: "Jan 29", done: true },
                      { name: "Inspection", date: "Feb 02", done: true },
                      { name: "Mortgage commitment", date: "Feb 27", done: false, hot: true },
                      { name: "Closing", date: "Mar 13", done: false },
                    ].map((m, i) => (
                      <div key={i} className="flex items-center gap-2.5 text-xs">
                        <div className={`w-3.5 h-3.5 rounded-full shrink-0 flex items-center justify-center ${m.done ? "bg-green-500" : m.hot ? "bg-amber-100 border-2 border-amber-400" : "bg-gray-100 border-2 border-gray-200"}`}>
                          {m.done && <CheckCircle className="h-2 w-2 text-white" />}
                        </div>
                        <span className={`flex-1 ${m.done ? "text-gray-400 line-through" : m.hot ? "text-amber-700 font-medium" : "text-gray-700"}`}>{m.name}</span>
                        <span className={`${m.hot ? "text-amber-600" : "text-gray-400"} font-mono`}>{m.date}</span>
                      </div>
                    ))}
                  </div>
                  {/* Mock parties */}
                  <div className="rounded-xl border bg-white p-4">
                    <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center justify-between">
                      <span>Parties on this deal</span>
                      <span className="text-[10px] text-gray-400">5 invited · 3 viewed</span>
                    </div>
                    <div className="space-y-1.5">
                      {[
                        { initials: "AW", name: "Ayisha Wint", role: "Buyer", color: "bg-blue-500", viewed: true },
                        { initials: "RC", name: "Ruth Cogdell", role: "Seller", color: "bg-violet-500", viewed: true },
                        { initials: "SC", name: "Sarah Chen", role: "Lender · Webster", color: "bg-amber-500", viewed: true },
                        { initials: "JT", name: "Jim Tanaka", role: "Inspector", color: "bg-teal-500", viewed: false },
                        { initials: "VK", name: "Valerie King", role: "Listing Agent", color: "bg-orange-500", viewed: false },
                      ].map((p, i) => (
                        <div key={i} className="flex items-center gap-2.5 text-xs">
                          <div className={`w-6 h-6 rounded-full ${p.color} flex items-center justify-center shrink-0`}>
                            <span className="text-[9px] font-bold text-white">{p.initials}</span>
                          </div>
                          <span className="font-medium text-gray-800">{p.name}</span>
                          <span className="text-gray-500">· {p.role}</span>
                          {p.viewed && <span className="ml-auto text-[10px] text-emerald-600 font-medium">viewed</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust strip */}
          <div className="mt-12 text-center">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4 font-semibold">Built for CT real estate · works with</p>
            <div className="flex items-center justify-center gap-6 md:gap-12 text-muted-foreground/60 flex-wrap">
              {["SmartMLS", "CT Standard Forms", "Dotloop", "DocuSign", "SkySlope"].map((n) => (
                <span key={n} className="text-sm font-semibold tracking-wide">{n}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Problem -> Solution */}
      <section className="py-20 md:py-28 border-y bg-gradient-to-b from-white via-gray-50/50 to-white">
        <div className="container max-w-5xl">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            <div>
              <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-3">The way it works now</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-5 text-balance">
                47 emails per close. Six tools. Nothing in sync.
              </h2>
              <ul className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                {[
                  "Buyer asks 'what's next?' — you write the same email for the 8th time",
                  "Inspector sends report to Gmail. Lender's commitment is in Dotloop. Title is in some PDF.",
                  "Closing date moves. You manually update 5 calendars and 3 group threads.",
                  "Brokerage TC charges $400 per deal. The good ones are booked out.",
                  "You ate your weekend chasing signatures and answering 'is this normal?' calls.",
                ].map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <span className="text-red-500 mt-0.5">×</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-3">With ClosePilot</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-5 text-balance">
                One link. Everyone in sync. You stop being the inbox.
              </h2>
              <ul className="space-y-3 text-sm leading-relaxed">
                {[
                  "Upload contract → 13 deadlines extracted → portal generated for every party",
                  "Buyer sees plain-English explanations of every milestone with action items",
                  "Lender uploads commitment to their portal — task auto-completes, you're notified",
                  "Closing moves? Update once, every party's portal + calendar updates automatically",
                  "Reclaim 6+ hours per deal. Close more, breathe more.",
                ].map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 md:py-28">
        <div className="container max-w-5xl">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">How it works</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-balance">From PDF to autopilot in 90 seconds</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">No onboarding calls. No data entry. No "AI training period." Upload, invite, breathe.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                step: "01",
                icon: Upload,
                title: "Upload your contract",
                desc: "Drop the executed purchase agreement. We extract every date, party, contingency, and financial term in seconds.",
                tint: "from-blue-500/10 to-blue-500/5",
                iconColor: "text-blue-600",
              },
              {
                step: "02",
                icon: Users,
                title: "Invite the team",
                desc: "Buyer, seller, lender, inspector, attorney — each gets a unique portal link. No accounts. No friction.",
                tint: "from-violet-500/10 to-violet-500/5",
                iconColor: "text-violet-600",
              },
              {
                step: "03",
                icon: Bell,
                title: "Stay on autopilot",
                desc: "Auto-reminders fire on every deadline. Vendors upload deliverables. You ride along instead of running.",
                tint: "from-emerald-500/10 to-emerald-500/5",
                iconColor: "text-emerald-600",
              },
            ].map((s) => (
              <div key={s.step} className={`relative rounded-2xl border bg-gradient-to-br ${s.tint} p-6 md:p-7`}>
                <span className="absolute top-4 right-5 text-4xl font-black text-foreground/[0.06] select-none">{s.step}</span>
                <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl bg-white shadow-sm border mb-4`}>
                  <s.icon className={`h-5 w-5 ${s.iconColor}`} />
                </div>
                <h3 className="text-base md:text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Multi-audience */}
      <section id="for-everyone" className="py-20 md:py-28 bg-gradient-to-b from-white to-gray-50/40 border-y">
        <div className="container max-w-6xl">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Built for the entire deal team</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-balance">
              Everyone gets a portal that <em>actually fits how they work</em>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Not a generic dashboard. Each role sees their tasks, their deadlines, and their context — nothing else to wade through.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {[
              {
                icon: Users,
                bg: "bg-blue-50",
                tone: "text-blue-700",
                role: "Real Estate Agents",
                pitch: "Stop being the deal's inbox. AI builds the timeline, sends the reminders, and gives every party a portal — so you can focus on the next listing.",
                bullets: [
                  "AI clause review flags risks before going firm",
                  "Auto-generated CT timelines (deposit, attorney review, mortgage commitment, closing)",
                  "One-click invites for every vendor and client",
                  "See when buyers/sellers actually open their portal",
                ],
              },
              {
                icon: Building,
                bg: "bg-amber-50",
                tone: "text-amber-700",
                role: "Lenders, Title, Attorney",
                pitch: "Get a magic link, no account needed. Your tasks pre-loaded. Drop your commitment letter and the agent's notified instantly.",
                bullets: [
                  "Pre-populated task list (e.g., 'upload commitment letter')",
                  "Drag-and-drop deliverables auto-link to the task",
                  "All deadlines on one page + add to your calendar",
                  "Direct message thread with the agent",
                ],
              },
              {
                icon: Eye,
                bg: "bg-teal-50",
                tone: "text-teal-700",
                role: "Inspectors & Appraisers",
                pitch: "Skip the email chasing. The agent invites you, you upload the report, the task auto-completes, the agent's notified. Done.",
                bullets: [
                  "See deal context: address, parties, contingency dates",
                  "Upload report once, everyone sees it instantly",
                  "Calendar export so the inspection date is on your phone",
                  "Mobile-friendly — fill out from the field",
                ],
              },
              {
                icon: Home,
                bg: "bg-violet-50",
                tone: "text-violet-700",
                role: "Buyers & Sellers",
                pitch: "See your deal at a glance with plain-English explanations. Know exactly what's next, what to do, and who to ask.",
                bullets: [
                  "'What this is + what you should do' on every deadline",
                  "Action items: wire deposit, schedule inspection, etc.",
                  "Message your agent without endless email threads",
                  "Real-time progress bar from contract to closing",
                ],
              },
            ].map((p) => (
              <div key={p.role} className="rounded-2xl border bg-white p-5 md:p-6 hover:shadow-md transition-shadow flex flex-col">
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${p.bg} mb-3`}>
                  <p.icon className={`h-4.5 w-4.5 ${p.tone}`} />
                </div>
                <h3 className="font-semibold text-base mb-2 leading-tight">{p.role}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3 flex-1">{p.pitch}</p>
                <ul className="space-y-1.5">
                  {p.bullets.map((b) => (
                    <li key={b} className="text-xs text-muted-foreground flex gap-1.5">
                      <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link href="/demo">
              <Button size="lg" variant="outline" className="gap-2 h-11">
                See a live sample deal <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground mt-3">No signup. Real CT contract. Try every role.</p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 md:py-28">
        <div className="container max-w-3xl">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Pricing</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3 text-balance">
              One simple plan. No per-deal fees.
            </h2>
            <p className="text-muted-foreground">Built so you stop counting transactions and start focusing on closes.</p>
          </div>

          <div className="rounded-2xl border-2 border-primary bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/50 p-8 md:p-10 relative shadow-lg shadow-primary/10">
            <div className="absolute -top-3.5 left-8">
              <span className="bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">All inclusive</span>
            </div>
            <div className="grid md:grid-cols-2 gap-8 md:gap-10 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-1">ClosePilot Pro</h3>
                <p className="text-sm text-muted-foreground mb-5">Everything. No tiers. No surprise fees.</p>
                <div className="flex items-baseline gap-1.5 mb-6">
                  <span className="text-5xl font-bold tracking-tight">$29</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <Link href="/register" className="block">
                  <Button className="w-full h-12 gap-2 text-base shadow-md shadow-primary/20">
                    Start 30-day free trial <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <p className="text-xs text-center text-muted-foreground mt-3">No credit card required · Cancel anytime · Cancel at the click of a button</p>
              </div>
              <ul className="space-y-3">
                {[
                  "Unlimited transactions",
                  "AI contract parsing (CT SmartMLS forms)",
                  "Buyer / seller / vendor portals (unlimited invites)",
                  "Auto-generated timelines + reminders",
                  "AI clause review (risk flagging)",
                  "Calendar export (Google / Apple / Outlook)",
                  "Email + SMS notifications",
                  "All future updates included",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Brokerage plans (5+ agents) — <a href="mailto:hello@closepilot.ai" className="text-primary hover:underline">contact us</a>
          </p>
        </div>
      </section>

      {/* Social proof / testimonial placeholder */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-gray-50/40 to-white border-y">
        <div className="container max-w-3xl text-center">
          <Star className="h-6 w-6 text-amber-400 inline-block mb-4" fill="currentColor" />
          <Star className="h-6 w-6 text-amber-400 inline-block mb-4" fill="currentColor" />
          <Star className="h-6 w-6 text-amber-400 inline-block mb-4" fill="currentColor" />
          <Star className="h-6 w-6 text-amber-400 inline-block mb-4" fill="currentColor" />
          <Star className="h-6 w-6 text-amber-400 inline-block mb-4" fill="currentColor" />
          <blockquote className="text-xl md:text-2xl font-medium text-balance leading-relaxed mb-5">
            "I stopped writing the same email 8 times per deal. My buyers know what's happening before they ask. My inspector loves it. My weekends are mine again."
          </blockquote>
          <div className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Mary R.</span> · Hartford, CT
            <span className="mx-2">·</span>
            <span>14 transactions on ClosePilot</span>
          </div>
        </div>
      </section>

      {/* Security / trust */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container max-w-5xl">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Built for the trust your clients expect</p>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3 text-balance">
              Real estate data. Real estate-grade security.
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
              Contracts have SSNs, financial details, signatures. We treat them like that — encryption at rest and in transit, no third-party tracking, no AI training on your client data.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Shield, title: "Encrypted at rest", desc: "All documents and database content encrypted. Files served via short-lived signed URLs." },
              { icon: Bell, title: "Audit trail per deal", desc: "Every action logged: who uploaded, viewed, completed, messaged. Useful for broker compliance." },
              { icon: Briefcase, title: "Your data is yours", desc: "Export anytime. Delete anytime. We don't sell, share, or train on it." },
              { icon: Star, title: "Built by an agent", desc: "Designed by someone who's done 100+ closes — not a generic SaaS team. Bug? We hear about it that day." },
            ].map((t) => (
              <div key={t.title} className="rounded-2xl border bg-white p-5 hover:shadow-sm transition-shadow">
                <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-primary/[0.08] mb-3">
                  <t.icon className="h-4.5 w-4.5 text-primary" />
                </div>
                <p className="text-sm font-semibold mb-1.5">{t.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 md:py-28">
        <div className="container max-w-3xl">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">FAQ</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Common questions</h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "Does this replace my brokerage's TC?",
                a: "Most agents use ClosePilot alongside their brokerage's tools. Some replace their independent TC entirely. Your call — try free for 30 days.",
              },
              {
                q: "Which forms do you support?",
                a: "Today: CT SmartMLS Standard Forms (the rev 9.24 the state uses). NY, MA, NJ are on the roadmap. If you want priority on a specific state, email us.",
              },
              {
                q: "Do my clients need an account?",
                a: "No. Buyers, sellers, lenders, inspectors, attorneys — they all open a unique portal link. No password. No download. Works on phones.",
              },
              {
                q: "Is my client data secure?",
                a: "Encrypted in transit and at rest. Sessions use HttpOnly cookies. AI processing only happens on the contract you upload — never sold or used to train third-party models.",
              },
              {
                q: "What if I don't close in 30 days?",
                a: "Trial extends. We don't punish you for slow markets. Talk to us if you need more time and we'll work it out.",
              },
              {
                q: "Can I cancel anytime?",
                a: "Yes — one click in settings. No phone calls, no retention saves. We'd rather build a tool you keep than fight to keep you.",
              },
              {
                q: "Will my data be there if I come back?",
                a: "Always. Cancel and your transactions stay accessible read-only for 90 days. Re-subscribe anytime to pick up where you left off.",
              },
              {
                q: "Who built this?",
                a: "An agent who got tired of being the inbox. We're small, we ship fast, we read every email at hello@closepilot.ai.",
              },
            ].map((item, i) => (
              <details key={i} className="group rounded-xl border bg-white">
                <summary className="cursor-pointer list-none p-4 md:p-5 flex items-center justify-between gap-4">
                  <span className="font-semibold text-sm md:text-base">{item.q}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180 shrink-0" />
                </summary>
                <div className="px-4 md:px-5 pb-4 md:pb-5 text-sm text-muted-foreground leading-relaxed">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white">
        <div className="container max-w-3xl text-center">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4 text-balance">
            Stop being the inbox.<br/>Start closing more deals.
          </h2>
          <p className="text-blue-50 text-base md:text-lg mb-8 max-w-xl mx-auto">
            30 days free. No credit card. If you don't save 5 hours on your first deal, we'll personally help you switch back.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register" className="w-full sm:w-auto">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto h-12 px-7 text-base gap-2">
                Start free trial <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/demo" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-7 text-base bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white">
                Watch the live demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-50/50 py-10">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <Logo />
              <p className="text-sm text-muted-foreground mt-3 max-w-sm leading-relaxed">
                The shared workspace for every real estate deal. Built for CT agents and the people they work with.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">Product</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/demo" className="hover:text-foreground">Demo</Link></li>
                <li><a href="#how-it-works" className="hover:text-foreground">How it works</a></li>
                <li><a href="#pricing" className="hover:text-foreground">Pricing</a></li>
                <li><a href="#faq" className="hover:text-foreground">FAQ</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">Legal</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/terms" className="hover:text-foreground">Terms</Link></li>
                <li><Link href="/privacy" className="hover:text-foreground">Privacy</Link></li>
                <li><a href="mailto:hello@closepilot.ai" className="hover:text-foreground">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-10 pt-6 text-center text-xs text-muted-foreground">
            © 2026 ClosePilot. Built by an agent, for the entire deal team.
          </div>
        </div>
      </footer>
    </div>
  )
}
