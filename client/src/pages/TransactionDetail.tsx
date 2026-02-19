import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { formatCurrency, formatDate, daysUntil } from '../lib/utils';
import { ArrowLeft, MapPin, DollarSign, Calendar, Users, FileText, AlertTriangle, Wrench, CheckCircle, Circle, Upload, Download, Trash2, Send, X } from 'lucide-react';

function formatBytes(bytes: number) {
  if (!bytes) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function TransactionDetail() {
  const { id } = useParams();
  const [tx, setTx] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [sigModal, setSigModal] = useState<any>(null); // {docId, docName}
  const [signers, setSigners] = useState([{ name: '', email: '' }]);
  const [signatures, setSignatures] = useState<Record<number, any[]>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const reload = useCallback(() => api.get(`/transactions/${id}`).then(setTx), [id]);

  useEffect(() => { reload().finally(() => setLoading(false)); }, [reload]);

  // Load signatures for all documents
  useEffect(() => {
    if (!tx?.documents) return;
    tx.documents.forEach((d: any) => {
      api.get(`/documents/${d.id}/signatures`).then(sigs => {
        setSignatures(prev => ({ ...prev, [d.id]: sigs }));
      }).catch(() => {});
    });
  }, [tx?.documents]);

  const toggleMilestone = async (msId: number) => {
    await api.patch(`/transactions/milestones/${msId}/toggle`);
    reload();
  };

  const updateDocStatus = async (docId: number, status: string) => {
    await api.patch(`/transactions/documents/${docId}`, { status });
    reload();
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append('file', file);
        await api.post(`/transactions/${id}/documents/upload`, form);
      }
      await reload();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: number) => {
    if (!confirm('Delete this document?')) return;
    await api.delete(`/documents/${docId}`);
    reload();
  };

  const handleDownload = (docId: number) => {
    const token = localStorage.getItem('token');
    window.open(`/api/documents/${docId}/download?token=${token}`, '_blank');
  };

  const sendForSignature = async () => {
    if (!sigModal) return;
    const validSigners = signers.filter(s => s.name && s.email);
    if (!validSigners.length) return alert('Add at least one signer');
    try {
      const res = await api.post(`/documents/${sigModal.docId}/send-for-signature`, { signers: validSigners });
      // Show signing links
      const links = res.signatures.map((s: any) => `${s.signer_name}: ${window.location.origin}/sign/${s.token}`).join('\n');
      alert('Signature requests created!\n\nSigning links:\n' + links);
      setSigModal(null);
      setSigners([{ name: '', email: '' }]);
      reload();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
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

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-300',
    signed: 'bg-green-500/20 text-green-300',
    declined: 'bg-red-500/20 text-red-300',
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

        {/* Documents - Enhanced */}
        <div className="glass p-6 lg:col-span-2">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2"><FileText size={20} /> Documents</h2>

          {/* Upload area */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center mb-4 transition cursor-pointer ${dragOver ? 'border-brand-400 bg-brand-400/10' : 'border-white/20 hover:border-white/40'}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={24} className="mx-auto mb-2 text-white/40" />
            <p className="text-white/50 text-sm">{uploading ? 'Uploading...' : 'Drag & drop files or click to upload'}</p>
            <input ref={fileRef} type="file" multiple className="hidden" onChange={e => handleUpload(e.target.files)} />
          </div>

          <div className="space-y-2">
            {(tx.documents || []).map((d: any) => {
              const docSigs = signatures[d.id] || [];
              return (
                <div key={d.id} className="bg-white/5 rounded-lg p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText size={16} className="text-white/40 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="truncate">{d.name}</div>
                        <div className="text-white/30 text-xs">
                          {d.file_size ? formatBytes(d.file_size) : 'No file'}{d.uploaded_at ? ` · ${formatDate(d.uploaded_at)}` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <select value={d.status} onChange={e => updateDocStatus(d.id, e.target.value)}
                        className="bg-white/10 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none">
                        <option value="Pending">Pending</option>
                        <option value="Received">Received</option>
                        <option value="Missing">Missing</option>
                      </select>
                      {d.file_path && (
                        <button onClick={() => handleDownload(d.id)} className="p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-white transition" title="Download">
                          <Download size={14} />
                        </button>
                      )}
                      <button onClick={() => { setSigModal({ docId: d.id, docName: d.name }); setSigners([{ name: '', email: '' }]); }} className="p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-brand-400 transition" title="Send for Signature">
                        <Send size={14} />
                      </button>
                      <button onClick={() => handleDelete(d.id)} className="p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-red-400 transition" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  {docSigs.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {docSigs.map((s: any) => (
                        <span key={s.id} className={`text-xs px-2 py-0.5 rounded-full ${statusColors[s.status] || ''}`}>
                          {s.signer_name}: {s.status}{s.signed_at ? ` (${formatDate(s.signed_at)})` : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
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

      {/* Signature Modal */}
      {sigModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSigModal(null)}>
          <div className="glass p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Send for Signature</h3>
              <button onClick={() => setSigModal(null)} className="text-white/40 hover:text-white"><X size={20} /></button>
            </div>
            <p className="text-white/50 text-sm">Document: {sigModal.docName}</p>
            {signers.map((s, i) => (
              <div key={i} className="flex gap-2">
                <input placeholder="Name" value={s.name} onChange={e => { const n = [...signers]; n[i].name = e.target.value; setSigners(n); }}
                  className="flex-1 bg-white/10 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-400" />
                <input placeholder="Email" value={s.email} onChange={e => { const n = [...signers]; n[i].email = e.target.value; setSigners(n); }}
                  className="flex-1 bg-white/10 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-400" />
                {signers.length > 1 && (
                  <button onClick={() => setSigners(signers.filter((_, j) => j !== i))} className="text-white/30 hover:text-red-400"><X size={16} /></button>
                )}
              </div>
            ))}
            <button onClick={() => setSigners([...signers, { name: '', email: '' }])} className="text-brand-400 text-sm hover:underline">+ Add signer</button>
            <button onClick={sendForSignature} className="w-full bg-brand-400 hover:bg-brand-500 text-white font-medium py-2 rounded transition">
              Send Signature Requests
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
