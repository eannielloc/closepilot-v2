import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { formatDate, daysUntil } from '../lib/utils';
import { Bell, Calendar, AlertTriangle, Clock, ChevronRight } from 'lucide-react';

interface Reminder {
  id: string; transactionId: number; property: string; milestone: string;
  date: string; category: string; parties: any[]; status: string;
}

export default function Reminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get('/reminders').then(setReminders).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="flex justify-center p-20"><div className="animate-spin w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full" /></div>;

  const urgent = reminders.filter(r => { const d = daysUntil(r.date); return d !== null && d >= 0 && d <= 7; });
  const upcoming = reminders.filter(r => { const d = daysUntil(r.date); return d !== null && d > 7; });
  const overdue = reminders.filter(r => { const d = daysUntil(r.date); return d !== null && d < 0; });

  const ReminderCard = ({ r }: { r: Reminder }) => {
    const days = daysUntil(r.date);
    return (
      <Link to={`/transactions/${r.transactionId}`} className="glass glass-hover p-4 flex items-center justify-between block">
        <div>
          <div className="font-semibold">{r.milestone}</div>
          <div className="text-white/50 text-sm">{r.property} — {formatDate(r.date)}</div>
          {r.category && <span className="text-xs text-white/40 mt-1">{r.category}</span>}
        </div>
        <div className="flex items-center gap-3">
          {days !== null && (
            <span className={`text-sm font-medium ${days < 0 ? 'text-red-400' : days <= 3 ? 'text-orange-400' : days <= 7 ? 'text-yellow-400' : 'text-white/50'}`}>
              {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today' : `${days}d`}
            </span>
          )}
          <ChevronRight size={16} className="text-white/30" />
        </div>
      </Link>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-3"><Bell size={28} /> Reminders</h1>

      {reminders.length === 0 && <div className="text-white/40 text-center py-12">No upcoming deadlines 🎉</div>}

      {overdue.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-red-400 flex items-center gap-2 mb-3"><AlertTriangle size={18} /> Overdue ({overdue.length})</h2>
          <div className="space-y-2">{overdue.map(r => <ReminderCard key={r.id} r={r} />)}</div>
        </div>
      )}

      {urgent.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-orange-400 flex items-center gap-2 mb-3"><Clock size={18} /> This Week ({urgent.length})</h2>
          <div className="space-y-2">{urgent.map(r => <ReminderCard key={r.id} r={r} />)}</div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white/70 flex items-center gap-2 mb-3"><Calendar size={18} /> Upcoming ({upcoming.length})</h2>
          <div className="space-y-2">{upcoming.map(r => <ReminderCard key={r.id} r={r} />)}</div>
        </div>
      )}
    </div>
  );
}
