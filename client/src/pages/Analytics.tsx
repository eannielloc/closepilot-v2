import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { usePageTitle } from '../lib/usePageTitle';
import { formatCurrency, formatDate, daysUntil } from '../lib/utils';
import { useToast } from '../components/Toast';
import { TrendingUp, DollarSign, Clock, Hash, Calendar, PieChart, BarChart3 } from 'lucide-react';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Analytics() {
  usePageTitle('Analytics');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { error: showError } = useToast();

  useEffect(() => {
    api.get('/analytics').then(setData).catch((e: any) => showError(e.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-white/5 rounded w-40" />
        <div className="grid grid-cols-4 gap-4">{Array(4).fill(0).map((_, i) => <div key={i} className="h-28 bg-white/5 rounded-xl" />)}</div>
        <div className="grid grid-cols-2 gap-4">{Array(2).fill(0).map((_, i) => <div key={i} className="h-64 bg-white/5 rounded-xl" />)}</div>
      </div>
    </div>
  );

  if (!data) return null;

  const { ytd, monthly, types, upcoming } = data;
  const maxVolume = Math.max(...monthly.map((m: any) => m.volume), 1);

  // Build full 12-month array
  const monthlyFull = MONTH_NAMES.map((name, i) => {
    const m = monthly.find((d: any) => parseInt(d.month) === i + 1);
    return { name, volume: m?.volume || 0, count: m?.count || 0 };
  });

  // Donut chart data
  const totalForDonut = (ytd.active_count || 0) + (ytd.closed_count || 0);
  const closedPct = totalForDonut > 0 ? (ytd.closed_count / totalForDonut) * 100 : 0;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-white/50 text-sm mt-1">{new Date().getFullYear()} Year-to-Date Performance</p>
        </div>
        <Link to="/dashboard" className="text-sm text-brand-400 hover:text-brand-300 transition">← Dashboard</Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard icon={<DollarSign size={20} />} label="Volume Closed" value={formatCurrency(ytd.closed_volume)} color="brand" />
        <StatCard icon={<Hash size={20} />} label="Deals Closed" value={String(ytd.closed_count)} color="emerald" />
        <StatCard icon={<Clock size={20} />} label="Avg Days to Close" value={ytd.avg_days_to_close ? `${ytd.avg_days_to_close}d` : '—'} color="amber" />
        <StatCard icon={<TrendingUp size={20} />} label="Commission Earned" value={formatCurrency(ytd.total_commission)} color="purple" />
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {/* Monthly Volume Chart */}
        <div className="md:col-span-2 glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-brand-400" />
            <h3 className="text-sm font-semibold">Monthly Volume</h3>
          </div>
          <div className="flex items-end gap-1 h-48">
            {monthlyFull.map((m, i) => {
              const height = maxVolume > 0 ? (m.volume / maxVolume) * 100 : 0;
              const currentMonth = new Date().getMonth();
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="relative w-full flex justify-center" style={{ height: '100%' }}>
                    <div className="absolute bottom-0 w-full max-w-[32px] mx-auto flex flex-col items-center">
                      {m.volume > 0 && (
                        <span className="text-[9px] text-white/40 mb-1 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                          {formatCurrency(m.volume)}
                        </span>
                      )}
                      <div
                        className={`w-full rounded-t-sm transition-all duration-500 ${i <= currentMonth ? (m.volume > 0 ? 'bg-gradient-to-t from-brand-600 to-brand-400' : 'bg-white/5') : 'bg-white/3'}`}
                        style={{ height: `${Math.max(height, 2)}%`, minHeight: '2px' }}
                      />
                    </div>
                  </div>
                  <span className={`text-[10px] ${i === currentMonth ? 'text-brand-400 font-semibold' : 'text-white/30'}`}>{m.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active vs Closed Donut */}
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieChart size={16} className="text-emerald-400" />
            <h3 className="text-sm font-semibold">Active vs Closed</h3>
          </div>
          <div className="flex flex-col items-center justify-center h-48">
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.91" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.91" fill="none" stroke="#10b981" strokeWidth="3"
                  strokeDasharray={`${closedPct} ${100 - closedPct}`} strokeLinecap="round"
                  className="transition-all duration-1000" />
                <circle cx="18" cy="18" r="15.91" fill="none" stroke="#6366f1" strokeWidth="3"
                  strokeDasharray={`${100 - closedPct} ${closedPct}`} strokeDashoffset={`-${closedPct}`} strokeLinecap="round"
                  className="transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold">{totalForDonut}</span>
                <span className="text-[10px] text-white/40">Total</span>
              </div>
            </div>
            <div className="flex gap-4 mt-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-white/60">Closed ({ytd.closed_count})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-brand-500" />
                <span className="text-white/60">Active ({ytd.active_count})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Type Breakdown */}
        <div className="glass rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4">Transaction Types</h3>
          <div className="space-y-3">
            {types.length === 0 && <p className="text-white/30 text-sm">No data yet</p>}
            {types.map((t: any, i: number) => {
              const colors = ['bg-brand-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500'];
              const totalVol = types.reduce((s: number, x: any) => s + (x.volume || 0), 0);
              const pct = totalVol > 0 ? ((t.volume || 0) / totalVol) * 100 : 0;
              return (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white/70">{t.type || 'Other'}</span>
                    <span className="text-white/50">{t.count} deals • {formatCurrency(t.volume || 0)}</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${colors[i % colors.length]} transition-all duration-700`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Closings */}
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={16} className="text-amber-400" />
            <h3 className="text-sm font-semibold">Upcoming Closings (30 days)</h3>
          </div>
          {upcoming.length === 0 && <p className="text-white/30 text-sm">No upcoming closings</p>}
          <div className="space-y-2">
            {upcoming.map((tx: any) => {
              const days = daysUntil(tx.closing_date);
              const urgent = days !== null && days < 7;
              return (
                <Link key={tx.id} to={`/transactions/${tx.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition">
                  <div>
                    <p className="text-sm font-medium">{tx.property}</p>
                    <p className="text-xs text-white/40">{formatCurrency(tx.price)} • {formatDate(tx.closing_date)}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${urgent ? 'bg-red-500/20 text-red-300' : 'bg-white/10 text-white/50'}`}>
                    {days}d
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    brand: 'from-brand-500/20 to-brand-600/5 text-brand-400',
    emerald: 'from-emerald-500/20 to-emerald-600/5 text-emerald-400',
    amber: 'from-amber-500/20 to-amber-600/5 text-amber-400',
    purple: 'from-purple-500/20 to-purple-600/5 text-purple-400',
  };
  return (
    <div className="glass rounded-xl p-4">
      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${colors[color]} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-[11px] text-white/40 uppercase tracking-wider">{label}</p>
      <p className="text-xl font-bold mt-0.5">{value}</p>
    </div>
  );
}
