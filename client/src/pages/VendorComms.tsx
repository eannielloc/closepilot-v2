import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { usePageTitle } from '../lib/usePageTitle';
import { Users, Mail, Phone, ChevronRight, Building } from 'lucide-react';

export default function VendorComms() {
  usePageTitle('Vendors');
  const [txs, setTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    api.get('/transactions').then(data => {
      // Fetch full details for vendors
      Promise.all(data.map((t: any) => api.get(`/transactions/${t.id}`))).then(setTxs).finally(() => setLoading(false));
    });
  }, []);

  const allVendors = txs.flatMap(tx => (tx.vendors || []).map((v: any) => ({ ...v, property: tx.property, transactionId: tx.id, txStatus: tx.status })));
  const types = ['all', ...new Set(allVendors.map(v => v.type))];
  const filtered = filterType === 'all' ? allVendors : allVendors.filter(v => v.type === filterType);

  if (loading) return <div className="flex justify-center p-20"><div className="animate-spin w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full" /></div>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-3"><Users size={28} /> Vendor Communications</h1>

      <div className="flex gap-2 mb-6 flex-wrap">
        {types.map(t => (
          <button key={t} onClick={() => setFilterType(t)} className={`px-4 py-2 rounded-lg text-sm capitalize transition ${filterType === t ? 'bg-brand-500 text-white' : 'glass glass-hover text-white/60'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-2">
          {filtered.length === 0 && <div className="glass p-8 text-center text-white/30">No vendors found</div>}
          {filtered.map((v, i) => (
            <div key={`${v.id}-${i}`} onClick={() => setSelected(v)} className={`glass glass-hover p-4 cursor-pointer transition ${selected?.id === v.id && selected?.transactionId === v.transactionId ? 'border-brand-400' : ''}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">{v.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-accent-400/20 text-accent-400">{v.type}</span>
              </div>
              <div className="text-white/40 text-xs">{v.property}</div>
            </div>
          ))}
        </div>

        <div className="glass p-6">
          {selected ? (
            <div>
              <h2 className="text-xl font-bold mb-1">{selected.name}</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-accent-400/20 text-accent-400">{selected.type}</span>
              <div className="mt-4 space-y-3 text-sm">
                {selected.email && <div className="flex items-center gap-2 text-white/60"><Mail size={16} /> {selected.email}</div>}
                {selected.phone && <div className="flex items-center gap-2 text-white/60"><Phone size={16} /> {selected.phone}</div>}
                <div className="flex items-center gap-2 text-white/60"><Building size={16} /> {selected.property}</div>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-semibold text-white/60 mb-3">Draft Email</h3>
                <div className="bg-white/5 rounded-lg p-4 text-sm space-y-3">
                  <div><span className="text-white/40">To:</span> {selected.email || 'No email on file'}</div>
                  <div><span className="text-white/40">Subject:</span> Follow-up: {selected.property} — {selected.type} Services</div>
                  <hr className="border-white/10" />
                  <p>Hi {selected.name},</p>
                  <p>I wanted to follow up regarding the {selected.type.toLowerCase()} services for the property at <strong>{selected.property}</strong>.</p>
                  <p>Could you please provide an update on the current status? Let me know if you need any additional information.</p>
                  <p>Thank you,<br />ClosePilot</p>
                </div>
              </div>

              <Link to={`/transactions/${selected.transactionId}`} className="flex items-center gap-1 text-brand-400 text-sm mt-4 hover:underline">
                View Transaction <ChevronRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-white/20">
              <div className="text-center">
                <Mail size={48} className="mx-auto mb-3" />
                <p>Select a vendor to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
