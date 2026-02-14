import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { formatCurrency, formatDate, daysUntil } from '../lib/utils';
import { ArrowLeft, MapPin, DollarSign, Calendar, Users, FileText, AlertTriangle, Wrench, CheckCircle, Circle } from 'lucide-react';

export default function TransactionDetail() {
  const { id } = useParams();
  const [tx, setTx] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get(`/transactions/${id}`).then(setTx).finally(() => setLoading(false)); }, [id]);

  const toggleMilestone = async (msId: number) => {
    await api.patch(`/transactions/milestones/${msId}/toggle`);
    const updated = await api.get(`/transactions/${id}`);
    setTx(updated);
  };

  const updateDocStatus = async (docId: number, status: string) => {
    await api.patch(`/transactions/documents/${docId}`, { status });
    const updated = await api.get(`/transactions/${id}`);
    setTx(updated);
  };

  if (loading) return <div className="flex justify-center p-20"><div className="animate-spin w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full" /></div>;
  if (!tx) return <div className="text-center p-20 text-white/40">Transaction not found</div>;

  const days = daysUntil(tx.closing_date);
  const completedMs = tx.milestones?.filter((m: any) => m.completed).length || 0;
  const totalMs = tx.milestones?.length || 0;
  const progress = totalMs > 0 ? Math.round((completedMs / totalMs) * 100) : 0;

  const categoryColors: Record<string, string> = {
    Contract: 'bg-blue-500/20 text-blue-300',
    Inspection: 'bg-purple-500/20 text-purple-300',
    Financing: 'bg-yellow-500/20 text-yellow-300',
    Closing: 'bg-green-500/20 text-green-300',
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <Link to="/dashboard" className="flex items-center gap-2 text-white/50 hover:text-white transition text-sm">
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      {/* Header */}
      <div className="glass p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{tx.property}</h1>
            <div className="flex items-center gap-2 text-white/60"><MapPin size={16} /> {tx.address}, {tx.city}, {tx.state}</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-brand-400">{formatCurrency(tx.price)}</div>
            {days !== null && <div className={`text-sm mt-1 ${days <= 7 ? 'text-orange-400' : 'text-white/50'}`}>{days > 0 ? `${days} days to closing` : days === 0 ? 'Closing today!' : 'Closed'}</div>}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
          <div><span className="text-white/40">Type</span><br />{tx.contract_type || '—'}</div>
          <div><span className="text-white/40">Contract Date</span><br />{formatDate(tx.contract_date)}</div>
          <div><span className="text-white/40">Closing Date</span><br />{formatDate(tx.closing_date)}</div>
          <div><span className="text-white/40">Progress</span><br />{progress}% ({completedMs}/{totalMs})</div>
        </div>
        <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-brand-400 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Milestones */}
        <div className="glass p-6">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2"><Calendar size={20} /> Milestones</h2>
          <div className="space-y-2">
            {(tx.milestones || []).map((m: any) => (
              <div key={m.id} className="flex items-center gap-3 bg-white/5 rounded-lg p-3 text-sm cursor-pointer hover:bg-white/10 transition"
                onClick={() => toggleMilestone(m.id)}>
                {m.completed ? <CheckCircle size={18} className="text-accent-400 flex-shrink-0" /> : <Circle size={18} className="text-white/30 flex-shrink-0" />}
                <span className={m.completed ? 'line-through text-white/40' : ''}>{m.label}</span>
                <span className="ml-auto text-white/40">{formatDate(m.date)}</span>
                {m.category && <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[m.category] || 'bg-white/10 text-white/50'}`}>{m.category}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Parties */}
        <div className="glass p-6">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2"><Users size={20} /> Parties</h2>
          <div className="space-y-2">
            {(tx.parties || []).map((p: any) => (
              <div key={p.id} className="bg-white/5 rounded-lg p-3 text-sm">
                <div className="flex justify-between">
                  <span><span className="text-brand-400 font-medium">{p.role}</span> — {p.name}</span>
                  {p.firm && <span className="text-white/40">{p.firm}</span>}
                </div>
                <div className="text-white/40 text-xs mt-1">{[p.email, p.phone].filter(Boolean).join(' · ') || 'No contact info'}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Documents */}
        <div className="glass p-6">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2"><FileText size={20} /> Documents</h2>
          <div className="space-y-2">
            {(tx.documents || []).map((d: any) => (
              <div key={d.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3 text-sm">
                <span>{d.name}</span>
                <select value={d.status} onChange={e => updateDocStatus(d.id, e.target.value)}
                  className="bg-white/10 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none">
                  <option value="Pending">Pending</option>
                  <option value="Received">Received</option>
                  <option value="Missing">Missing</option>
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Contingencies */}
        {tx.contingencies?.length > 0 && (
          <div className="glass p-6">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2"><AlertTriangle size={20} /> Contingencies</h2>
            <div className="flex flex-wrap gap-2">
              {tx.contingencies.map((c: any) => (
                <span key={c.id} className="bg-yellow-500/20 text-yellow-300 px-3 py-1.5 rounded-full text-sm">{c.name}</span>
              ))}
            </div>
          </div>
        )}

        {/* Vendors */}
        {tx.vendors?.length > 0 && (
          <div className="glass p-6">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2"><Wrench size={20} /> Vendors</h2>
            <div className="space-y-2">
              {tx.vendors.map((v: any) => (
                <div key={v.id} className="bg-white/5 rounded-lg p-3 text-sm">
                  <div><span className="text-accent-400 font-medium">{v.type}</span> — {v.name}</div>
                  <div className="text-white/40 text-xs mt-1">{[v.email, v.phone].filter(Boolean).join(' · ') || 'No contact info'}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
