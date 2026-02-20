import { Link } from 'react-router-dom';
import { FileText, Clock, Users, PenTool, DollarSign, LayoutGrid, Check, ChevronDown, Star, Zap, ArrowRight, Shield } from 'lucide-react';
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

const features = [
  { icon: <FileText size={28} />, title: 'AI Contract Parsing', desc: 'Upload a PDF and get parties, dates, milestones extracted in seconds. No manual data entry.' },
  { icon: <PenTool size={28} />, title: 'E-Signatures', desc: 'Built-in signing — no DocuSign needed. Send, track, and store signatures all in one place.' },
  { icon: <Clock size={28} />, title: 'Deadline Tracking', desc: 'Visual milestone timeline with smart reminders. Never miss an inspection or closing date.' },
  { icon: <Users size={28} />, title: 'Client Portal', desc: 'Give clients a live view of their deal status. Professional, transparent, impressive.' },
  { icon: <DollarSign size={28} />, title: 'Commission Tracking', desc: 'Know exactly what you\'re earning on every deal. Track splits, bonuses, and pending payouts.' },
  { icon: <LayoutGrid size={28} />, title: 'Pipeline View', desc: 'See all your active, pending, and closed deals at a glance. Filter, sort, search instantly.' },
];

const comparisons = [
  { feature: 'AI Contract Parsing', cp: true, sky: false, docu: false, paper: false },
  { feature: 'E-Signatures', cp: true, sky: false, docu: true, paper: false },
  { feature: 'Deadline Tracking', cp: true, sky: true, docu: false, paper: false },
  { feature: 'Client Portal', cp: true, sky: false, docu: false, paper: false },
  { feature: 'Commission Tracking', cp: true, sky: true, docu: false, paper: false },
  { feature: 'Document Management', cp: true, sky: true, docu: true, paper: false },
  { feature: 'Starting Price', cp: 'Free', sky: '$15/file', docu: '$25/mo', paper: '$0' },
  { feature: 'Setup Time', cp: '2 min', sky: '1 hour', docu: '30 min', paper: 'N/A' },
];

const testimonials = [
  { name: 'Sarah M.', role: 'Broker, Keller Williams', quote: 'ClosePilot replaced my TC and DocuSign subscription. I save over $400/month now.', stars: 5 },
  { name: 'James R.', role: 'Agent, RE/MAX', quote: 'The AI parsing is magic. I uploaded a 30-page contract and everything was extracted perfectly.', stars: 5 },
  { name: 'Lisa C.', role: 'Team Lead, Compass', quote: 'My whole team switched in a week. The pipeline view alone is worth it.', stars: 5 },
];

const faqs = [
  { q: 'How does AI contract parsing work?', a: 'Upload any real estate contract PDF. Our AI reads every page and extracts parties, dates, milestones, contingencies, and vendors automatically. Review and confirm — done in seconds.' },
  { q: 'Do I still need DocuSign?', a: 'Nope. ClosePilot has built-in e-signatures with token-based signing links, signature capture, and status tracking. Everything in one tool.' },
  { q: 'Is my data secure?', a: 'Absolutely. All data is encrypted at rest and in transit. We never share your information with third parties.' },
  { q: 'Can I try it for free?', a: 'Yes! The Free plan includes 3 transactions with basic features. No credit card required.' },
  { q: 'What file formats do you support?', a: 'Currently PDF contracts. We\'re adding DOCX and image support soon.' },
  { q: 'Can my whole team use it?', a: 'Yes — the Team plan ($79/mo) includes team management, shared transactions, and analytics.' },
];

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

