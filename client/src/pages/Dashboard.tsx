import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { usePageTitle } from '../lib/usePageTitle';
import { formatCurrency, formatDate, daysUntil } from '../lib/utils';
import { Home, Calendar, DollarSign, Clock, ChevronRight, AlertTriangle, Search, ArrowUpDown, CalendarClock, FileText, Plus, Upload, X, PenLine } from 'lucide-react';
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
  usePageTitle('Dashboard');
  const navigate = useNavigate();
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('closing');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ property: '', address: '', city: '', state: '', county: '', price: '', contract_type: 'Purchase', contract_date: '', closing_date: '' });
  const [createError, setCreateError] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.property.trim()) { setCreateError('Property name is required'); return; }
    if (!form.address.trim()) { setCreateError('Address is required'); return; }
    setCreating(true);
    setCreateError('');
    try {
      const tx = await api.post('/transactions', { ...form, price: form.price ? Number(form.price) : 0 });
      if (tx && tx.id) {
        navigate(`/transactions/${tx.id}`);
      } else {
        setCreateError('Transaction created but failed to load. Check dashboard.');
        setShowCreate(false);
      }
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create transaction');
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    api.get('/transactions')
      .then(setTxs)
      .catch((e: any) => setError(e.message || 'Failed to load transactions'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = filter === 'All' ? txs : txs.filter(t => t.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.property.toLowerCase().includes(q) ||
        t.address.toLowerCase().includes(q) ||
        t.city.toLowerCase().includes(q) ||
        t.state.toLowerCase().includes(q) ||
        (t.parties || []).some((p: any) => p.name?.toLowerCase().includes(q))
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

  if (error) return (
    <div className="max-w-6xl mx-auto p-6">
      <EmptyState icon={<AlertTriangle size={48} />} title="Error loading transactions" description={error}
        action={<button onClick={() => window.location.reload()} className="btn-brand text-sm">Retry</button>} />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-bold">Transactions</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white transition focus:outline-none focus:ring-2 focus:ring-brand-400" aria-label="Create transaction manually">
            <PenLine size={16} /> <span className="hidden sm:inline">Create Manually</span><span className="sm:hidden">Create</span>
          </button>
          <Link to="/upload" className="btn-brand flex items-center gap-2 text-sm" aria-label="Upload contract">
            <Upload size={16} /> <span className="hidden sm:inline">Upload Contract</span><span className="sm:hidden">Upload</span>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: 'Active', value: stats.active, icon: <Home size={20} />, color: 'text-blue-400', filterKey: 'Active' },
          { label: 'Pending', value: stats.pending, icon: <Clock size={20} />, color: 'text-yellow-400', filterKey: 'Pending' },
          { label: 'Closed', value: stats.closed, icon: <Calendar size={20} />, color: 'text-green-400', filterKey: 'Closed' },
          { label: 'Total Value', value: formatCurrency(stats.totalValue), icon: <DollarSign size={20} />, color: 'text-brand-400', filterKey: '' },
        ].map((s, i) => (
          <button key={i} onClick={() => s.filterKey && setFilter(f => f === s.filterKey ? 'All' : s.filterKey)}
            className={`glass p-4 text-left transition-all hover:bg-white/10 ${s.filterKey && filter === s.filterKey ? 'ring-1 ring-brand-400/50' : ''}`}>
            <div className={`${s.color} mb-2`}>{s.icon}</div>
            <div className="text-xl md:text-2xl font-bold">{s.value}</div>
            <div className="text-white/50 text-sm">{s.label}</div>
          </button>
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
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${d !== null && d <= 2 ? 'bg-red-400' : 'bg-yellow-400'}`} />
                    <span className="text-white/80 truncate">{item.milestone.label}</span>
                    <span className="text-white/40 truncate hidden sm:inline">— {item.tx.property}</span>
                  </div>
                  <span className="text-white/50 flex-shrink-0 ml-2">{d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : `${d}d`}</span>
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
            placeholder="Search property, address, city, or party name..."
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 transition"
            aria-label="Search transactions" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {['All', 'Active', 'Pending', 'Closed'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 md:px-4 py-2 rounded-full text-xs md:text-sm transition whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-brand-400 ${filter === f ? 'bg-brand-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}>
              {f}{f !== 'All' && ` (${f === 'Active' ? stats.active : f === 'Pending' ? stats.pending : stats.closed})`}
            </button>
          ))}
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as SortKey)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-400"
          aria-label="Sort transactions">
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
            description={search ? 'Try a different search term or clear the filter' : 'Upload a contract to get started with AI-powered parsing'}
            action={!search ? <div className="flex flex-col sm:flex-row items-center gap-3"><button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white transition text-sm"><PenLine size={16} /> Create Manually</button><Link to="/upload" className="btn-brand inline-flex items-center gap-2"><Upload size={16} /> Upload Contract</Link></div> : undefined}
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
                <div className="text-sm text-white/50 truncate">{tx.address}{tx.city ? `, ${tx.city}` : ''}{tx.state ? `, ${tx.state}` : ''}</div>
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

      {/* Create Transaction Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowCreate(false)}>
          <div className="glass w-full max-w-lg p-6 space-y-5 animate-slide-in max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Create Transaction</h2>
              <button onClick={() => setShowCreate(false)} className="text-white/40 hover:text-white transition" aria-label="Close modal"><X size={20} /></button>
            </div>
            {createError && <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{createError}</div>}
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-1">Property Name *</label>
                <input value={form.property} onChange={e => setForm(f => ({ ...f, property: e.target.value }))} placeholder="e.g. 123 Main St" autoFocus
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-brand-400 transition" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-white/60 mb-1">Address *</label>
                  <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="123 Main Street"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-brand-400 transition" />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">City</label>
                  <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-brand-400 transition" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-white/60 mb-1">State</label>
                  <input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} placeholder="CT" maxLength={2}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-brand-400 transition" />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">County</label>
                  <input value={form.county} onChange={e => setForm(f => ({ ...f, county: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-brand-400 transition" />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1">Type</label>
                  <select value={form.contract_type} onChange={e => setForm(f => ({ ...f, contract_type: e.target.value }))} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-400 transition">
                    <option value="Purchase">Purchase</option>
                    <option value="Sale">Sale</option>
                    <option value="Lease">Lease</option>
                    <option value="Rental">Rental</option>
                  </select>
                </div>
              </div>
              <button type="submit" disabled={creating} className="w-full btn-brand py-2.5 text-sm font-medium disabled:opacity-50">
                {creating ? 'Creating...' : 'Create Transaction'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
