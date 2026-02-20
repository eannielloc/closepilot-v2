import { Link } from 'react-router-dom';
import { FileText, Clock, Users, Zap, ArrowRight, Shield, ChevronDown, Bell, BarChart3, Upload, Star, Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { usePageTitle } from '../lib/usePageTitle';

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, className: `transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}` };
}

function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-5 text-left">
        <span className="font-medium text-lg">{q}</span>
        <ChevronDown size={20} className={`text-white/40 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-40 pb-5' : 'max-h-0'}`}>
        <p className="text-white/50">{a}</p>
      </div>
    </div>
  );
}

const features = [
  { icon: <FileText size={28} />, title: 'AI Contract Parsing', desc: 'Extracts dates, parties, contingencies, and financial terms from your purchase agreement PDFs in seconds.' },
  { icon: <BarChart3 size={28} />, title: 'Visual Timeline', desc: 'See every milestone at a glance. Color-coded urgency. Click to mark complete or waive.' },
  { icon: <Bell size={28} />, title: 'Automated Reminders', desc: '7-day, 3-day, 1-day, and day-of alerts to buyers, sellers, attorneys, lenders — everyone.' },
  { icon: <Users size={28} />, title: 'Party Coordination', desc: 'All contacts in one place. Every party gets the right reminder at the right time.' },
  { icon: <Clock size={28} />, title: 'Never Miss a Deadline', desc: 'Real-time dashboard shows what\'s due today, this week, and what\'s overdue across all deals.' },
  { icon: <Upload size={28} />, title: '60-Second Setup', desc: 'Upload PDF → AI parses → timeline generated. No manual data entry. No onboarding calls.' },
];

const testimonials = [
  { name: 'Maria S.', role: 'Agent, Keller Williams', quote: 'I saved $3,200 across my last 8 transactions. The AI parsed my contract perfectly — every date, every contingency. It\'s like having a TC who never sleeps.', initials: 'MS' },
  { name: 'David P.', role: 'Solo Agent', quote: 'As a first-year agent, I couldn\'t afford $400/deal for a TC. ClosePilot gives me the structure and accountability I need at a price that actually makes sense.', initials: 'DP' },
  { name: 'Rachel G.', role: 'Team Lead', quote: 'My team of 4 switched from a human TC. We process 30+ transactions a year — the savings are massive. Haven\'t missed a single deadline in 3 months.', initials: 'RG' },
];

const faqs = [
  { q: 'What contract forms does ClosePilot support?', a: 'ClosePilot works with standard real estate purchase agreement PDFs. We\'re continuously expanding support for more form types and states.' },
  { q: 'How does the AI parsing work?', a: 'You upload your executed purchase agreement PDF. Our AI reads the entire document and extracts all key dates, parties, financial terms, and contingencies — typically in under 60 seconds.' },
  { q: 'Does ClosePilot replace a transaction coordinator?', a: 'For most deals, yes. ClosePilot handles the core TC functions: timeline management, deadline tracking, automated reminders to all parties, and document organization — at a fraction of the cost.' },
  { q: 'Is my data secure?', a: 'Absolutely. All data is encrypted at rest and in transit. We never share your information with third parties.' },
  { q: 'Can I try it before paying?', a: 'Yes! Your first transaction is completely free. No credit card required.' },
];

