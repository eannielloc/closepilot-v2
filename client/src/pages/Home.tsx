import { Link } from 'react-router-dom';
import { FileText, Clock, Users, Zap, ArrowRight, Shield, ChevronDown, Bell, BarChart3, Upload, Star, Check, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { usePageTitle } from '../lib/usePageTitle';

/* ─── Scroll-reveal hook ─── */
function useReveal(delay = 0) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, className: `transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`, style: { transitionDelay: `${delay}ms` } };
}

/* ─── Animated counter ─── */
function Counter({ end, suffix = '', duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);
  const [val, setVal] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setStarted(true); obs.disconnect(); } }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  useEffect(() => {
    if (!started) return;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(eased * end));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [started, end, duration]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

/* ─── FAQ Accordion ─── */
function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/[0.06] last:border-b-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-6 text-left group">
        <span className="font-medium text-[17px] text-white/90 group-hover:text-white transition-colors pr-4">{q}</span>
        <ChevronDown size={18} className={`text-brand-400/50 transition-transform duration-300 shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-40 pb-6' : 'max-h-0'}`}>
        <p className="text-white/45 leading-relaxed">{a}</p>
      </div>
    </div>
  );
}

/* ─── Data ─── */
const features = [
  { icon: <FileText size={22} />, title: 'AI Contract Parsing', desc: 'Extracts dates, parties, contingencies, and financial terms from your purchase agreement PDFs in seconds.' },
  { icon: <BarChart3 size={22} />, title: 'Visual Timeline', desc: 'See every milestone at a glance. Color-coded urgency. Click to mark complete or waive.' },
  { icon: <Bell size={22} />, title: 'Automated Reminders', desc: '7-day, 3-day, 1-day, and day-of alerts to buyers, sellers, attorneys, lenders — everyone stays on track.' },
  { icon: <Users size={22} />, title: 'Party Coordination', desc: 'All contacts in one place. Every party gets the right reminder at the right time. No more chasing.' },
  { icon: <Clock size={22} />, title: 'Never Miss a Deadline', desc: 'Real-time dashboard shows what\'s due today, this week, and what\'s overdue across all your deals.' },
  { icon: <Upload size={22} />, title: '60-Second Setup', desc: 'Upload PDF → AI parses → timeline generated. No manual data entry. No onboarding calls.' },
];

const testimonials = [
  { name: 'Maria S.', role: 'Agent, Keller Williams', quote: 'I saved $3,200 across my last 8 transactions. The AI parsed my contract perfectly — every date, every contingency. It\'s like having a TC who never sleeps.', initials: 'MS' },
  { name: 'David P.', role: 'Solo Agent', quote: 'As a first-year agent, I couldn\'t afford $400/deal for a TC. ClosePilot gives me the structure and accountability I need at a price that actually makes sense.', initials: 'DP' },
  { name: 'Rachel G.', role: 'Team Lead', quote: 'My team of 4 switched from a human TC. We process 30+ transactions a year — the savings are massive. Haven\'t missed a single deadline in 3 months.', initials: 'RG' },
];

const faqs = [
  { q: 'What contract forms does ClosePilot support?', a: 'ClosePilot works with standard real estate purchase agreement PDFs from any state. We\'re continuously expanding support for more form types.' },
  { q: 'How does the AI parsing work?', a: 'Upload your executed purchase agreement PDF. Our AI reads the entire document and extracts all key dates, parties, financial terms, and contingencies — typically in under 60 seconds.' },
  { q: 'Does ClosePilot replace a transaction coordinator?', a: 'For most deals, yes. ClosePilot handles timeline management, deadline tracking, automated reminders to all parties, and document organization — at a fraction of the cost.' },
  { q: 'Is my data secure?', a: 'Absolutely. All data is encrypted at rest and in transit. We never share your information with third parties.' },
  { q: 'Can I try it before paying?', a: 'Yes! Your first transaction is completely free. No credit card required.' },
];

