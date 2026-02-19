import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { formatCurrency, formatDate, daysUntil } from '../lib/utils';
import { useToast } from '../components/Toast';
import { DetailSkeleton, EmptyState } from '../components/Skeleton';
import { CHECKLIST_TEMPLATES } from '../lib/templates';
import {
  ArrowLeft, MapPin, DollarSign, Calendar, Users, FileText, AlertTriangle, Wrench,
  CheckCircle, Circle, Upload, Download, Trash2, Send, X, MessageSquare, Clock,
  Plus, Edit3, Save, ChevronDown, ChevronRight, ListChecks, FolderOpen, Share2, Copy, Check, FileDown, MousePointerClick
} from 'lucide-react';

function formatBytes(bytes: number) {
  if (!bytes) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

const DOC_CATEGORIES = ['Contracts', 'Disclosures', 'Inspections', 'Financing', 'Title', 'Closing', 'Other'];

const ACTION_LABELS: Record<string, string> = {
  contract_parsed: '📄 Contract Parsed',
  document_uploaded: '📎 Document Uploaded',
  document_signed: '✍️ Document Signed',
  milestone_completed: '✅ Milestone Completed',
  milestone_uncompleted: '⏪ Milestone Uncompleted',
  note_added: '💬 Note Added',
  party_added: '👤 Party Added',
  milestone_added: '📌 Milestone Added',
  template_applied: '📋 Template Applied',
};

export default function TransactionDetail() {
  const { id } = useParams();
  const { success, error: showError } = useToast();
  const [tx, setTx] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [sigModal, setSigModal] = useState<any>(null);
  const [signers, setSigners] = useState([{ name: '', email: '' }]);
  const [signatures, setSignatures] = useState<Record<number, any[]>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  // Activity log
  const [activity, setActivity] = useState<any[]>([]);
  const [showActivity, setShowActivity] = useState(false);

  // Notes
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [showNotes, setShowNotes] = useState(true);

  // Inline editing
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});

  // Add party/milestone
  const [addPartyModal, setAddPartyModal] = useState(false);
  const [newParty, setNewParty] = useState({ role: 'Buyer', name: '', email: '', phone: '', firm: '' });
  const [addMilestoneModal, setAddMilestoneModal] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ label: '', date: '', category: 'Contract' });

  // Template
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // Commission
  const [commRate, setCommRate] = useState('');
  const [commSplit, setCommSplit] = useState('');
  const [savingComm, setSavingComm] = useState(false);

  // Document category grouping
  const [groupByCategory, setGroupByCategory] = useState(false);

  // Share portal
  const [shareLoading, setShareLoading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const reload = useCallback(async () => {
    const data = await api.get(`/transactions/${id}`);
    setTx(data);
    setCommRate(data.commission_rate != null ? String(data.commission_rate) : '');
    setCommSplit(data.commission_split || '');
    return data;
  }, [id]);

  useEffect(() => { reload().finally(() => setLoading(false)); }, [reload]);

  // Load signatures
  useEffect(() => {
    if (!tx?.documents) return;
    tx.documents.forEach((d: any) => {
      api.get(`/documents/${d.id}/signatures`).then(sigs => {
        setSignatures(prev => ({ ...prev, [d.id]: sigs }));
      }).catch(() => {});
    });
  }, [tx?.documents]);

  // Load activity + notes
  useEffect(() => {
    if (!id) return;
    api.get(`/transactions/${id}/activity`).then(setActivity).catch(() => {});
    api.get(`/transactions/${id}/notes`).then(setNotes).catch(() => {});
  }, [id]);

  const toggleMilestone = async (msId: number) => {
    await api.patch(`/transactions/milestones/${msId}/toggle`);
    await reload();
    api.get(`/transactions/${id}/activity`).then(setActivity).catch(() => {});
  };

  const updateDocStatus = async (docId: number, status: string) => {
    await api.patch(`/transactions/documents/${docId}`, { status });
    reload();
  };

  const updateDocCategory = async (docId: number, category: string) => {
    await api.patch(`/transactions/documents/${docId}`, { category });
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
      api.get(`/transactions/${id}/activity`).then(setActivity).catch(() => {});
      success(`${files.length} file${files.length > 1 ? 's' : ''} uploaded`);
    } catch (e: any) {
      showError(e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: number) => {
    if (!confirm('Delete this document?')) return;
    await api.delete(`/documents/${docId}`);
    reload();
    success('Document deleted');
  };

  const handleDownload = (docId: number) => {
    const token = localStorage.getItem('token');
    window.open(`/api/documents/${docId}/download?token=${token}`, '_blank');
  };

  const sendForSignature = async () => {
    if (!sigModal) return;
    const validSigners = signers.filter(s => s.name && s.email);
    if (!validSigners.length) return showError('Add at least one signer');
    try {
      const res = await api.post(`/documents/${sigModal.docId}/send-for-signature`, { signers: validSigners });
      const links = res.signatures.map((s: any) => `${s.signer_name}: ${window.location.origin}/sign/${s.token}`).join('\n');
      navigator.clipboard?.writeText(links);
      success('Signature requests created! Links copied to clipboard.');
      setSigModal(null);
      setSigners([{ name: '', email: '' }]);
      reload();
    } catch (e: any) {
      showError(e.message);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  const startEditing = () => {
    setEditData({
      property: tx.property, address: tx.address, city: tx.city, state: tx.state,
      county: tx.county, price: tx.price, status: tx.status,
      contract_date: tx.contract_date, closing_date: tx.closing_date, contract_type: tx.contract_type,
    });
    setEditing(true);
  };

  const saveEdit = async () => {
    try {
      await api.put(`/transactions/${id}`, editData);
      await reload();
      setEditing(false);
      success('Transaction updated');
    } catch (e: any) { showError(e.message); }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    try {
      const note = await api.post(`/transactions/${id}/notes`, { content: newNote });
      setNotes(prev => [note, ...prev]);
      setNewNote('');
      api.get(`/transactions/${id}/activity`).then(setActivity).catch(() => {});
    } catch (e: any) { showError(e.message); }
  };

  const shareWithClient = async () => {
    setShareLoading(true);
    try {
      const res = await api.post(`/transactions/${id}/share`, { label: 'Client Portal' });
      const url = `${window.location.origin}${res.url}`;
      await navigator.clipboard?.writeText(url);
      setShareCopied(true);
      success('Portal link copied to clipboard!');
      setTimeout(() => setShareCopied(false), 3000);
    } catch (e: any) {
      showError(e.message);
    } finally {
      setShareLoading(false);
    }
  };

  const deleteNote = async (noteId: number) => {
    await api.delete(`/notes/${noteId}`);
    setNotes(prev => prev.filter(n => n.id !== noteId));
  };

  const addParty = async () => {
    if (!newParty.name) return showError('Name is required');
    try {
      await api.post(`/transactions/${id}/parties`, newParty);
      await reload();
      setAddPartyModal(false);
      setNewParty({ role: 'Buyer', name: '', email: '', phone: '', firm: '' });
      success('Party added');
    } catch (e: any) { showError(e.message); }
  };

  const deleteParty = async (partyId: number) => {
    if (!confirm('Remove this party?')) return;
    await api.delete(`/transactions/parties/${partyId}`);
    reload();
  };

  const addMilestoneHandler = async () => {
    if (!newMilestone.label) return showError('Label is required');
    try {
      await api.post(`/transactions/${id}/milestones`, newMilestone);
      await reload();
      setAddMilestoneModal(false);
      setNewMilestone({ label: '', date: '', category: 'Contract' });
      success('Milestone added');
    } catch (e: any) { showError(e.message); }
  };

  const deleteMilestone = async (msId: number) => {
    if (!confirm('Remove this milestone?')) return;
    await api.delete(`/transactions/milestones/${msId}`);
    reload();
  };

  const applyTemplate = async (template: typeof CHECKLIST_TEMPLATES[0]) => {
    try {
      await api.post(`/transactions/${id}/apply-template`, {
        milestones: template.milestones,
        documents: template.documents,
      });
      await reload();
      setShowTemplateModal(false);
      success(`Applied "${template.name}" template`);
      api.get(`/transactions/${id}/activity`).then(setActivity).catch(() => {});
    } catch (e: any) { showError(e.message); }
  };

  if (loading) return <DetailSkeleton />;
  if (!tx) return (
    <EmptyState icon={<FileText size={48} />} title="Transaction not found" description="This transaction may have been deleted." />
  );

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

  // Group documents by category
  const docsByCategory: Record<string, any[]> = {};
  if (groupByCategory) {
    for (const d of (tx.documents || [])) {
      const cat = d.category || 'Uncategorized';
      if (!docsByCategory[cat]) docsByCategory[cat] = [];
      docsByCategory[cat].push(d);
    }
  }

  const renderDoc = (d: any) => {
    const docSigs = signatures[d.id] || [];
    return (
      <div key={d.id} className="bg-white/5 rounded-lg p-3 text-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <FileText size={16} className="text-white/40 flex-shrink-0" />
            <div className="min-w-0">
              <div className="truncate">{d.name}</div>
              <div className="text-white/30 text-xs">
                {d.file_size ? formatBytes(d.file_size) : 'No file'}{d.uploaded_at ? ` · ${formatDate(d.uploaded_at)}` : ''}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
            <select value={d.category || ''} onChange={e => updateDocCategory(d.id, e.target.value)}
              className="bg-white/10 border border-white/10 rounded px-1.5 py-1 text-xs text-white focus:outline-none max-w-[80px]">
              <option value="">No category</option>
              {DOC_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={d.status} onChange={e => updateDocStatus(d.id, e.target.value)}
              className="bg-white/10 border border-white/10 rounded px-1.5 py-1 text-xs text-white focus:outline-none">
              <option value="Pending">Pending</option>
              <option value="Received">Received</option>
              <option value="Missing">Missing</option>
            </select>
            {d.file_path && (
              <button onClick={() => handleDownload(d.id)} className="p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-white transition" title="Download">
                <Download size={14} />
              </button>
            )}
            {d.file_path && (
              <Link to={`/documents/${d.id}/prepare`}
                className="p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-accent-400 transition" title="Prepare for Signing">
                <MousePointerClick size={14} />
              </Link>
            )}
            <button onClick={() => { setSigModal({ docId: d.id, docName: d.name }); setSigners([{ name: '', email: '' }]); }}
              className="p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-brand-400 transition" title="Send for Signature">
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
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <Link to="/dashboard" className="flex items-center gap-2 text-white/50 hover:text-white transition text-sm">
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      {/* Header */}
      <div className="glass p-4 md:p-6">
        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input value={editData.property} onChange={e => setEditData({...editData, property: e.target.value})}
                className="bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-400" placeholder="Property" />
              <input value={editData.address} onChange={e => setEditData({...editData, address: e.target.value})}
                className="bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-400" placeholder="Address" />
              <input value={editData.city} onChange={e => setEditData({...editData, city: e.target.value})}
                className="bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-400" placeholder="City" />
              <input value={editData.state} onChange={e => setEditData({...editData, state: e.target.value})}
                className="bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-400" placeholder="State" />
              <input type="number" value={editData.price} onChange={e => setEditData({...editData, price: +e.target.value})}
                className="bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-400" placeholder="Price" />
              <select value={editData.status} onChange={e => setEditData({...editData, status: e.target.value})}
                className="bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Closed">Closed</option>
              </select>
              <input type="date" value={editData.contract_date || ''} onChange={e => setEditData({...editData, contract_date: e.target.value})}
                className="bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-400" />
              <input type="date" value={editData.closing_date || ''} onChange={e => setEditData({...editData, closing_date: e.target.value})}
                className="bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-400" />
            </div>
            <div className="flex gap-2">
              <button onClick={saveEdit} className="btn-brand flex items-center gap-2 text-sm"><Save size={14} /> Save</button>
              <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm text-white/60 hover:text-white transition">Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl md:text-3xl font-bold">{tx.property}</h1>
                  <button onClick={startEditing} className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-white transition" title="Edit">
                    <Edit3 size={16} />
                  </button>
                  <button onClick={shareWithClient} disabled={shareLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-500/20 text-accent-400 hover:bg-accent-500/30 transition text-xs font-medium" title="Share with client">
                    {shareCopied ? <Check size={14} /> : <Share2 size={14} />}
                    {shareCopied ? 'Copied!' : 'Share with Client'}
                  </button>
                  <button onClick={() => {
                    const token = localStorage.getItem('token');
                    window.open(`/api/transactions/${id}/export-pdf?token=${token}`, '_blank');
                  }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 transition text-xs font-medium" title="Export PDF">
                    <FileDown size={14} /> Export PDF
                  </button>
                </div>
                <div className="flex items-center gap-2 text-white/60 mt-1"><MapPin size={16} /> {tx.address}, {tx.city}, {tx.state}</div>
              </div>
              <div className="text-right">
                <div className="text-xl md:text-2xl font-bold text-brand-400">{formatCurrency(tx.price)}</div>
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
              <div className="h-full bg-brand-400 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Milestones */}
        <div className="glass p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg flex items-center gap-2"><Calendar size={20} /> Milestones</h2>
            <div className="flex gap-1">
              <button onClick={() => setShowTemplateModal(true)} className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-brand-400 transition" title="Apply template">
                <ListChecks size={16} />
              </button>
              <button onClick={() => setAddMilestoneModal(true)} className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-accent-400 transition" title="Add milestone">
                <Plus size={16} />
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {(tx.milestones || []).length === 0 && (
              <div className="text-white/30 text-sm text-center py-6">No milestones — add one or apply a template</div>
            )}
            {(tx.milestones || []).map((m: any) => (
              <div key={m.id} className="flex items-center gap-3 bg-white/5 rounded-lg p-3 text-sm group">
                <button onClick={() => toggleMilestone(m.id)} className="flex-shrink-0">
                  {m.completed ? <CheckCircle size={18} className="text-accent-400" /> : <Circle size={18} className="text-white/30 hover:text-white/60 transition" />}
                </button>
                <span className={`flex-1 ${m.completed ? 'line-through text-white/40' : ''}`}>{m.label}</span>
                <span className="text-white/40 text-xs">{formatDate(m.date)}</span>
                {m.category && <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[m.category] || 'bg-white/10 text-white/50'}`}>{m.category}</span>}
                <button onClick={() => deleteMilestone(m.id)} className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Parties */}
        <div className="glass p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg flex items-center gap-2"><Users size={20} /> Parties</h2>
            <button onClick={() => setAddPartyModal(true)} className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-accent-400 transition" title="Add party">
              <Plus size={16} />
            </button>
          </div>
          <div className="space-y-2">
            {(tx.parties || []).length === 0 && <div className="text-white/30 text-sm text-center py-6">No parties added yet</div>}
            {(tx.parties || []).map((p: any) => (
              <div key={p.id} className="bg-white/5 rounded-lg p-3 text-sm group">
                <div className="flex justify-between">
                  <span><span className="text-brand-400 font-medium">{p.role}</span> — {p.name}</span>
                  <div className="flex items-center gap-2">
                    {p.firm && <span className="text-white/40">{p.firm}</span>}
                    <button onClick={() => deleteParty(p.id)} className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <div className="text-white/40 text-xs mt-1">{[p.email, p.phone].filter(Boolean).join(' · ') || 'No contact info'}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Documents */}
        <div className="glass p-4 md:p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg flex items-center gap-2"><FileText size={20} /> Documents</h2>
            <button onClick={() => setGroupByCategory(!groupByCategory)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition ${groupByCategory ? 'bg-brand-500/20 text-brand-300' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}>
              <FolderOpen size={12} /> {groupByCategory ? 'Grouped' : 'Group by category'}
            </button>
          </div>

          {/* Upload area */}
          <div
            className={`border-2 border-dashed rounded-lg p-4 md:p-6 text-center mb-4 transition cursor-pointer ${dragOver ? 'border-brand-400 bg-brand-400/10' : 'border-white/20 hover:border-white/40'}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={24} className="mx-auto mb-2 text-white/40" />
            <p className="text-white/50 text-sm">{uploading ? 'Uploading...' : 'Drag & drop files or click to upload'}</p>
            <input ref={fileRef} type="file" multiple className="hidden" onChange={e => handleUpload(e.target.files)} />
          </div>

          {groupByCategory ? (
            <div className="space-y-4">
              {Object.entries(docsByCategory).map(([cat, docs]) => (
                <div key={cat}>
                  <h3 className="text-sm font-medium text-white/60 mb-2 flex items-center gap-2">
                    <FolderOpen size={14} /> {cat} <span className="text-white/30">({docs.length})</span>
                  </h3>
                  <div className="space-y-2">{docs.map(renderDoc)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">{(tx.documents || []).map(renderDoc)}</div>
          )}
          {(tx.documents || []).length === 0 && <div className="text-white/30 text-sm text-center py-4">No documents yet</div>}
        </div>

        {/* Notes */}
        <div className="glass p-4 md:p-6">
          <button onClick={() => setShowNotes(!showNotes)} className="flex items-center justify-between w-full mb-4">
            <h2 className="font-semibold text-lg flex items-center gap-2"><MessageSquare size={20} /> Notes ({notes.length})</h2>
            {showNotes ? <ChevronDown size={16} className="text-white/40" /> : <ChevronRight size={16} className="text-white/40" />}
          </button>
          {showNotes && (
            <>
              <div className="flex gap-2 mb-3">
                <input value={newNote} onChange={e => setNewNote(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addNote()}
                  placeholder="Add a note..."
                  className="flex-1 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-400 transition" />
                <button onClick={addNote} disabled={!newNote.trim()} className="btn-brand py-2 px-4 text-sm disabled:opacity-40">Add</button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {notes.length === 0 && <div className="text-white/30 text-sm text-center py-4">No notes yet</div>}
                {notes.map((n: any) => (
                  <div key={n.id} className="bg-white/5 rounded-lg p-3 text-sm group">
                    <div className="flex items-start justify-between">
                      <p className="text-white/80 whitespace-pre-wrap">{n.content}</p>
                      <button onClick={() => deleteNote(n.id)} className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition ml-2 flex-shrink-0">
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <div className="text-white/30 text-xs mt-1.5">{n.user_name} · {n.created_at ? new Date(n.created_at).toLocaleString() : ''}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Activity Log */}
        <div className="glass p-4 md:p-6">
          <button onClick={() => setShowActivity(!showActivity)} className="flex items-center justify-between w-full mb-4">
            <h2 className="font-semibold text-lg flex items-center gap-2"><Clock size={20} /> Activity ({activity.length})</h2>
            {showActivity ? <ChevronDown size={16} className="text-white/40" /> : <ChevronRight size={16} className="text-white/40" />}
          </button>
          {showActivity && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {activity.length === 0 && <div className="text-white/30 text-sm text-center py-4">No activity yet</div>}
              {activity.map((a: any) => (
                <div key={a.id} className="flex items-start gap-3 bg-white/5 rounded-lg p-3 text-sm">
                  <div className="flex-1">
                    <div className="text-white/70">{ACTION_LABELS[a.action] || a.action}</div>
                    {a.detail && <div className="text-white/40 text-xs mt-0.5">{a.detail}</div>}
                  </div>
                  <span className="text-white/30 text-xs whitespace-nowrap">{a.created_at ? new Date(a.created_at).toLocaleString() : ''}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Commission */}
        <div className="glass p-4 md:p-6">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2"><DollarSign size={20} /> Commission</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-white/40 text-xs block mb-1">Rate (%)</label>
              <input type="number" step="0.1" min="0" max="100" value={commRate}
                onChange={e => setCommRate(e.target.value)}
                className="w-full bg-white/10 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-400"
                placeholder="2.5" />
            </div>
            <div>
              <label className="text-white/40 text-xs block mb-1">Commission Amount</label>
              <div className="bg-white/5 rounded px-3 py-2 text-sm text-brand-400 font-semibold">
                {commRate && tx.price ? formatCurrency(tx.price * parseFloat(commRate) / 100) : '—'}
              </div>
            </div>
            <div>
              <label className="text-white/40 text-xs block mb-1">Split</label>
              <input type="text" value={commSplit} onChange={e => setCommSplit(e.target.value)}
                className="w-full bg-white/10 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-400"
                placeholder="50/50 with brokerage" />
            </div>
            <div>
              <label className="text-white/40 text-xs block mb-1">Net After Split</label>
              <div className="bg-white/5 rounded px-3 py-2 text-sm text-emerald-400 font-semibold">
                {commRate && tx.price && commSplit ? (() => {
                  const gross = tx.price * parseFloat(commRate) / 100;
                  const match = commSplit.match(/(\d+)\s*\/\s*(\d+)/);
                  if (match) return formatCurrency(gross * parseInt(match[1]) / (parseInt(match[1]) + parseInt(match[2])));
                  return formatCurrency(gross);
                })() : '—'}
              </div>
            </div>
          </div>
          <button
            onClick={async () => {
              setSavingComm(true);
              try {
                await api.patch(`/transactions/${tx.id}/commission`, { commission_rate: commRate || null, commission_split: commSplit || null });
                success('Commission saved');
              } catch (e: any) { showError(e.message); }
              setSavingComm(false);
            }}
            className="mt-3 bg-brand-500/20 text-brand-300 hover:bg-brand-500/30 px-4 py-1.5 rounded text-sm transition"
            disabled={savingComm}
          >
            {savingComm ? 'Saving...' : 'Save Commission'}
          </button>
        </div>

        {/* Contingencies */}
        {tx.contingencies?.length > 0 && (
          <div className="glass p-4 md:p-6">
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
          <div className="glass p-4 md:p-6">
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

      {/* Modals */}

      {/* Signature Modal */}
      {sigModal && (
        <Modal onClose={() => setSigModal(null)}>
          <h3 className="font-semibold text-lg">Send for Signature</h3>
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
        </Modal>
      )}

      {/* Add Party Modal */}
      {addPartyModal && (
        <Modal onClose={() => setAddPartyModal(false)}>
          <h3 className="font-semibold text-lg">Add Party</h3>
          <select value={newParty.role} onChange={e => setNewParty({...newParty, role: e.target.value})}
            className="w-full bg-white/10 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none">
            {['Buyer', 'Seller', 'Listing Agent', 'Buyer Agent', 'Attorney', 'Lender', 'Title Company', 'Other'].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <input placeholder="Name *" value={newParty.name} onChange={e => setNewParty({...newParty, name: e.target.value})}
            className="w-full bg-white/10 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-400" />
          <input placeholder="Email" value={newParty.email} onChange={e => setNewParty({...newParty, email: e.target.value})}
            className="w-full bg-white/10 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-400" />
          <input placeholder="Phone" value={newParty.phone} onChange={e => setNewParty({...newParty, phone: e.target.value})}
            className="w-full bg-white/10 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-400" />
          <input placeholder="Firm" value={newParty.firm} onChange={e => setNewParty({...newParty, firm: e.target.value})}
            className="w-full bg-white/10 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-400" />
          <button onClick={addParty} className="w-full btn-brand">Add Party</button>
        </Modal>
      )}

      {/* Add Milestone Modal */}
      {addMilestoneModal && (
        <Modal onClose={() => setAddMilestoneModal(false)}>
          <h3 className="font-semibold text-lg">Add Milestone</h3>
          <input placeholder="Label *" value={newMilestone.label} onChange={e => setNewMilestone({...newMilestone, label: e.target.value})}
            className="w-full bg-white/10 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-400" />
          <input type="date" value={newMilestone.date} onChange={e => setNewMilestone({...newMilestone, date: e.target.value})}
            className="w-full bg-white/10 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-400" />
          <select value={newMilestone.category} onChange={e => setNewMilestone({...newMilestone, category: e.target.value})}
            className="w-full bg-white/10 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none">
            {['Contract', 'Inspection', 'Financing', 'Closing'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={addMilestoneHandler} className="w-full btn-brand">Add Milestone</button>
        </Modal>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <Modal onClose={() => setShowTemplateModal(false)}>
          <h3 className="font-semibold text-lg flex items-center gap-2"><ListChecks size={20} /> Apply Checklist Template</h3>
          <p className="text-white/50 text-sm">This will add milestones and document placeholders to this transaction.</p>
          <div className="space-y-2">
            {CHECKLIST_TEMPLATES.map((t, i) => (
              <button key={i} onClick={() => applyTemplate(t)}
                className="w-full text-left bg-white/5 hover:bg-white/10 rounded-lg p-4 transition">
                <div className="font-medium text-white">{t.name}</div>
                <div className="text-white/40 text-xs mt-1">{t.milestones.length} milestones · {t.documents.length} documents</div>
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="glass p-6 w-full max-w-md space-y-4 animate-slide-in" onClick={e => e.stopPropagation()}>
        <div className="flex justify-end">
          <button onClick={onClose} className="text-white/40 hover:text-white"><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
