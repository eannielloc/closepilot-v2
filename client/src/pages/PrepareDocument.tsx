import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useToast } from '../components/Toast';
import * as pdfjsLib from 'pdfjs-dist';
import {
  ArrowLeft, Save, Send, Plus, Trash2, X, GripVertical,
  PenTool, Type, Calendar, User, Mail, CheckSquare, MapPin, FileSignature,
  ZoomIn, ZoomOut, ChevronLeft, ChevronRight, MousePointerClick
} from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface DocumentField {
  id: string;
  field_type: string;
  label: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  required: number;
  assigned_to: string;
  font_size: number;
}

interface Signer {
  name: string;
  email: string;
  color: string;
}

const FIELD_TYPES = [
  { type: 'signature', label: 'Signature', icon: PenTool, defaultW: 25, defaultH: 6 },
  { type: 'initials', label: 'Initials', icon: FileSignature, defaultW: 12, defaultH: 5 },
  { type: 'date', label: 'Date', icon: Calendar, defaultW: 18, defaultH: 4 },
  { type: 'name', label: 'Full Name', icon: User, defaultW: 25, defaultH: 4 },
  { type: 'text', label: 'Text', icon: Type, defaultW: 25, defaultH: 4 },
  { type: 'address', label: 'Address', icon: MapPin, defaultW: 35, defaultH: 4 },
  { type: 'email', label: 'Email', icon: Mail, defaultW: 25, defaultH: 4 },
  { type: 'checkbox', label: 'Checkbox', icon: CheckSquare, defaultW: 4, defaultH: 4 },
];

const SIGNER_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

let fieldIdCounter = 0;

