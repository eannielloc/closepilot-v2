import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Zap, Clock, Shield, DollarSign, ArrowRight, CheckCircle, Star,
  Upload, Calendar, Bell, FileText, Users, ChevronDown, ChevronRight,
  Sparkles, Timer, TrendingDown, Award
} from "lucide-react"

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
        <Zap className="h-4.5 w-4.5" />
      </div>
      <span className="font-bold text-lg tracking-tight">ClosePilot</span>
    </div>
  )
}

function ComparisonRow({ label, closepilot, human }: { label: string; closepilot: string; human: string }) {
  return (
    <div className="grid grid-cols-3 gap-4 py-3 border-b border-border/50 last:border-0 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-center font-medium text-green-700">{closepilot}</span>
      <span className="text-center text-muted-foreground">{human}</span>
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b border-border/40 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <Logo />
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="gap-1.5">
                Get Started Free <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Grid background */}
        <div className="absolute inset-0 bg-grid mask-radial opacity-40" />
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-100 rounded-full blur-[120px] opacity-40 -translate-y-1/2" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-100 rounded-full blur-[100px] opacity-30 translate-y-1/2" />

        <div className="container relative py-24 md:py-36 lg:py-44">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/[0.08] text-primary text-sm font-medium mb-8 border border-primary/10">
              <Sparkles className="h-3.5 w-3.5" />
              The first AI transaction coordinator for real estate
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-balance mb-6 leading-[1.08]">
              Close deals faster.
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent animate-gradient">
                Pay 75% less.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed text-balance">
              Upload your purchase agreement. ClosePilot extracts every date, party, and deadline — then manages the entire transaction for{" "}
              <span className="font-semibold text-foreground">$99</span> instead of{" "}
              <span className="line-through">$400</span>.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/transactions/new">
                <Button size="lg" className="h-12 px-8 text-base gap-2 shadow-lg shadow-primary/25">
                  Upload Your First Contract <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                  See Live Demo
                </Button>
              </Link>
            </div>

            {/* Social proof line */}
            <div className="flex items-center justify-center gap-6 mt-10 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>60-second setup</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>CT SmartMLS forms supported</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logos / trust strip */}
      <section className="border-y bg-muted/30 py-8">
        <div className="container">
          <p className="text-center text-xs font-medium text-muted-foreground uppercase tracking-widest mb-5">
            Built for agents who work with
          </p>
          <div className="flex items-center justify-center gap-10 md:gap-16 text-muted-foreground/60 flex-wrap">
            {["SmartMLS", "CT Standard Forms", "Dotloop", "DocuSign", "SkySlope"].map((name) => (
              <span key={name} className="text-sm font-semibold tracking-wide">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 md:py-32">
        <div className="container max-w-5xl">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">How it works</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">From PDF to autopilot in 60 seconds</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Three steps. No onboarding calls. No data entry. Just upload and go.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {[
              {
                step: "01",
                icon: Upload,
                title: "Upload your contract",
                desc: "Drop your executed purchase agreement PDF. Our AI reads every clause, date, party, and contingency from CT SmartMLS Standard Forms.",
              },
              {
                step: "02",
                icon: Calendar,
                title: "Review the timeline",
                desc: "Instantly see a visual timeline with every milestone — deposit, inspection, attorney review, appraisal, mortgage commitment, closing.",
              },
              {
                step: "03",
                icon: Bell,
                title: "Put it on autopilot",
                desc: "Automated 7-day, 3-day, 1-day, and same-day reminders go to every party. You focus on selling — we handle follow-ups.",
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <span className="text-6xl font-bold text-muted/80 absolute -top-2 -left-2 select-none">{item.step}</span>
                <div className="relative pt-12">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/[0.08] mb-4">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section id="features" className="py-24 md:py-32 bg-muted/30">
        <div className="container max-w-5xl">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Features</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Everything a TC does. None of the cost.</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">ClosePilot handles the tedious coordination work so you can focus on what matters — your clients.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: FileText, title: "AI Contract Parsing", desc: "Extracts dates, parties, contingencies, and financial terms from CT SmartMLS PDFs in seconds." },
              { icon: Calendar, title: "Visual Timeline", desc: "See every milestone at a glance. Color-coded urgency. Click to mark complete or waive." },
              { icon: Bell, title: "Automated Reminders", desc: "7-day, 3-day, 1-day, and day-of alerts to buyers, sellers, attorneys, lenders — everyone." },
              { icon: Users, title: "Party Coordination", desc: "All contacts in one place. Every party gets the right reminder at the right time." },
              { icon: Shield, title: "Never Miss a Deadline", desc: "Real-time dashboard shows what's due today, this week, and what's overdue across all deals." },
              { icon: Timer, title: "60-Second Setup", desc: "Upload PDF → AI parses → timeline generated. No manual data entry. No onboarding calls." },
            ].map((feature) => (
              <div key={feature.title} className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/[0.08] mb-4">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 md:py-32">
        <div className="container max-w-5xl">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Pricing</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Simple, transparent pricing</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Pay per transaction. No subscriptions. No hidden fees.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* ClosePilot */}
            <div className="relative rounded-2xl border-2 border-primary bg-white p-8 shadow-lg shadow-primary/10">
              <div className="absolute -top-3.5 left-6">
                <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Recommended</span>
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-1">ClosePilot AI</h3>
                <p className="text-sm text-muted-foreground">Full AI transaction coordination</p>
              </div>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-5xl font-bold">$99</span>
                <span className="text-muted-foreground">/transaction</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "AI contract parsing (CT SmartMLS forms)",
                  "Complete timeline generation",
                  "Automated deadline reminders",
                  "Party coordination & alerts",
                  "Document tracking",
                  "Dashboard with all active deals",
                  "Email & SMS notifications",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/transactions/new" className="block">
                <Button className="w-full h-11 gap-2">
                  Start Free Trial <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <p className="text-xs text-center text-muted-foreground mt-3">First transaction free. No credit card required.</p>
            </div>

            {/* Human TC */}
            <div className="rounded-2xl border bg-muted/30 p-8">
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-1">Human TC</h3>
                <p className="text-sm text-muted-foreground">Traditional transaction coordinator</p>
              </div>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-5xl font-bold text-muted-foreground">$350–500</span>
                <span className="text-muted-foreground">/transaction</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "Manual contract review",
                  "Timeline created by hand",
                  "Email/call reminders (business hours)",
                  "Party coordination",
                  "Document management",
                  "Limited to working hours",
                  "Varies by individual quality",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-muted-foreground/50 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full h-11" disabled>
                The old way
              </Button>
            </div>
          </div>

          {/* Savings callout */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-3 bg-green-50 border border-green-200 rounded-full px-6 py-3">
              <TrendingDown className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Save $251–401 per deal · That&apos;s <span className="font-bold">$2,500–4,000</span> on 10 transactions
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 md:py-32 bg-muted/30">
        <div className="container max-w-5xl">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Testimonials</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Trusted by agents across Connecticut</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Maria Santiago",
                title: "Keller Williams Stamford",
                quote: "I saved $3,200 across my last 8 transactions. The AI parsed my CT Standard Form perfectly — every date, every contingency. It's like having a TC who never sleeps.",
                avatar: "MS",
              },
              {
                name: "David Park",
                title: "Solo Agent, New Haven",
                quote: "As a first-year agent, I couldn't afford $400/deal for a TC. ClosePilot gives me the structure and accountability I need at a price that actually makes sense.",
                avatar: "DP",
              },
              {
                name: "Rachel Goldstein",
                title: "Team Lead, Fairfield County",
                quote: "My team of 4 switched from a human TC. We process 30+ transactions a year — the savings are massive. Haven't missed a single deadline in 3 months.",
                avatar: "RG",
              },
            ].map((t) => (
              <div key={t.name} className="bg-white rounded-xl border p-6 flex flex-col">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed flex-1 mb-5">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3 pt-4 border-t">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Built by an agent */}
      <section className="py-24 md:py-32">
        <div className="container max-w-3xl text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/[0.08] mb-6">
            <Award className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Built by a licensed agent who lived the pain</h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-6 max-w-2xl mx-auto">
            ClosePilot wasn't built in a Silicon Valley lab. It was built by an active real estate agent who got tired of paying $400+ per deal for transaction coordinators — or spending hours doing it all manually.
          </p>
          <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Every feature is designed around the workflows agents actually use. No bloat. No enterprise upsells. Just the TC replacement you need.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 md:py-32 bg-muted/30">
        <div className="container max-w-3xl">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">FAQ</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Frequently asked questions</h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "What contract forms does ClosePilot support?",
                a: "Currently, ClosePilot is optimized for CT SmartMLS Standard Form purchase agreements. We're expanding to other states and form types soon.",
              },
              {
                q: "How does the AI parsing work?",
                a: "You upload your executed purchase agreement PDF. Our AI (powered by Claude) reads the entire document and extracts all key dates, parties, financial terms, and contingencies — typically in under 60 seconds.",
              },
              {
                q: "Does ClosePilot replace a transaction coordinator?",
                a: "For most deals, yes. ClosePilot handles the core TC functions: timeline management, deadline tracking, automated reminders to all parties, and document organization. For complex commercial deals or unusual situations, you might still want a human TC.",
              },
              {
                q: "What about Dotloop, SkySlope, or ListedKit?",
                a: "Those are document management platforms, not TC replacements. Dotloop and SkySlope help you store and sign documents. ListedKit's 'Ava' reads contracts ($9.99/read) but doesn't manage the transaction. ClosePilot is the only full AI TC at $99/deal.",
              },
              {
                q: "Is my data secure?",
                a: "Yes. Contract data is encrypted in transit and at rest. We don't share your data with other agents or third parties. Your deals are your deals.",
              },
              {
                q: "What if the AI gets a date wrong?",
                a: "After parsing, you review and confirm the extracted timeline before activating reminders. You're always in control. We show you exactly what we found so you can correct anything before it goes live.",
              },
              {
                q: "Can I try it free?",
                a: "Yes — your first transaction is completely free. No credit card required. Upload a contract and see the full experience.",
              },
            ].map((faq) => (
              <details key={faq.q} className="group bg-white rounded-xl border p-0 overflow-hidden">
                <summary className="flex items-center justify-between cursor-pointer p-5 text-sm font-medium hover:bg-muted/30 transition-colors list-none [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 ml-4 transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-indigo-500/[0.03]" />
        <div className="container relative text-center max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-balance">
            Stop overpaying for transaction coordination
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
            Your first transaction is free. Upload a contract and see why agents are switching to ClosePilot.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/transactions/new">
              <Button size="lg" className="h-12 px-8 text-base gap-2 shadow-lg shadow-primary/25">
                Upload Your First Contract <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/20 py-12">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <Logo />
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                AI-powered transaction coordination for real estate agents.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a></li>
                <li><Link href="/dashboard" className="hover:text-foreground transition-colors">Demo</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#faq" className="hover:text-foreground transition-colors">FAQ</a></li>
                <li><a href="mailto:chris@closepilot.ai" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© 2026 ClosePilot. Built by agents, for agents.</p>
            <p>Made in Connecticut 🏡</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
