import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Users, File, X } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

interface SearchResult {
  type: 'transaction' | 'party' | 'document';
  id: number;
  title: string;
  subtitle: string;
  transaction_id?: number;
}

export default function CommandPalette() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!user) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [user]);

  useEffect(() => {
    if (open) { inputRef.current?.focus(); setQuery(''); setResults([]); setSelected(0); }
  }, [open]);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const data = await api.get(`/search?q=${encodeURIComponent(q)}`);
      setResults(data.results || []);
      setSelected(0);
    } catch { setResults([]); }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  const handleSelect = (r: SearchResult) => {
    setOpen(false);
    const txId = r.type === 'transaction' ? r.id : r.transaction_id;
    if (txId) navigate(`/transactions/${txId}`);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && results[selected]) { handleSelect(results[selected]); }
  };

  if (!user || !open) return null;

  const icons = { transaction: <FileText size={16} />, party: <Users size={16} />, document: <File size={16} /> };
  const labels = { transaction: 'Transactions', party: 'Parties', document: 'Documents' };
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    (acc[r.type] = acc[r.type] || []).push(r);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh]" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-xl mx-4 glass rounded-2xl border border-white/15 shadow-2xl overflow-hidden animate-slide-in"
           onClick={e => e.stopPropagation()}>
        {/* Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
          <Search size={18} className="text-white/30 shrink-0" />
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={onKeyDown}
            className="flex-1 bg-transparent outline-none text-lg placeholder-white/25" placeholder="Search transactions, parties, documents..." />
          <kbd className="hidden sm:flex text-xs text-white/20 bg-white/5 px-2 py-1 rounded border border-white/10">ESC</kbd>
          <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white/60 sm:hidden"><X size={18} /></button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {loading && <div className="px-5 py-8 text-center text-white/30 text-sm">Searching...</div>}
          {!loading && query && results.length === 0 && (
            <div className="px-5 py-8 text-center text-white/30 text-sm">No results for "{query}"</div>
          )}
          {!loading && !query && (
            <div className="px-5 py-8 text-center text-white/20 text-sm">Start typing to search across all your data</div>
          )}
          {Object.entries(grouped).map(([type, items]) => (
            <div key={type}>
              <div className="px-5 py-2 text-xs text-white/30 uppercase tracking-wider font-medium flex items-center gap-2">
                {icons[type as keyof typeof icons]} {labels[type as keyof typeof labels]}
              </div>
              {items.map((r) => {
                const idx = results.indexOf(r);
                return (
                  <button key={`${r.type}-${r.id}`} onClick={() => handleSelect(r)}
                    className={`w-full px-5 py-3 flex items-center gap-3 text-left transition-colors ${
                      idx === selected ? 'bg-brand-500/20 text-white' : 'hover:bg-white/5 text-white/70'
                    }`}>
                    <span className="text-brand-400 shrink-0">{icons[r.type as keyof typeof icons]}</span>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{r.title}</p>
                      <p className="text-xs text-white/30 truncate">{r.subtitle}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-white/10 flex items-center gap-4 text-xs text-white/20">
          <span>↑↓ Navigate</span>
          <span>↵ Open</span>
          <span>ESC Close</span>
        </div>
      </div>
    </div>
  );
}