export default function PrepareDocument() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fields, setFields] = useState<DocumentField[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [signers, setSigners] = useState<Signer[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [pdfPages, setPdfPages] = useState<HTMLCanvasElement[]>([]);
  const [numPages, setNumPages] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState<{ fieldId: string; offsetX: number; offsetY: number } | null>(null);
  const [resizing, setResizing] = useState<{ fieldId: string; startX: number; startY: number; startW: number; startH: number } | null>(null);
  const pagesRef = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load document info and parties
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        // Get document info - find it from transactions
        const docFields = await api.get(`/documents/${id}/fields`);
        setFields(docFields.map((f: any) => ({ ...f, id: String(f.id) })));

        // Load PDF
        const pdfUrl = `/api/documents/${id}/download?token=${token}`;
        const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
        setNumPages(pdf.numPages);
        const canvases: HTMLCanvasElement[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d')!;
          await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
          canvases.push(canvas);
        }
        setPdfPages(canvases);
      } catch (e: any) {
        showError(e.message || 'Failed to load document');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Load transaction parties for signer selection
  useEffect(() => {
    (async () => {
      try {
        // We need to find the transaction for this document
        // Try fetching fields to confirm document exists, then get transaction info
        const res = await fetch(`/api/documents/${id}/download?token=${localStorage.getItem('token')}`, { method: 'HEAD' });
        // Get all transactions and find which one has this document
        const txs = await api.get('/transactions');
        for (const tx of txs) {
          const fullTx = await api.get(`/transactions/${tx.id}`);
          const docMatch = fullTx.documents?.find((d: any) => d.id === Number(id));
          if (docMatch) {
            setDoc({ ...docMatch, transaction_id: tx.id });
            setParties(fullTx.parties || []);
            break;
          }
        }
      } catch (e) {
        // Ignore - parties are optional
      }
    })();
  }, [id]);

  const addField = (type: string) => {
    const ft = FIELD_TYPES.find(f => f.type === type)!;
    const newField: DocumentField = {
      id: `new_${++fieldIdCounter}`,
      field_type: type,
      label: ft.label,
      page: 1,
      x: 35,
      y: 45,
      width: ft.defaultW,
      height: ft.defaultH,
      required: 1,
      assigned_to: signers[0]?.email || '',
      font_size: 14,
    };
    setFields(prev => [...prev, newField]);
    setSelectedFieldId(newField.id);
  };

  const updateField = (fieldId: string, updates: Partial<DocumentField>) => {
    setFields(prev => prev.map(f => f.id === fieldId ? { ...f, ...updates } : f));
  };

  const deleteField = (fieldId: string) => {
    setFields(prev => prev.filter(f => f.id !== fieldId));
    if (selectedFieldId === fieldId) setSelectedFieldId(null);
  };

  const addSigner = (party: any) => {
    if (!party.email || signers.find(s => s.email === party.email)) return;
    setSigners(prev => [...prev, { name: party.name, email: party.email, color: SIGNER_COLORS[prev.length % SIGNER_COLORS.length] }]);
  };

  const getSignerColor = (email: string) => {
    return signers.find(s => s.email === email)?.color || '#6366f1';
  };

  const handleMouseDown = (e: React.MouseEvent, fieldId: string, pageIdx: number) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedFieldId(fieldId);
    const pageEl = pagesRef.current[pageIdx];
    if (!pageEl) return;
    const rect = pageEl.getBoundingClientRect();
    const field = fields.find(f => f.id === fieldId)!;
    const fieldXPx = (field.x / 100) * rect.width;
    const fieldYPx = (field.y / 100) * rect.height;
    const offsetX = e.clientX - rect.left - fieldXPx;
    const offsetY = e.clientY - rect.top - fieldYPx;
    setDragging({ fieldId, offsetX, offsetY });
  };

  const handleResizeStart = (e: React.MouseEvent, fieldId: string) => {
    e.stopPropagation();
    e.preventDefault();
    const field = fields.find(f => f.id === fieldId)!;
    setResizing({ fieldId, startX: e.clientX, startY: e.clientY, startW: field.width, startH: field.height });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragging) {
        const field = fields.find(f => f.id === dragging.fieldId);
        if (!field) return;
        const pageEl = pagesRef.current[field.page - 1];
        if (!pageEl) return;
        const rect = pageEl.getBoundingClientRect();
        let x = ((e.clientX - rect.left - dragging.offsetX) / rect.width) * 100;
        let y = ((e.clientY - rect.top - dragging.offsetY) / rect.height) * 100;
        x = Math.max(0, Math.min(100 - field.width, x));
        y = Math.max(0, Math.min(100 - field.height, y));
        updateField(dragging.fieldId, { x, y });
      }
      if (resizing) {
        const field = fields.find(f => f.id === resizing.fieldId);
        if (!field) return;
        const pageEl = pagesRef.current[field.page - 1];
        if (!pageEl) return;
        const rect = pageEl.getBoundingClientRect();
        const dx = ((e.clientX - resizing.startX) / rect.width) * 100;
        const dy = ((e.clientY - resizing.startY) / rect.height) * 100;
        updateField(resizing.fieldId, {
          width: Math.max(3, resizing.startW + dx),
          height: Math.max(2, resizing.startH + dy),
        });
      }
    };
    const handleMouseUp = () => {
      setDragging(null);
      setResizing(null);
    };
    if (dragging || resizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, resizing, fields]);

  // Delete key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedFieldId && !(e.target as HTMLElement).closest('input,select,textarea')) {
        deleteField(selectedFieldId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFieldId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post(`/documents/${id}/fields/bulk`, {
        fields: fields.map(f => ({
          field_type: f.field_type,
          label: f.label,
          page: f.page,
          x: f.x,
          y: f.y,
          width: f.width,
          height: f.height,
          required: f.required,
          assigned_to: f.assigned_to,
          font_size: f.font_size,
        })),
      });
      success('Fields saved!');
    } catch (e: any) {
      showError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndSend = async () => {
    await handleSave();
    // Send for signature to all unique signers who have assigned fields
    const assignedEmails = [...new Set(fields.map(f => f.assigned_to).filter(Boolean))];
    if (assignedEmails.length === 0) return showError('Assign fields to signers first');
    const signersToSend = assignedEmails.map(email => {
      const signer = signers.find(s => s.email === email);
      const party = parties.find(p => p.email === email);
      return { name: signer?.name || party?.name || email, email };
    });
    try {
      const res = await api.post(`/documents/${id}/send-for-signature`, { signers: signersToSend });
      const links = res.signatures.map((s: any) => `${s.signer_name}: ${window.location.origin}/sign/${s.token}`).join('\n');
      navigator.clipboard?.writeText(links);
      success('Sent for signature! Links copied to clipboard.');
    } catch (e: any) {
      showError(e.message);
    }
  };

  const selectedField = fields.find(f => f.id === selectedFieldId);

  const getFieldIcon = (type: string) => {
    const ft = FIELD_TYPES.find(f => f.type === type);
    if (!ft) return Type;
    return ft.icon;
  };

  if (loading) return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-900 flex flex-col">
      {/* Top Bar */}
      <div className="glass border-b border-white/10 px-4 py-3 flex items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-sm font-semibold text-white">Prepare Document</h1>
            <p className="text-xs text-white/40">{doc?.name || `Document #${id}`}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom */}
          <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="p-2 rounded-lg hover:bg-white/10 text-white/60 transition">
            <ZoomOut size={16} />
          </button>
          <span className="text-xs text-white/50 w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(2, z + 0.25))} className="p-2 rounded-lg hover:bg-white/10 text-white/60 transition">
            <ZoomIn size={16} />
          </button>

          <div className="w-px h-6 bg-white/10 mx-2" />

          {/* Signer selector */}
          <select
            onChange={e => {
              const p = parties.find((p: any) => p.email === e.target.value);
              if (p) addSigner(p);
              e.target.value = '';
            }}
            className="bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
            value=""
          >
            <option value="">+ Add Signer</option>
            {parties.filter(p => p.email && !signers.find(s => s.email === p.email)).map(p => (
              <option key={p.id} value={p.email}>{p.name} ({p.role})</option>
            ))}
          </select>

          {signers.map(s => (
            <div key={s.email} className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs" style={{ backgroundColor: s.color + '20', color: s.color, border: `1px solid ${s.color}40` }}>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
              {s.name.split(' ')[0]}
              <button onClick={() => setSigners(prev => prev.filter(ss => ss.email !== s.email))} className="hover:opacity-70">
                <X size={10} />
              </button>
            </div>
          ))}

          <div className="w-px h-6 bg-white/10 mx-2" />

          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition">
            <Save size={14} /> Save
          </button>
          <button onClick={handleSaveAndSend} className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm transition">
            <Send size={14} /> Save & Send
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Field Types */}
        <div className="w-56 glass border-r border-white/10 p-4 space-y-2 flex-shrink-0 overflow-y-auto">
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Field Types</h3>
          {FIELD_TYPES.map(ft => {
            const Icon = ft.icon;
            return (
              <button
                key={ft.type}
                onClick={() => addField(ft.type)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition text-sm"
              >
                <Icon size={16} />
                {ft.label}
              </button>
            );
          })}

          {/* Selected field properties */}
          {selectedField && (
            <div className="mt-6 pt-4 border-t border-white/10 space-y-3">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Properties</h3>
              <div>
                <label className="text-xs text-white/40 block mb-1">Label</label>
                <input value={selectedField.label} onChange={e => updateField(selectedField.id, { label: e.target.value })}
                  className="w-full bg-white/10 border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-brand-400" />
              </div>
              <div>
                <label className="text-xs text-white/40 block mb-1">Page</label>
                <select value={selectedField.page} onChange={e => updateField(selectedField.id, { page: Number(e.target.value) })}
                  className="w-full bg-white/10 border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none">
                  {Array.from({ length: numPages }, (_, i) => (
                    <option key={i + 1} value={i + 1}>Page {i + 1}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-white/40 block mb-1">Assigned To</label>
                <select value={selectedField.assigned_to} onChange={e => updateField(selectedField.id, { assigned_to: e.target.value })}
                  className="w-full bg-white/10 border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none">
                  <option value="">Unassigned</option>
                  {signers.map(s => <option key={s.email} value={s.email}>{s.name}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer">
                <input type="checkbox" checked={selectedField.required === 1}
                  onChange={e => updateField(selectedField.id, { required: e.target.checked ? 1 : 0 })}
                  className="rounded border-white/20 bg-white/10" />
                Required
              </label>
              <button onClick={() => deleteField(selectedField.id)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs transition">
                <Trash2 size={12} /> Delete Field
              </button>
            </div>
          )}
        </div>

        {/* Center - PDF Pages */}
        <div ref={containerRef} className="flex-1 overflow-auto p-8" onClick={() => setSelectedFieldId(null)}>
          <div className="flex flex-col items-center gap-6" style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
            {pdfPages.map((canvas, pageIdx) => (
              <div
                key={pageIdx}
                ref={el => { pagesRef.current[pageIdx] = el; }}
                className="relative bg-white shadow-2xl"
                style={{ width: canvas.width, height: canvas.height }}
              >
                <img src={canvas.toDataURL()} alt={`Page ${pageIdx + 1}`} className="w-full h-full" draggable={false} />
                {/* Page number */}
                <div className="absolute bottom-2 right-3 text-xs text-gray-400 bg-white/80 px-2 py-0.5 rounded">
                  Page {pageIdx + 1} of {numPages}
                </div>
                {/* Fields overlay */}
                {fields.filter(f => f.page === pageIdx + 1).map(field => {
                  const Icon = getFieldIcon(field.field_type);
                  const color = getSignerColor(field.assigned_to);
                  const isSelected = selectedFieldId === field.id;
                  return (
                    <div
                      key={field.id}
                      className={`absolute cursor-move group flex items-center gap-1 text-xs font-medium transition-shadow ${isSelected ? 'ring-2 z-20' : 'z-10 hover:ring-1'}`}
                      style={{
                        left: `${field.x}%`,
                        top: `${field.y}%`,
                        width: `${field.width}%`,
                        height: `${field.height}%`,
                        backgroundColor: color + '25',
                        borderColor: color + '60',
                        border: `2px solid ${color}60`,
                        borderRadius: 4,
                        ringColor: color,
                        '--tw-ring-color': color,
                      } as any}
                      onMouseDown={e => handleMouseDown(e, field.id, pageIdx)}
                      onClick={e => { e.stopPropagation(); setSelectedFieldId(field.id); }}
                    >
                      <div className="flex items-center gap-1 px-1.5 py-0.5 overflow-hidden w-full h-full" style={{ color }}>
                        <Icon size={12} className="flex-shrink-0" />
                        <span className="truncate">{field.label}</span>
                      </div>
                      {/* Resize handle */}
                      {isSelected && (
                        <>
                          <div
                            className="absolute -right-1.5 -bottom-1.5 w-3 h-3 rounded-full cursor-se-resize"
                            style={{ backgroundColor: color }}
                            onMouseDown={e => handleResizeStart(e, field.id)}
                          />
                          <button
                            className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs hover:bg-red-600"
                            onClick={e => { e.stopPropagation(); deleteField(field.id); }}
                          >
                            <X size={10} />
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
