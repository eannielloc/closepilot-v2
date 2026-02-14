import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { formatCurrency, formatDate, daysUntil } from '../lib/utils';
import { Home, Calendar, DollarSign, Clock, ChevronRight, AlertTriangle } from 'lucide-react';

interface Transaction {
  id: number; property: string; address: string; city: string; state: string;
  price: number; status: string; contract_date: string; closing_date: string;
  milestones?: any[]; parties?: any[];
}

const statusColor: Record<string, string> = {
  Active: 'bg-blue-500/20 text-blue-300',
  Pending: 'bg-yellow-500/20 text-yellow-300',
  Closed: 'bg-green-500/20 text-green-300',
};

export default function Dashboard() {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => { api.get('/transactions').then(setTxs).finally(() => setLoading(false)); }, []);

  const filtered = filter === 'All' ? txs : txs.filter(t => t.status === filter);
  const stats = {
    active: txs.filter(t => t.status === 'Active').length,
    pending: txs.filter(t => t.status === 'Pending').length,
    closed: txs.filter(t => t.status === 'Closed').length,
    totalValue: txs.reduce((s, t) => s + t.price, 0),
  };

  if (loading) return <div className="flex justify-center p-20"><div className="animate-spin w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full" /></div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Transactions</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active', value: stats.active, icon: <Home size={20} />, color: 'text-blue-400' },
          { label: 'Pending', value: stats.pending, icon: <Clock size={20} />, color: 'text-yellow-400' },
          { label: 'Closed', value: stats.closed, icon: <Calendar size={20} />, color: 'text-green-400' },
          { label: 'Total Value', value: formatCurrency(stats.totalValue), icon: <DollarSign size={20} />, color: 'text-brand-400' },
        ].map((s, i) => (
          <div key={i} className="glass p-4">
            <div className={`${s.color} mb-2`}>{s.icon}</div>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-white/50 text-sm">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['All', 'Active', 'Pending', 'Closed'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm transition ${filter === f ? 'bg-brand-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Transaction Cards */}
      <div className="space-y-3">
        {filtered.length === 0 && <div className="text-white/40 text-center py-12">No transactions found</div>}
        {filtered.map(tx => {
          const days = daysUntil(tx.closing_date);
          const completedMs = tx.milestones?.filter(m => m.completed).length || 0;
          const totalMs = tx.milestones?.length || 0;
          const progress = totalMs > 0 ? Math.round((completedMs / totalMs) * 100) : 0;
          const urgent = days !== null && days >= 0 && days <= 7;

          return (
            <Link key={tx.id} to={`/transactions/${tx.id}`} className="glass glass-hover p-5 flex items-center justify-between group block">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-lg">{tx.property}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[tx.status] || 'bg-white/10 text-white/60'}`}>{tx.status}</span>
                  {urgent && <span className="flex items-center gap-1 text-xs text-orange-400"><AlertTriangle size={12} /> {days}d to close</span>}
                </div>
                <div className="text-sm text-white/50">{tx.address}, {tx.city}, {tx.state}</div>
                <div className="flex items-center gap-4 mt-2 text-sm text-white/40">
                  <span>{formatCurrency(tx.price)}</span>
                  <span>Closing: {formatDate(tx.closing_date)}</span>
                  <span>{completedMs}/{totalMs} milestones</span>
                </div>
                {totalMs > 0 && (
                  <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden w-48">
                    <div className="h-full bg-brand-400 rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                )}
              </div>
              <ChevronRight size={20} className="text-white/30 group-hover:text-white/60 transition" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
