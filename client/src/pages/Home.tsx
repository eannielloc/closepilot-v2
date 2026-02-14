import { Link } from 'react-router-dom';
import { FileText, Clock, Users, Shield, Zap, BarChart3, Upload, CheckCircle } from 'lucide-react';

const features = [
  { icon: <FileText size={24} />, title: 'AI Contract Parsing', desc: 'Upload a PDF and let AI extract every detail — parties, dates, milestones, and more.' },
  { icon: <Clock size={24} />, title: 'Timeline Tracking', desc: 'Visual milestone timeline with completion tracking. Never miss a deadline.' },
  { icon: <Users size={24} />, title: 'Vendor Management', desc: 'Track inspectors, lenders, title companies, and all communications.' },
  { icon: <Shield size={24} />, title: 'Document Tracking', desc: 'Know exactly which documents are received, pending, or missing.' },
  { icon: <Zap size={24} />, title: 'Smart Reminders', desc: 'Automated email reminders for upcoming milestones and deadlines.' },
  { icon: <BarChart3 size={24} />, title: 'Portfolio Overview', desc: 'See all your active, pending, and closed transactions at a glance.' },
];

const steps = [
  { num: '01', icon: <Upload size={24} />, title: 'Upload Contract', desc: 'Drop your PDF contract and let AI do the heavy lifting.' },
  { num: '02', icon: <FileText size={24} />, title: 'Review Details', desc: 'Verify parsed data — parties, dates, milestones, contingencies.' },
  { num: '03', icon: <CheckCircle size={24} />, title: 'Track & Close', desc: 'Monitor progress, send reminders, and close on time.' },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden py-24 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600/20 via-transparent to-accent-400/10" />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-brand-500/20 text-brand-400 px-4 py-1.5 rounded-full text-sm mb-6">
            <Zap size={14} /> AI-Powered Transaction Coordination
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Close Deals <span className="text-brand-400">Faster</span>,<br />
            Stress <span className="text-accent-400">Less</span>
          </h1>
          <p className="text-lg text-white/60 mb-8 max-w-2xl mx-auto">
            ClosePilot automates transaction coordination for real estate professionals.
            Upload contracts, track milestones, and manage vendors — all in one place.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/register" className="btn-brand text-lg px-8 py-3">Get Started Free</Link>
            <Link to="/login" className="glass glass-hover px-8 py-3 text-lg font-medium">Sign In</Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Everything You Need to Close</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="glass glass-hover p-6 rounded-xl">
              <div className="text-brand-400 mb-4">{f.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-white/50 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-6 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <div key={i} className="text-center">
              <div className="w-16 h-16 rounded-full bg-brand-500/20 flex items-center justify-center mx-auto mb-4 text-brand-400">{s.icon}</div>
              <div className="text-xs text-brand-400 font-mono mb-2">{s.num}</div>
              <h3 className="font-semibold mb-2">{s.title}</h3>
              <p className="text-white/50 text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">Simple Pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: 'Starter', price: 'Free', features: ['5 transactions', 'AI parsing', 'Basic reminders'] },
            { name: 'Pro', price: '$29/mo', features: ['Unlimited transactions', 'AI parsing', 'Email reminders', 'Vendor management', 'Priority support'], popular: true },
            { name: 'Team', price: '$79/mo', features: ['Everything in Pro', 'Team collaboration', 'Custom branding', 'API access'] },
          ].map((p, i) => (
            <div key={i} className={`glass p-6 rounded-xl ${p.popular ? 'border-brand-400 ring-1 ring-brand-400/50' : ''}`}>
              {p.popular && <div className="text-xs text-brand-400 font-semibold mb-2">MOST POPULAR</div>}
              <h3 className="text-xl font-bold mb-1">{p.name}</h3>
              <div className="text-3xl font-bold mb-4">{p.price}</div>
              <ul className="space-y-2 text-sm text-white/60">
                {p.features.map((f, j) => <li key={j} className="flex items-center gap-2"><CheckCircle size={14} className="text-accent-400" /> {f}</li>)}
              </ul>
              <Link to="/register" className={`block text-center mt-6 py-2 rounded-lg font-medium ${p.popular ? 'btn-brand' : 'glass glass-hover'}`}>
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-6 text-center text-white/40 text-sm">
        © 2026 ClosePilot. All rights reserved.
      </footer>
    </div>
  );
}
