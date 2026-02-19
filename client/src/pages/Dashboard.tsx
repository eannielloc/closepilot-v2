import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { formatCurrency, formatDate, daysUntil } from '../lib/utils';
import { Home, Calendar, DollarSign, Clock, ChevronRight, AlertTriangle, Search, ArrowUpDown, CalendarClock, FileText, Plus } from 'lucide-react';
import { CardSkeleton, EmptyState } from '../components/Skeleton';

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

type SortKey = 'date' | 'price' | 'property' | 'closing';

export default function Dashboard() {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('closing');

  useEffect(() => { api.get('/transactions').then(setTxs).finally(() => setLoading(false)); }, []);

  const filtered = useMemo(() => {
    let list = filter === 'All' ? txs : txs.filter(t => t.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.property.toLowerCase().includes(q) ||
        t.address.toLowerCase().includes(q) ||
        t.city.toLowerCase().includes(q) ||
        t.state.toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case 'price': return b.price - a.price;
        case 'property': return a.property.localeCompare(b.property);
        case 'closing': return (a.closing_date || '').localeCompare(b.closing_date || '');
        default: return (b.contract_date || '').localeCompare(a.contract_date || '');
      }
    });
    return list;
  }, [txs, filter, search, sortBy]);

  const stats = useMemo(() => ({
    active: txs.filter(t => t.status === 'Active').length,
    pending: txs.filter(t => t.status === 'Pending').length,
    closed: txs.filter(t => t.status === 'Closed').length,
    totalValue: txs.reduce((s, t) => s + t.price, 0),
  }), [txs]);

  const upcomingThisWeek = useMemo(() => {
    const items: { tx: Transaction; milestone: any }[] = [];
    for (const tx of txs) {
      for (const m of (tx.milestones || [])) {
        if (m.completed) continue;
        const d = daysUntil(m.date);
        if (d !== null && d >= 0 && d <= 7) items.push({ tx, milestone: m });
      }
    }
    return items.sort((a, b) => (a.milestone.date || '').localeCompare(b.milestone.date || ''));
  }, [txs]);

  if (loading) return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="h-8 w-48 bg-white/10 rounded animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="glass p-4 h-24 animate-pulse" />)}
      </div>
      <div className="space-y-3">{[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}</div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Transactions</h1>
        <Link to="/upload" className="btn-brand flex items-center gap-2 text-sm">
          <Plus size={16} /> New
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: 'Active', value: stats.active, icon: <Home size={20} />, color: 'text-blue-400' },
          { label: 'Pending', value: stats.pending, icon: <Clock size={20} />, color: 'text-yellow-400' },
          { label: 'Closed', value: stats.closed, icon: <Calendar size={20} />, color: 'text-green-400' },
          { label: 'Total Value', value: formatCurrency(stats.totalValue), icon: <DollarSign size={20} />, color: 'text-brand-400' },
        ].map((s, i) => (
          <div key={i} className="glass p-4">
            <div className={`${s.color} mb-2`}>{s.icon}</div>
            <div className="text-xl md:text-2xl font-bold">{s.value}</div>
            <div className="text-white/50 text-sm">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Upcoming This Week */}
      {upcomingThisWeek.length > 0 && (
        <div className="glass p-4 md:p-5">
          <h2 className="font-semibold text-sm flex items-center gap-2 text-yellow-400 mb-3">
            <CalendarClock size={16} /> Upcoming This Week
          </h2>
          <div className="space-y-2">
            {upcomingThisWeek.slice(0, 5).map((item, i) => {
              const d = daysUntil(item.milestone.date);
              return (
                <Link key={i} to={`/transactions/${item.tx.id}`}
                  className="flex items-center justify-between bg-white/5 hover:bg-white/10 rounded-lg px-3 py-2 text-sm transition">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${d !== null && d <= 2 ? 'bg-red-400' : 'bg-yellow-400'}`} />
                    <span className="text-white/80">{item.milestone.label}</span>
                    <span className="text-white/40">— {item.tx.property}</span>
                  </div>
                  <span className="text-white/50">{d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : `${d}d`}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Search + Filters + Sort */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search transactions..."
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-400 transition" />
        </div>
        <div className="flex gap-2">
          {['All', 'Active', 'Pending', 'Closed'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 md:px-4 py-2 rounded-full text-xs md:text-sm transition whitespace-nowrap ${filter === f ? 'bg-brand-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>
              {f}
            </button>
          ))}
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as SortKey)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
          <option value="closing">Sort: Closing Date</option>
          <option value="date">Sort: Contract Date</option>
          <option value="price">Sort: Price</option>
          <option value="property">Sort: Property</option>
        </select>
      </div>

      {/* Transaction Cards */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <EmptyState
            icon={<FileText size={48} />}
            title={search ? 'No matching transactions' : 'No transactions yet'}
            description={search ? 'Try a different search term' : 'Upload a contract to get started with AI-powered parsing'}
            action={!search ? <Link to="/upload" className="btn-brand inline-flex items-center gap-2"><Plus size={16} /> Upload Contract</Link> : undefined}
          />
        )}
        {filtered.map(tx => {
          const days = daysUntil(tx.closing_date);
          const completedMs = tx.milestones?.filter(m => m.completed).length || 0;
          const totalMs = tx.milestones?.length || 0;
          const progress = totalMs > 0 ? Math.round((completedMs / totalMs) * 100) : 0;
          const urgent = days !== null && days >= 0 && days <= 7;

          return (
            <Link key={tx.id} to={`/transactions/${tx.id}`} className="glass glass-hover p-4 md:p-5 flex items-center justify-between group block">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 md:gap-3 mb-1 flex-wrap">
                  <h3 className="font-semibold text-base md:text-lg truncate">{tx.property}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[tx.status] || 'bg-white/10 text-white/60'}`}>{tx.status}</span>
                  {urgent && <span className="flex items-center gap-1 text-xs text-orange-400"><AlertTriangle size={12} /> {days}d</span>}
                </div>
                <div className="text-sm text-white/50 truncate">{tx.address}, {tx.city}, {tx.state}</div>
                <div className="flex items-center gap-3 md:gap-4 mt-2 text-xs md:text-sm text-white/40 flex-wrap">
                  <span>{formatCurrency(tx.price)}</span>
                  <span>Closing: {formatDate(tx.closing_date)}</span>
                  <span>{completedMs}/{totalMs} milestones</span>
                </div>
                {totalMs > 0 && (
                  <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden w-48 max-w-full">
                    <div className="h-full bg-brand-400 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                  </div>
                )}
              </div>
              <ChevronRight size={20} className="text-white/30 group-hover:text-white/60 transition flex-shrink-0 ml-2" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