/* ─── Page ─── */
export default function Home() {
  usePageTitle('AI Transaction Coordinator for Real Estate');
  const hero = useReveal();
  const stats = useReveal(200);
  const steps = useReveal();
  const feat = useReveal();
  const price = useReveal();
  const test = useReveal();
  const built = useReveal();
  const faq = useReveal();
  const cta = useReveal();

  return (
    <div className="overflow-hidden bg-[#09090f]">
      {/* ═══════ HERO ═══════ */}
      <section className="relative min-h-[95vh] flex items-center justify-center px-6 pt-20 pb-16">
        {/* Layered background */}
        <div className="absolute inset-0">
          {/* Base gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0c0d16] via-[#09090f] to-[#09090f]" />
          {/* Top glow */}
          <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-brand-500/[0.07] rounded-full blur-[150px]" />
          {/* Side accents */}
          <div className="absolute top-[20%] left-[-100px] w-[400px] h-[400px] bg-[#818cf8]/[0.03] rounded-full blur-[100px]" />
          <div className="absolute bottom-[10%] right-[-100px] w-[400px] h-[400px] bg-accent-400/[0.025] rounded-full blur-[100px]" />
          {/* Grid pattern */}
          <div className="absolute inset-0 grid-pattern opacity-[0.025]" />
        </div>

        <div ref={hero.ref} className={`relative max-w-4xl mx-auto text-center ${hero.className}`}>
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 bg-white/[0.04] text-brand-400 px-5 py-2.5 rounded-full text-sm font-medium mb-10 border border-white/[0.06] backdrop-blur-sm">
            <Sparkles size={14} className="text-brand-400" />
            <span>AI-powered transaction coordination</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-[72px] font-bold mb-8 leading-[1.05] tracking-[-0.02em]">
            Close deals faster.
            <br />
            <span className="hero-text-gradient">Pay 75% less.</span>
          </h1>

          {/* Subhead */}
          <p className="text-lg sm:text-xl text-white/45 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
            Upload your purchase agreement. ClosePilot extracts every date, party, and deadline — then manages the entire transaction for{' '}
            <span className="text-white font-medium">$99 instead of $400</span>.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="group relative inline-flex items-center justify-center gap-2 text-lg px-10 py-4 rounded-xl font-semibold text-white overflow-hidden transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 shadow-2xl shadow-brand-500/20">
              {/* Button gradient bg */}
              <div className="absolute inset-0 bg-gradient-to-r from-brand-500 to-brand-400 transition-opacity" />
              <div className="absolute inset-0 bg-gradient-to-r from-brand-400 to-[#818cf8] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative">Start Free Trial</span>
              <ArrowRight size={18} className="relative group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <a href="#how-it-works" className="px-10 py-4 text-lg font-medium rounded-xl flex items-center justify-center gap-2 border border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.03] transition-all duration-300 text-white/60 hover:text-white/80">
              See How It Works
            </a>
          </div>

          <p className="text-white/20 text-sm mt-8 tracking-wide">No credit card required · First transaction free</p>
        </div>
      </section>

      {/* ═══════ SOCIAL PROOF STATS ═══════ */}
      <section className="relative py-16 px-6 border-y border-white/[0.04]">
        <div className="absolute inset-0 bg-white/[0.01]" />
        <div ref={stats.ref} className={`relative max-w-5xl mx-auto ${stats.className}`} style={stats.style}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {[
              { value: 75, suffix: '%', label: 'Cost savings vs human TC' },
              { value: 60, suffix: 's', label: 'Average setup time' },
              { value: 99, suffix: '%', label: 'Deadline accuracy' },
              { value: 24, suffix: '/7', label: 'Automated monitoring' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">
                  <span className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                    <Counter end={s.value} />{s.suffix}
                  </span>
                </div>
                <p className="text-white/30 text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section id="how-it-works" className="py-32 px-6 relative">
        <div ref={steps.ref} className={`relative max-w-5xl mx-auto ${steps.className}`}>
          <div className="text-center mb-20">
            <SectionLabel>How It Works</SectionLabel>
            <h2 className="text-4xl md:text-5xl font-bold mb-5 tracking-tight">From PDF to autopilot in 60 seconds</h2>
            <p className="text-white/35 text-lg max-w-lg mx-auto font-light">Three steps. No onboarding calls. No data entry.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-[52px] left-[18%] right-[18%] h-px">
              <div className="w-full h-full bg-gradient-to-r from-brand-500/0 via-brand-500/20 to-brand-500/0" />
            </div>

            {[
              { step: '01', title: 'Upload your contract', desc: 'Drop your executed purchase agreement PDF. Our AI reads every clause, date, party, and contingency automatically.' },
              { step: '02', title: 'Review the timeline', desc: 'Instantly see a visual timeline with every milestone — deposit, inspection, attorney review, appraisal, closing.' },
              { step: '03', title: 'Put it on autopilot', desc: 'Automated reminders go to every party at the right time. You focus on selling — we handle the follow-ups.' },
            ].map((s, i) => (
              <div key={i} className="relative text-center group">
                {/* Step circle */}
                <div className="relative mx-auto w-[72px] h-[72px] mb-8">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-b from-brand-500/15 to-brand-500/5 border border-brand-400/20" />
                  <div className="absolute inset-[3px] rounded-full bg-[#0e0f18]" />
                  <div className="relative w-full h-full flex items-center justify-center">
                    <span className="text-brand-400 text-2xl font-bold tracking-tight">{s.step}</span>
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white/95">{s.title}</h3>
                <p className="text-white/35 leading-relaxed max-w-[280px] mx-auto font-light">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ═══════ FEATURES ═══════ */}
      <section id="features" className="py-32 px-6">
        <div ref={feat.ref} className={`max-w-6xl mx-auto ${feat.className}`}>
          <div className="text-center mb-20">
            <SectionLabel>Features</SectionLabel>
            <h2 className="text-4xl md:text-5xl font-bold mb-5 tracking-tight">Everything a TC does. None of the cost.</h2>
            <p className="text-white/35 text-lg max-w-xl mx-auto font-light">ClosePilot handles the tedious coordination work so you can focus on what matters — your clients.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <div key={i} className="group p-7 rounded-2xl border border-white/[0.05] hover:border-white/[0.1] bg-white/[0.015] hover:bg-white/[0.03] transition-all duration-300" style={{ transitionDelay: `${i * 50}ms` }}>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500/15 to-brand-500/5 flex items-center justify-center text-brand-400 mb-5 border border-brand-400/10 group-hover:border-brand-400/20 transition-colors duration-300">
                  {f.icon}
                </div>
                <h3 className="text-[17px] font-semibold mb-2 text-white/90">{f.title}</h3>
                <p className="text-white/35 leading-relaxed text-[15px] font-light">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ═══════ PRICING ═══════ */}
      <section id="pricing" className="py-32 px-6 relative">
        <div ref={price.ref} className={`relative max-w-4xl mx-auto ${price.className}`}>
          <div className="text-center mb-20">
            <SectionLabel>Pricing</SectionLabel>
            <h2 className="text-4xl md:text-5xl font-bold mb-5 tracking-tight">Simple, transparent pricing</h2>
            <p className="text-white/35 text-lg font-light">Pay per transaction. No subscriptions. No hidden fees.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ClosePilot Card */}
            <div className="relative rounded-2xl p-8 md:p-10 overflow-hidden group">
              {/* Border glow effect */}
              <div className="absolute inset-0 rounded-2xl border border-brand-400/20 group-hover:border-brand-400/30 transition-colors duration-500" />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-brand-500/[0.06] to-transparent" />
              {/* Top glow */}
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-40 bg-brand-500/10 rounded-full blur-[80px]" />

              <div className="relative">
                <div className="inline-flex items-center gap-1.5 bg-brand-500/90 text-white text-[11px] font-bold px-3.5 py-1.5 rounded-full mb-6 tracking-wider uppercase">
                  <Sparkles size={11} /> Recommended
                </div>
                <h3 className="text-2xl font-bold mb-1">ClosePilot AI</h3>
                <p className="text-white/35 text-sm mb-8">Full AI transaction coordination</p>
                <div className="flex items-baseline gap-1.5 mb-10">
                  <span className="text-[56px] font-bold tracking-tight leading-none">$99</span>
                  <span className="text-white/30 text-lg font-light">/transaction</span>
                </div>
                <ul className="space-y-4 mb-10">
                  {['AI contract parsing', 'Complete timeline generation', 'Automated deadline reminders', 'Party coordination & alerts', 'Document tracking', 'Dashboard for all active deals', 'Email & SMS notifications'].map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-[15px]">
                      <div className="w-5 h-5 rounded-full bg-accent-400/10 flex items-center justify-center shrink-0 border border-accent-400/15">
                        <Check size={11} className="text-accent-400" strokeWidth={3} />
                      </div>
                      <span className="text-white/65 font-light">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="group/btn relative block text-center py-4 rounded-xl font-semibold text-white overflow-hidden shadow-lg shadow-brand-500/15 hover:shadow-brand-500/25 transition-all duration-300">
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-500 to-brand-400" />
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-400 to-[#818cf8] opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                  <span className="relative">Start Free Trial</span>
                </Link>
                <p className="text-white/20 text-xs text-center mt-4">First transaction free · No credit card</p>
              </div>
            </div>

            {/* Human TC Card */}
            <div className="rounded-2xl p-8 md:p-10 border border-white/[0.05] bg-white/[0.01]">
              <div className="h-[30px] mb-6" />
              <h3 className="text-2xl font-bold mb-1 text-white/50">Human TC</h3>
              <p className="text-white/25 text-sm mb-8">Traditional transaction coordinator</p>
              <div className="flex items-baseline gap-1.5 mb-10">
                <span className="text-[56px] font-bold tracking-tight leading-none text-white/40">$350–500</span>
                <span className="text-white/20 text-lg font-light">/transaction</span>
              </div>
              <ul className="space-y-4 mb-10">
                {['Manual contract review', 'Timeline created by hand', 'Business hours only', 'Email/phone reminders', 'Basic document management', 'Limited availability', 'Quality varies by individual'].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-[15px]">
                    <span className="text-white/10 shrink-0 text-base leading-none">—</span>
                    <span className="text-white/30 font-light">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="text-center text-white/20 text-sm mt-10 font-light">Save $251–401 per deal · That's <span className="text-white/35">$2,500–4,000</span> on 10 transactions</p>
        </div>
      </section>

      <SectionDivider />

      {/* ═══════ TESTIMONIALS ═══════ */}
      <section className="py-32 px-6">
        <div ref={test.ref} className={`max-w-5xl mx-auto ${test.className}`}>
          <div className="text-center mb-20">
            <SectionLabel>Testimonials</SectionLabel>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Trusted by agents</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testimonials.map((t, i) => (
              <div key={i} className="p-8 rounded-2xl border border-white/[0.05] bg-white/[0.015] hover:border-white/[0.08] transition-all duration-300">
                <div className="flex gap-1 mb-6">
                  {Array.from({ length: 5 }).map((_, j) => <Star key={j} size={14} className="text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-white/55 mb-8 leading-relaxed text-[15px] font-light">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500/25 to-accent-400/15 flex items-center justify-center text-white/70 text-sm font-semibold border border-white/[0.05]">
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-white/85">{t.name}</p>
                    <p className="text-white/30 text-sm font-light">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ═══════ BUILT BY AN AGENT ═══════ */}
      <section className="py-32 px-6 relative">
        <div ref={built.ref} className={`relative max-w-3xl mx-auto text-center ${built.className}`}>
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500/15 to-brand-500/5 border border-brand-400/10 flex items-center justify-center mx-auto mb-8">
            <Shield size={26} className="text-brand-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-8 tracking-tight">Built by a licensed agent who lived the pain</h2>
          <p className="text-white/40 text-lg leading-relaxed mb-5 font-light">
            ClosePilot wasn't built in a Silicon Valley lab. It was built by an active real estate agent
            who got tired of paying $400+ per deal for transaction coordinators — or spending hours doing it manually.
          </p>
          <p className="text-white/40 text-lg leading-relaxed font-light">
            Every feature is designed around the workflows agents actually use. No bloat. No enterprise upsells.
            Just the TC replacement you need.
          </p>
        </div>
      </section>

      <SectionDivider />

      {/* ═══════ FAQ ═══════ */}
      <section className="py-32 px-6">
        <div ref={faq.ref} className={`max-w-3xl mx-auto ${faq.className}`}>
          <div className="text-center mb-20">
            <SectionLabel>FAQ</SectionLabel>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Frequently asked questions</h2>
          </div>
          <div className="rounded-2xl border border-white/[0.05] bg-white/[0.015] overflow-hidden">
            <div className="px-8">
              {faqs.map((f, i) => <FAQ key={i} q={f.q} a={f.a} />)}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ FINAL CTA ═══════ */}
      <section className="py-32 px-6">
        <div ref={cta.ref} className={`max-w-4xl mx-auto text-center ${cta.className}`}>
          <div className="relative rounded-3xl p-14 md:p-20 overflow-hidden border border-white/[0.05]">
            {/* Background layers */}
            <div className="absolute inset-0 bg-gradient-to-br from-brand-500/[0.05] via-[#09090f] to-accent-400/[0.02]" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-brand-500/[0.06] rounded-full blur-[100px]" />
            <div className="absolute inset-0 grid-pattern opacity-[0.015]" />

            <div className="relative">
              <h2 className="text-4xl md:text-5xl font-bold mb-5 tracking-tight">Ready to close deals faster?</h2>
              <p className="text-white/40 text-lg mb-10 max-w-xl mx-auto font-light">Stop overpaying for transaction coordinators. Start your first deal free.</p>
              <Link to="/register" className="group relative inline-flex items-center gap-2 text-lg px-12 py-4 rounded-xl font-semibold text-white overflow-hidden transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 shadow-2xl shadow-brand-500/20">
                <div className="absolute inset-0 bg-gradient-to-r from-brand-500 to-brand-400" />
                <div className="absolute inset-0 bg-gradient-to-r from-brand-400 to-[#818cf8] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative">Start Free Trial</span>
                <ArrowRight size={18} className="relative group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <p className="text-white/20 text-sm mt-6">No credit card required</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="border-t border-white/[0.04] py-12 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand-500/80 rounded-lg flex items-center justify-center text-[10px] font-bold text-white">CP</div>
            <span className="text-white/25 text-sm">© 2026 ClosePilot</span>
          </div>
          <div className="flex gap-8 text-white/25 text-sm">
            <a href="#features" className="hover:text-white/50 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white/50 transition-colors">Pricing</a>
            <Link to="/login" className="hover:text-white/50 transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── Shared components ─── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-brand-400 text-[11px] font-semibold uppercase tracking-[0.25em] mb-5">{children}</p>
  );
}

function SectionDivider() {
  return <div className="h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />;
}