export default function Home() {
  usePageTitle('AI Transaction Coordinator for Real Estate');
  const hero = useReveal();
  const social = useReveal();
  const feat = useReveal();
  const comp = useReveal();
  const price = useReveal();
  const test = useReveal();
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
            <Zap size={14} /> Now in Beta — Join 500+ agents
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 leading-[1.1] tracking-tight">
            The AI Transaction Coordinator<br />
            <span className="bg-gradient-to-r from-brand-400 to-accent-400 bg-clip-text text-transparent">That Replaces Your TC</span>
          </h1>
          <p className="text-xl text-white/50 mb-10 max-w-2xl mx-auto leading-relaxed">
            Save <span className="text-white font-semibold">$300+ per transaction</span>. Upload contracts, track deadlines,
            collect e-signatures, and manage your entire pipeline — powered by AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn-brand text-lg px-10 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25">
              Start Free Trial <ArrowRight size={18} />
            </Link>
            <a href="#features" className="glass glass-hover px-10 py-4 text-lg font-medium rounded-xl flex items-center justify-center gap-2">
              See Features
            </a>
          </div>
          <p className="text-white/30 text-sm mt-6">No credit card required · 3 free transactions</p>
        </div>
      </section>

      {/* Social Proof */}
      <section ref={social.ref} className={`py-12 px-6 border-y border-white/5 ${social.className}`}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-white/40 text-sm uppercase tracking-widest font-medium">Trusted by 500+ real estate professionals</p>
          <div className="flex items-center gap-8 text-white/20">
            {['Keller Williams', 'RE/MAX', 'Compass', 'eXp Realty', 'Century 21'].map(b => (
              <span key={b} className="text-sm font-semibold tracking-wide whitespace-nowrap">{b}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div ref={feat.ref} className={`max-w-6xl mx-auto ${feat.className}`}>
          <div className="text-center mb-16">
            <p className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Everything you need to close</h2>
            <p className="text-white/40 text-lg max-w-xl mx-auto">One platform replaces your TC, DocuSign, spreadsheets, and follow-up reminders.</p>
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

      {/* Comparison */}
      <section className="py-24 px-6 bg-white/[0.02]">
        <div ref={comp.ref} className={`max-w-4xl mx-auto ${comp.className}`}>
          <div className="text-center mb-16">
            <p className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-3">Compare</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Why agents switch to ClosePilot</h2>
          </div>
          <div className="glass rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-4 text-white/40 font-medium">Feature</th>
                    <th className="p-4 text-brand-400 font-bold">ClosePilot</th>
                    <th className="p-4 text-white/40 font-medium">SkySlope</th>
                    <th className="p-4 text-white/40 font-medium">DocuSign</th>
                    <th className="p-4 text-white/40 font-medium">Paper</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisons.map((r, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="p-4 font-medium">{r.feature}</td>
                      {[r.cp, r.sky, r.docu, r.paper].map((v, j) => (
                        <td key={j} className="p-4 text-center">
                          {v === true ? <Check size={18} className={j === 0 ? 'text-accent-400 mx-auto' : 'text-white/30 mx-auto'} /> :
                           v === false ? <span className="text-white/15">—</span> :
                           <span className={j === 0 ? 'text-accent-400 font-semibold' : 'text-white/40'}>{v}</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div ref={price.ref} className={`max-w-5xl mx-auto ${price.className}`}>
          <div className="text-center mb-16">
            <p className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-3">Pricing</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-white/40 text-lg">Start free. Upgrade when you're ready.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Free', price: '$0', period: 'forever', desc: 'Try it out', features: ['3 transactions', 'AI contract parsing', 'Basic deadline tracking', 'Document uploads', 'Email support'] },
              { name: 'Pro', price: '$29', period: '/month', desc: 'For active agents', popular: true, features: ['Unlimited transactions', 'AI contract parsing', 'E-signatures built-in', 'Client portal access', 'Commission tracking', 'Smart reminders', 'Priority support'] },
              { name: 'Team', price: '$79', period: '/month', desc: 'For teams & brokerages', features: ['Everything in Pro', 'Team management', 'Shared pipeline view', 'Analytics dashboard', 'Custom checklists', 'API access', 'Dedicated support'] },
            ].map((p, i) => (
              <div key={i} className={`glass rounded-2xl p-8 relative ${p.popular ? 'border-brand-400 ring-1 ring-brand-400/30 scale-[1.03]' : ''}`}>
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                )}
                <p className="text-white/50 text-sm mb-1">{p.desc}</p>
                <h3 className="text-2xl font-bold mb-1">{p.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold">{p.price}</span>
                  <span className="text-white/40">{p.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm">
                      <Check size={16} className="text-accent-400 shrink-0" />
                      <span className="text-white/70">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/register" className={`block text-center py-3 rounded-xl font-semibold transition-all ${p.popular ? 'btn-brand shadow-lg shadow-brand-500/25' : 'glass glass-hover'}`}>
                  {p.price === '$0' ? 'Start Free' : 'Start Free Trial'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 bg-white/[0.02]">
        <div ref={test.ref} className={`max-w-5xl mx-auto ${test.className}`}>
          <div className="text-center mb-16">
            <p className="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-3">Testimonials</p>
            <h2 className="text-4xl md:text-5xl font-bold">Loved by agents</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="glass p-8 rounded-2xl">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, j) => <Star key={j} size={16} className="text-yellow-400 fill-yellow-400" />)}
                </div>
                <p className="text-white/70 mb-6 leading-relaxed">"{t.quote}"</p>
                <div>
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-white/40 text-sm">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Built by an Agent */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
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
            <h2 className="text-4xl md:text-5xl font-bold">Common questions</h2>
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
              <Shield size={40} className="text-brand-400 mx-auto mb-6" />
              <h2 className="text-4xl md:text-5xl font-bold mb-4">Ready to close deals faster?</h2>
              <p className="text-white/50 text-lg mb-8 max-w-xl mx-auto">Join 500+ agents who are saving time and money with ClosePilot.</p>
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
