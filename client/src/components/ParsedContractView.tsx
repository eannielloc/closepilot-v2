import { formatCurrency, formatDate } from '../lib/utils';
import { MapPin, DollarSign, Calendar, Users, FileText, AlertTriangle, Wrench } from 'lucide-react';

interface Transaction {
  property?: string; address?: string; city?: string; state?: string; county?: string;
  price?: number; status?: string; contract_date?: string; closing_date?: string; contract_type?: string;
  milestones?: any[]; parties?: any[]; documents?: any[]; contingencies?: any[]; vendors?: any[];
}

const safe = (v: any, fallback = '—') => v ?? fallback;
const initial = (v: any) => v && typeof v === 'string' ? v.charAt(0).toUpperCase() : '?';

export default function ParsedContractView({ tx }: { tx: Transaction }) {
  return (
    <div className="space-y-6">
      <div className="glass p-6">
        <h2 className="text-2xl font-bold mb-4">{safe(tx.property, 'Parsed Contract')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-white/70"><MapPin size={16} /> {safe(tx.address)} {safe(tx.city)}, {safe(tx.state)}</div>
          <div className="flex items-center gap-2 text-white/70"><DollarSign size={16} /> {tx.price ? formatCurrency(tx.price) : '—'}</div>
          <div className="flex items-center gap-2 text-white/70"><Calendar size={16} /> Contract: {formatDate(tx.contract_date)}</div>
          <div className="flex items-center gap-2 text-white/70"><Calendar size={16} /> Closing: {formatDate(tx.closing_date)}</div>
        </div>
      </div>

      {tx.parties && tx.parties.length > 0 && (
        <div className="glass p-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Users size={18} /> Parties</h3>
          <div className="space-y-2">
            {tx.parties.map((p: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm bg-white/5 rounded-lg p-3">
                <div><span className="text-brand-400 font-medium">{safe(p.role)}</span> — {safe(p.name)}</div>
                <div className="text-white/50">{safe(p.email, '')} {safe(p.phone, '')}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tx.milestones && tx.milestones.length > 0 && (
        <div className="glass p-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Calendar size={18} /> Milestones</h3>
          <div className="space-y-2">
            {tx.milestones.map((m: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm bg-white/5 rounded-lg p-3">
                <span>{safe(m.label)}</span>
                <span className="text-white/50">{formatDate(m.date)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tx.documents && tx.documents.length > 0 && (
        <div className="glass p-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><FileText size={18} /> Documents</h3>
          <div className="space-y-2">
            {tx.documents.map((d: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm bg-white/5 rounded-lg p-3">
                <span>{safe(d.name)}</span>
                <span className={d.status === 'Received' ? 'text-accent-400' : 'text-yellow-400'}>{safe(d.status)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tx.contingencies && tx.contingencies.length > 0 && (
        <div className="glass p-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><AlertTriangle size={18} /> Contingencies</h3>
          <div className="flex flex-wrap gap-2">
            {tx.contingencies.map((c: any, i: number) => (
              <span key={i} className="bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full text-sm">{safe(c.name)}</span>
            ))}
          </div>
        </div>
      )}

      {tx.vendors && tx.vendors.length > 0 && (
        <div className="glass p-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Wrench size={18} /> Vendors</h3>
          <div className="space-y-2">
            {tx.vendors.map((v: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm bg-white/5 rounded-lg p-3">
                <div><span className="text-accent-400 font-medium">{safe(v.type)}</span> — {safe(v.name)}</div>
                <div className="text-white/50">{safe(v.email, '')} {safe(v.phone, '')}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
