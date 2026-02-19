import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { formatCurrency, daysUntil } from '../lib/utils';
import { useToast } from '../components/Toast';
import { GripVertical, Calendar, ArrowRight } from 'lucide-react';

const STAGES = [
  { key: 'new', label: 'New', color: 'from-blue-500/20 to-blue-600/10', border: 'border-blue-500/30', badge: 'bg-blue-500/20 text-blue-300' },
  { key: 'under_contract', label: 'Under Contract', color: 'from-purple-500/20 to-purple-600/10', border: 'border-purple-500/30', badge: 'bg-purple-500/20 text-purple-300' },
  { key: 'inspection', label: 'Inspection', color: 'from-amber-500/20 to-amber-600/10', border: 'border-amber-500/30', badge: 'bg-amber-500/20 text-amber-300' },
  { key: 'financing', label: 'Financing', color: 'from-cyan-500/20 to-cyan-600/10', border: 'border-cyan-500/30', badge: 'bg-cyan-500/20 text-cyan-300' },
  { key: 'closing', label: 'Closing', color: 'from-orange-500/20 to-orange-600/10', border: 'border-orange-500/30', badge: 'bg-orange-500/20 text-orange-300' },
  { key: 'closed', label: 'Closed', color: 'from-emerald-500/20 to-emerald-600/10', border: 'border-emerald-500/30', badge: 'bg-emerald-500/20 text-emerald-300' },
];

function getProgress(tx: any) {
  if (!tx.milestones?.length) return 0;
  const done = tx.milestones.filter((m: any) => m.completed).length;
  return Math.round((done / tx.milestones.length) * 100);
}

export default function Pipeline() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { success, error: showError } = useToast();
  const dragItem = useRef<any>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const data = await api.get('/transactions');
      setTransactions(data);
    } catch (e: any) { showError(e.message); }
    setLoading(false);
  }

  async function updateStage(txId: number, stage: string) {
    try {
      await api.post(`/transactions/${txId}/stage`, { stage });
      setTransactions(prev => prev.map(t => t.id === txId ? { ...t, stage, status: stage === 'closed' ? 'Closed' : t.status } : t));
      success(`Moved to ${STAGES.find(s => s.key === stage)?.label}`);
    } catch (e: any) { showError(e.message); }
  }

  function handleDragStart(tx: any) {
    dragItem.current = tx;
  }

  function handleDragOver(e: React.DragEvent, stageKey: string) {
    e.preventDefault();
    setDragOver(stageKey);
  }

  function handleDrop(stageKey: string) {
    if (dragItem.current && dragItem.current.stage !== stageKey) {
      updateStage(dragItem.current.id, stageKey);
    }
    dragItem.current = null;
    setDragOver(null);
  }

  function getStageTransactions(stageKey: string) {
    return transactions.filter(t => {
      const stage = t.stage || 'new';
      return stage === stageKey;
    });
  }

  if (loading) return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-white/5 rounded w-48" />
        <div className="grid grid-cols-6 gap-4">
          {Array(6).fill(0).map((_, i) => <div key={i} className="h-96 bg-white/5 rounded-xl" />)}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Pipeline</h1>
          <p className="text-white/50 text-sm mt-1">{transactions.length} transactions • Drag to move between stages</p>
        </div>
        <Link to="/dashboard" className="text-sm text-brand-400 hover:text-brand-300 transition">← Back to Dashboard</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 overflow-x-auto">
        {STAGES.map(stage => {
          const items = getStageTransactions(stage.key);
          return (
            <div
              key={stage.key}
              className={`glass rounded-xl p-3 min-h-[400px] transition-all duration-200 ${dragOver === stage.key ? 'ring-2 ring-brand-400/50 scale-[1.02]' : ''}`}
              onDragOver={e => handleDragOver(e, stage.key)}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => handleDrop(stage.key)}
            >
              <div className={`flex items-center justify-between mb-3 pb-2 border-b ${stage.border}`}>
                <h3 className="text-sm font-semibold text-white/80">{stage.label}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${stage.badge}`}>{items.length}</span>
              </div>

              <div className="space-y-2">
                {items.map(tx => {
                  const days = daysUntil(tx.closing_date);
                  const progress = getProgress(tx);
                  const urgent = days !== null && days >= 0 && days < 7;
                  const overdue = days !== null && days < 0;

                  return (
                    <Link
                      key={tx.id}
                      to={`/transactions/${tx.id}`}
                      draggable
                      onDragStart={() => handleDragStart(tx)}
                      onDragEnd={() => { dragItem.current = null; setDragOver(null); }}
                      className={`block glass rounded-lg p-3 cursor-grab active:cursor-grabbing hover:bg-white/10 transition-all duration-200 hover:scale-[1.02] ${urgent ? 'ring-1 ring-red-500/50' : overdue ? 'ring-1 ring-red-700/50' : ''}`}
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical size={14} className="text-white/20 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{tx.property}</p>
                          <p className="text-xs text-brand-400 font-semibold mt-0.5">{formatCurrency(tx.price)}</p>

                          {days !== null && (
                            <div className={`flex items-center gap-1 mt-1.5 text-xs ${urgent ? 'text-red-400' : overdue ? 'text-red-500' : 'text-white/40'}`}>
                              <Calendar size={10} />
                              {overdue ? `${Math.abs(days)}d overdue` : `${days}d to close`}
                            </div>
                          )}

                          {/* Progress bar */}
                          <div className="mt-2">
                            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${progress === 100 ? 'bg-emerald-500' : progress > 50 ? 'bg-brand-400' : 'bg-white/30'}`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <p className="text-[10px] text-white/30 mt-0.5">{progress}%</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}

                {items.length === 0 && (
                  <div className="text-center py-8 text-white/20 text-xs">
                    Drop here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