export default function Home() {
  usePageTitle('AI Transaction Coordinator for Real Estate');
  const hero = useReveal();
  const steps = useReveal();
  const feat = useReveal();
  const price = useReveal();
  const test = useReveal();
  const built = useReveal();
  const faq = useReveal();
  const cta = useReveal();

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-6 pt-12">
        <div className="absolute inset-0 hero-gradient" />
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-[40%] -left-[20%] w-[80vw] h-[80vw] rounded-full bg-brand-500/8 blur-3xl animate-pulse-slow" />
          <div className="absolute -bottom-[30%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-accent-400/5 blur-3xl animate-pulse-slow delay-2" />
        </div>
        <div ref={hero.ref} className={`relative max-w-5xl mx-auto text-center ${hero.className}`}>
          <div className="inline-flex items-center gap-2 bg-brand-500/15 text-brand-400 px-5 py-2 rounded-full text-sm font-medium mb-8 border border-brand-400/20">
            <Zap size={14} /> The first AI transaction coordinator for real estate
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 leading-[1.1] tracking-tight">
            Close deals faster.<br />
            <span className="bg-gradient-to-r from-brand-400 to-accent-400 bg-clip-text text-transparent">Pay 75% less.</span>
          </h1>
          <p className="text-xl text-white/50 mb-10 max-w-2xl mx-auto leading-relaxed">
            Upload your purchase agreement. ClosePilot extracts every date, party, and deadline — then manages the entire transaction for <span className="text-white font-semibold">$99 instead of $400</span>.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn-brand text-lg px-10 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25">
              Start Free Trial <ArrowRight size={18} />
            </Link>
            <a href="#how-it-works" className="glass glass-hover px-10 py-4 text-lg font-medium rounded-xl flex items-center justify-center gap-2">
              See How It Works
            </a>
          </div>
          <p className="text-white/30 text-sm mt-6">No credit card required</p>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 bg-white/[0.02]">
        <div ref={steps.ref} className={`max-w-5xl mx-auto ${steps.className}`}>
          <div className="text-center mb-16">
            <p className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-3">How It Works</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">From PDF to autopilot in 60 seconds</h2>
            <p className="text-white/40 text-lg">Three steps. No onboarding calls. No data entry. Just upload and go.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Upload your contract', desc: 'Drop your executed purchase agreement PDF. Our AI reads every clause, date, party, and contingency automatically.' },
              { step: '02', title: 'Review the timeline', desc: 'Instantly see a visual timeline with every milestone — deposit, inspection, attorney review, appraisal, mortgage commitment, closing.' },
              { step: '03', title: 'Put it on autopilot', desc: 'Automated 7-day, 3-day, 1-day, and same-day reminders go to every party. You focus on selling — we handle follow-ups.' },
            ].map((s, i) => (
              <div key={i} className="glass p-8 rounded-2xl text-center">
                <div className="text-brand-400 text-5xl font-bold mb-4 opacity-30">{s.step}</div>
                <h3 className="text-xl font-semibold mb-3">{s.title}</h3>
                <p className="text-white/45 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div ref={feat.ref} className={`max-w-6xl mx-auto ${feat.className}`}>
          <div className="text-center mb-16">
            <p className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Everything a TC does. None of the cost.</h2>
            <p className="text-white/40 text-lg max-w-xl mx-auto">ClosePilot handles the tedious coordination work so you can focus on what matters — your clients.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="glass glass-hover p-8 rounded-2xl group" style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="w-12 h-12 rounded-xl bg-brand-500/15 flex items-center justify-center text-brand-400 mb-5 group-hover:bg-brand-500/25 transition-colors">
                  {f.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{f.title}</h3>
                <p className="text-white/45 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing — Side by Side */}
      <section id="pricing" className="py-24 px-6 bg-white/[0.02]">
        <div ref={price.ref} className={`max-w-4xl mx-auto ${price.className}`}>
          <div className="text-center mb-16">
            <p className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-3">Pricing</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-white/40 text-lg">Pay per transaction. No subscriptions. No hidden fees.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ClosePilot */}
            <div className="glass rounded-2xl p-8 border-brand-400 ring-1 ring-brand-400/30 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                RECOMMENDED
              </div>
              <h3 className="text-2xl font-bold mb-1">ClosePilot AI</h3>
              <p className="text-white/50 text-sm mb-4">Full AI transaction coordination</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold">$99</span>
                <span className="text-white/40">/transaction</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['AI contract parsing', 'Complete timeline generation', 'Automated deadline reminders', 'Party coordination & alerts', 'Document tracking', 'Dashboard with all active deals', 'Email & SMS notifications'].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <Check size={16} className="text-accent-400 shrink-0" />
                    <span className="text-white/70">{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/register" className="block text-center py-3 rounded-xl font-semibold btn-brand shadow-lg shadow-brand-500/25">
                Start Free Trial
              </Link>
              <p className="text-white/30 text-xs text-center mt-3">First transaction free. No credit card required.</p>
            </div>
            {/* Human TC */}
            <div className="glass rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-1">Human TC</h3>
              <p className="text-white/50 text-sm mb-4">Traditional transaction coordinator</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold">$350–500</span>
                <span className="text-white/40">/transaction</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Manual contract review', 'Timeline created by hand', 'Email/call reminders (business hours)', 'Party coordination', 'Document management', 'Limited to working hours', 'Varies by individual quality'].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <span className="text-white/20 shrink-0">—</span>
                    <span className="text-white/40">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="text-center text-white/30 text-sm mt-6">Save $251–401 per deal · That's $2,500–4,000 on 10 transactions</p>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6">
        <div ref={test.ref} className={`max-w-5xl mx-auto ${test.className}`}>
          <div className="text-center mb-16">
            <p className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-3">Testimonials</p>
            <h2 className="text-4xl md:text-5xl font-bold">Trusted by agents</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="glass p-8 rounded-2xl">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => <Star key={j} size={16} className="text-yellow-400 fill-yellow-400" />)}
                </div>
                <p className="text-white/70 mb-6 leading-relaxed">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 text-sm font-bold">{t.initials}</div>
                  <div>
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-white/40 text-sm">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Built by an Agent */}
      <section className="py-24 px-6 bg-white/[0.02]">
        <div ref={built.ref} className={`max-w-3xl mx-auto text-center ${built.className}`}>
          <Shield size={36} className="text-brand-400 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Built by a licensed agent who lived the pain</h2>
          <p className="text-white/50 text-lg leading-relaxed mb-4">
            ClosePilot wasn't built in a Silicon Valley lab. It was built by an active real estate agent
            who got tired of paying $400+ per deal for transaction coordinators — or spending hours doing it manually.
          </p>
          <p className="text-white/50 text-lg leading-relaxed">
            Every feature is designed around the workflows agents actually use. No bloat. No enterprise upsells.
            Just the TC replacement you need.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6">
        <div ref={faq.ref} className={`max-w-3xl mx-auto ${faq.className}`}>
          <div className="text-center mb-16">
            <p className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-3">FAQ</p>
            <h2 className="text-4xl md:text-5xl font-bold">Frequently asked questions</h2>
          </div>
          <div className="glass rounded-2xl p-2">
            <div className="px-6">
              {faqs.map((f, i) => <FAQ key={i} q={f.q} a={f.a} />)}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div ref={cta.ref} className={`max-w-4xl mx-auto text-center ${cta.className}`}>
          <div className="glass rounded-3xl p-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 to-accent-400/5" />
            <div className="relative">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Ready to close deals faster?</h2>
              <p className="text-white/50 text-lg mb-8 max-w-xl mx-auto">Stop overpaying for transaction coordinators. Start your first deal free.</p>
              <Link to="/register" className="btn-brand text-lg px-12 py-4 rounded-xl font-semibold inline-flex items-center gap-2 shadow-lg shadow-brand-500/25">
                Start Free Trial <ArrowRight size={18} />
              </Link>
              <p className="text-white/30 text-sm mt-4">No credit card required</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-white/40 text-sm">© 2026 ClosePilot. All rights reserved.</div>
          <div className="flex gap-6 text-white/30 text-sm">
            <a href="#features" className="hover:text-white/60 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white/60 transition-colors">Pricing</a>
            <Link to="/login" className="hover:text-white/60 transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
