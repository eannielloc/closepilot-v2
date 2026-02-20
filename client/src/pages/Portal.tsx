import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, DollarSign, Calendar, CheckCircle, Circle, FileText, Users, Clock, AlertCircle } from 'lucide-react';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}
function formatDate(d: string) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface PortalData {
  transaction: { id: number; property: string; address: string; city: string; state: string; county: string; price: number; status: string; contract_date: string; closing_date: string; contract_type: string };
  milestones: { id: number; label: string; date: string; completed: number; category: string }[];
  documents: { id: number; name: string; status: string; category: string; uploaded_at: string }[];
  parties: { role: string; name: string }[];
  agent: { name: string; firm: string } | null;
}

export default function Portal() {
  const { token } = useParams();
  const [data, setData] = useState<PortalData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/portal/${token}`)
      .then(r => { if (!r.ok) throw new Error(r.status === 410 ? 'This link has expired' : 'Invalid link'); return r.json(); })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center">
      <div className="animate-pulse text-white/40 text-lg">Loading...</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4">
      <div className="glass p-8 max-w-md text-center space-y-4">
        <AlertCircle size={48} className="mx-auto text-red-400" />
        <h2 className="text-xl font-bold text-white">{error}</h2>
        <p className="text-white/50 text-sm">Please contact your agent for an updated link.</p>
      </div>
    </div>
  );

  if (!data) return null;
  const { transaction: tx, milestones, documents, parties, agent } = data;

  const completedMs = milestones.filter(m => m.completed).length;
  const totalMs = milestones.length;
  const progress = totalMs > 0 ? Math.round((completedMs / totalMs) * 100) : 0;
  const daysToClose = tx.closing_date ? Math.ceil((new Date(tx.closing_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

  const categoryColors: Record<string, string> = {
    Contract: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    Inspection: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    Financing: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    Closing: 'bg-green-500/20 text-green-300 border-green-500/30',
  };

  const statusColors: Record<string, string> = {
    Received: 'text-green-400',
    Pending: 'text-yellow-400',
    Missing: 'text-red-400',
  };

  return (
    <div className="min-h-screen bg-surface-900 text-white">
      {/* Header bar */}
      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-xl font-bold"><span className="text-brand-400">Close</span><span className="text-accent-400">Pilot</span></div>
          {agent && <div className="text-sm text-white/50">{agent.name}{agent.firm ? ` · ${agent.firm}` : ''}</div>}
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        {/* Property Header */}
        <div className="glass p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{tx.property}</h1>
              <div className="flex items-center gap-2 text-white/60 mt-1"><MapPin size={16} /> {tx.address}, {tx.city}, {tx.state}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-brand-400">{formatCurrency(tx.price)}</div>
              {daysToClose !== null && (
                <div className={`text-sm mt-1 ${daysToClose <= 7 ? 'text-orange-400' : 'text-white/50'}`}>
                  {daysToClose > 0 ? `${daysToClose} days to closing` : daysToClose === 0 ? 'Closing today!' : 'Closed'}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
            <div><span className="text-white/40">Type</span><br />{tx.contract_type || '—'}</div>
            <div><span className="text-white/40">Status</span><br />
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${tx.status === 'Active' ? 'bg-green-500/20 text-green-300' : tx.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-white/10 text-white/60'}`}>
                {tx.status}
              </span>
            </div>
            {tx.contract_date && <div><span className="text-white/40">Contract Date</span><br />{formatDate(tx.contract_date)}</div>}
            {tx.closing_date && <div><span className="text-white/40">Closing Date</span><br />{formatDate(tx.closing_date)}</div>}
          </div>

          {/* Progress bar */}
          <div className="mt-5">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-white/50">Progress</span>
              <span className="text-brand-400 font-medium">{progress}% ({completedMs}/{totalMs} milestones)</span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-brand-400 to-accent-400 rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Milestone Timeline */}
          <div className="glass p-6">
            <h2 className="font-semibold text-lg flex items-center gap-2 mb-4"><Calendar size={20} /> Timeline</h2>
            <div className="relative">
              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-white/10" />
              <div className="space-y-3">
                {milestones.map((m) => (
                  <div key={m.id} className="flex items-start gap-3 relative">
                    <div className="relative z-10 mt-0.5">
                      {m.completed ? <CheckCircle size={22} className="text-accent-400" /> : <Circle size={22} className="text-white/20" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm ${m.completed ? 'text-white/40 line-through' : 'text-white'}`}>{m.label}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-white/30 text-xs">{formatDate(m.date)}</span>
                        {m.category && <span className={`text-xs px-2 py-0.5 rounded-full border ${categoryColors[m.category] || 'bg-white/5 text-white/40 border-white/10'}`}>{m.category}</span>}
                      </div>
                    </div>
                  </div>
                ))}
                {milestones.length === 0 && <div className="text-white/30 text-sm text-center py-6">No milestones set</div>}
              </div>
            </div>
          </div>

          {/* Parties */}
          <div className="glass p-6">
            <h2 className="font-semibold text-lg flex items-center gap-2 mb-4"><Users size={20} /> Parties</h2>
            <div className="space-y-2">
              {parties.map((p, i) => (
                <div key={i} className="bg-white/5 rounded-lg p-3 text-sm">
                  <span className="text-brand-400 font-medium">{p.role}</span> — {p.name}
                </div>
              ))}
              {parties.length === 0 && <div className="text-white/30 text-sm text-center py-6">No parties listed</div>}
            </div>
          </div>

          {/* Documents */}
          <div className="glass p-6 lg:col-span-2">
            <h2 className="font-semibold text-lg flex items-center gap-2 mb-4"><FileText size={20} /> Documents</h2>
            <div className="space-y-2">
              {documents.map(d => (
                <div key={d.id} className="bg-white/5 rounded-lg p-3 text-sm flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText size={16} className="text-white/40 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="truncate">{d.name}</div>
                      {d.category && <span className="text-white/30 text-xs">{d.category}</span>}
                    </div>
                  </div>
                  <span className={`text-xs font-medium ${statusColors[d.status] || 'text-white/40'}`}>{d.status}</span>
                </div>
              ))}
              {documents.length === 0 && <div className="text-white/30 text-sm text-center py-6">No documents yet</div>}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-8 border-t border-white/5">
          <div className="text-sm text-white/20">Powered by <span className="text-brand-400/50">Close</span><span className="text-accent-400/50">Pilot</span> — AI-Powered Transaction Coordination</div>
        </div>
      </div>
    </div>
  );
}
