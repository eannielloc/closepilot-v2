import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, CheckCircle, XCircle, Eye, EyeOff, Calendar, User, Check, PenTool, Type, Mail, MapPin, CheckSquare, FileSignature } from 'lucide-react';
import SignatureSelector from '../components/SignatureSelector';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface SignatureChoice {
  styleId: string;
  fontFamily: string;
  signatureText: string;
  initialsText: string;
}

interface FieldEntry {
  id: string;
  type: 'signature' | 'initials' | 'date' | 'name' | 'checkmark';
  label: string;
  value: string | boolean | null;
}

interface PositionedField {
  id: number;
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

const FIELD_ICONS: Record<string, any> = {
  signature: PenTool,
  initials: FileSignature,
  date: Calendar,
  name: User,
  text: Type,
  address: MapPin,
  email: Mail,
  checkbox: CheckSquare,
};

export default function SignDocument() {
  const { token } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [signatureChoice, setSignatureChoice] = useState<SignatureChoice | null>(null);
  const [step, setStep] = useState<'choose' | 'sign'>('choose');

  // Positioned fields from API
  const [positionedFields, setPositionedFields] = useState<PositionedField[]>([]);
  const [hasPositionedFields, setHasPositionedFields] = useState(false);
  const [fieldValues, setFieldValues] = useState<Record<number, string | boolean>>({});
  const [pdfPages, setPdfPages] = useState<HTMLCanvasElement[]>([]);
  const [editingFieldId, setEditingFieldId] = useState<number | null>(null);

  // Legacy fields for fallback
  const [fields, setFields] = useState<FieldEntry[]>([
    { id: 'sig', type: 'signature', label: 'Signature', value: null },
    { id: 'init', type: 'initials', label: 'Initials', value: null },
    { id: 'date', type: 'date', label: 'Date Signed', value: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
    { id: 'name', type: 'name', label: 'Full Name', value: null },
    { id: 'check', type: 'checkmark', label: 'I acknowledge this document', value: false },
  ]);
  const [showPdf, setShowPdf] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/sign/${token}`);
        if (!res.ok) { const d = await res.json(); throw d.error; }
        const d = await res.json();
        setData(d);
        setFields(prev => prev.map(f => f.type === 'name' ? { ...f, value: d.signer_name } : f));

        // Load positioned fields
        const fieldsRes = await fetch(`/api/sign/${token}/fields`);
        if (fieldsRes.ok) {
          const pf = await fieldsRes.json();
          if (pf.length > 0) {
            setPositionedFields(pf);
            setHasPositionedFields(true);
            // Pre-fill auto-fillable fields
            const vals: Record<number, string | boolean> = {};
            for (const f of pf) {
              if (f.field_type === 'date') vals[f.id] = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
              if (f.field_type === 'name') vals[f.id] = d.signer_name;
              if (f.field_type === 'email') vals[f.id] = d.signer_email;
              if (f.field_type === 'checkbox') vals[f.id] = false;
            }
            setFieldValues(vals);

            // Load PDF pages
            if (d.has_file) {
              const pdf = await pdfjsLib.getDocument(`/api/sign/${token}/pdf`).promise;
              const canvases: HTMLCanvasElement[] = [];
              for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 1.5 });
                const canvas = document.createElement('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const ctx = canvas.getContext('2d')!;
                await page.render({ canvasContext: ctx, viewport }).promise;
                canvases.push(canvas);
              }
              setPdfPages(canvases);
            }
          }
        }
      } catch (e: any) {
        setError(typeof e === 'string' ? e : 'Invalid or expired signing link');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const handleSignatureConfirm = (choice: SignatureChoice) => {
    setSignatureChoice(choice);
    if (hasPositionedFields) {
      // Auto-fill signature and initials fields
      const vals = { ...fieldValues };
      for (const f of positionedFields) {
        if (f.assigned_to && f.assigned_to !== data?.signer_email) continue;
        if (f.field_type === 'signature') vals[f.id] = 'signed';
        if (f.field_type === 'initials') vals[f.id] = 'initialed';
      }
      setFieldValues(vals);
    } else {
      setFields(prev => prev.map(f => {
        if (f.type === 'signature') return { ...f, value: 'applied' };
        if (f.type === 'initials') return { ...f, value: 'applied' };
        return f;
      }));
    }
    setStep('sign');
  };

  const handleFieldClick = (field: PositionedField) => {
    if (field.assigned_to && field.assigned_to !== data?.signer_email) return;
    const vals = { ...fieldValues };
    if (field.field_type === 'signature') {
      if (!signatureChoice) { setStep('choose'); return; }
      vals[field.id] = 'signed';
    } else if (field.field_type === 'initials') {
      if (!signatureChoice) { setStep('choose'); return; }
      vals[field.id] = 'initialed';
    } else if (field.field_type === 'date') {
      vals[field.id] = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } else if (field.field_type === 'name') {
      vals[field.id] = data?.signer_name || '';
    } else if (field.field_type === 'email') {
      vals[field.id] = data?.signer_email || '';
    } else if (field.field_type === 'checkbox') {
      vals[field.id] = !fieldValues[field.id];
    } else if (field.field_type === 'text' || field.field_type === 'address') {
      setEditingFieldId(field.id);
      return;
    }
    setFieldValues(vals);
  };

  const handleSign = async () => {
    if (!signatureChoice) return;
    setSigning(true);
    try {
      const signatureData = JSON.stringify({
        type: 'style-signature',
        styleId: signatureChoice.styleId,
        fontFamily: signatureChoice.fontFamily,
        signatureText: signatureChoice.signatureText,
        initialsText: signatureChoice.initialsText,
        fields: hasPositionedFields
          ? positionedFields.filter(f => !f.assigned_to || f.assigned_to === data?.signer_email).map(f => ({ id: f.id, type: f.field_type, value: fieldValues[f.id] }))
          : fields.map(f => ({ id: f.id, type: f.type, value: f.value })),
        signedAt: new Date().toISOString(),
      });
      const res = await fetch(`/api/sign/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature_data: signatureData }),
      });
      if (!res.ok) { const d = await res.json(); throw d.error; }
      setSigned(true);
    } catch (e: any) {
      setError(typeof e === 'string' ? e : 'Signing failed');
    } finally {
      setSigning(false);
    }
  };

  // Completion tracking for positioned fields
  const myFields = positionedFields.filter(f => !f.assigned_to || f.assigned_to === data?.signer_email);
  const requiredFields = myFields.filter(f => f.required);
  const completedCount = myFields.filter(f => {
    const v = fieldValues[f.id];
    if (f.field_type === 'checkbox') return v === true;
    return !!v;
  }).length;
  const requiredComplete = requiredFields.every(f => {
    const v = fieldValues[f.id];
    if (f.field_type === 'checkbox') return v === true;
    return !!v;
  });

  const allFieldsComplete = hasPositionedFields
    ? requiredComplete
    : fields.every(f => f.type === 'checkmark' ? f.value === true : !!f.value);

  if (loading) return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full" />
    </div>
  );

  if (error && !data) return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4">
      <div className="glass p-8 max-w-md w-full text-center space-y-4">
        <XCircle size={48} className="mx-auto text-red-400" />
        <h1 className="text-xl font-bold text-white">Unable to Sign</h1>
        <p className="text-white/50">{error}</p>
      </div>
    </div>
  );

  if (signed || data?.status === 'signed') return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4">
      <div className="glass p-8 max-w-md w-full text-center space-y-4">
        <CheckCircle size={48} className="mx-auto text-accent-400" />
        <h1 className="text-xl font-bold text-white">Document Signed!</h1>
        <p className="text-white/50">
          {signed ? 'Your signature has been recorded. You may close this page.' : `This document was already signed${data.signed_at ? ` on ${new Date(data.signed_at).toLocaleDateString()}` : ''}.`}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6 py-8">
        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 bg-brand-500 rounded-xl flex items-center justify-center text-lg font-bold mx-auto mb-4">CP</div>
          <h1 className="text-2xl font-bold text-white">Document Signing</h1>
          <p className="text-white/50 mt-1">ClosePilot E-Signature</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-3">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${step === 'choose' ? 'bg-brand-500/20 text-brand-400 border border-brand-400/30' : 'bg-accent-500/20 text-accent-400 border border-accent-400/30'}`}>
            {step === 'sign' ? <Check size={14} /> : <span className="w-5 h-5 rounded-full bg-brand-500 text-white text-xs flex items-center justify-center">1</span>}
            Choose Style
          </div>
          <div className="w-8 h-px bg-white/20" />
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${step === 'sign' ? 'bg-brand-500/20 text-brand-400 border border-brand-400/30' : 'bg-white/5 text-white/30 border border-white/10'}`}>
            <span className="w-5 h-5 rounded-full bg-white/10 text-white/50 text-xs flex items-center justify-center">2</span>
            Review & Sign
          </div>
        </div>

        {/* Document Info */}
        <div className="glass p-6 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div><span className="text-white/40">Document:</span> <span className="text-white font-medium">{data.doc_name}</span></div>
            <div><span className="text-white/40">Property:</span> <span className="text-white">{data.property}</span></div>
            <div><span className="text-white/40">Address:</span> <span className="text-white">{data.address}</span></div>
            <div><span className="text-white/40">Signer:</span> <span className="text-white">{data.signer_name} ({data.signer_email})</span></div>
          </div>
        </div>

        {/* Step 1: Choose Signature */}
        {step === 'choose' && (
          <div className="glass p-6">
            <SignatureSelector signerName={data.signer_name} onConfirm={handleSignatureConfirm} />
          </div>
        )}

        {/* Step 2: Review & Sign */}
        {step === 'sign' && signatureChoice && (
          <>
            {/* Progress bar for positioned fields */}
            {hasPositionedFields && (
              <div className="glass p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/60">Field completion</span>
                  <span className="text-sm font-medium text-white">{completedCount} of {myFields.length} fields completed</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-accent-400 rounded-full transition-all duration-300" style={{ width: `${myFields.length > 0 ? (completedCount / myFields.length) * 100 : 0}%` }} />
                </div>
              </div>
            )}

            {/* PDF with positioned fields */}
            {hasPositionedFields && pdfPages.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-lg text-white">Review & Complete Fields</h2>
                  <button onClick={() => { setStep('choose'); setSignatureChoice(null); }} className="text-brand-400 text-sm hover:underline">
                    Change style
                  </button>
                </div>
                {pdfPages.map((canvas, pageIdx) => (
                  <div key={pageIdx} className="relative bg-white shadow-2xl mx-auto" style={{ width: canvas.width, maxWidth: '100%' }}>
                    <img src={canvas.toDataURL()} alt={`Page ${pageIdx + 1}`} className="w-full" draggable={false} />
                    {/* Field overlays */}
                    {positionedFields.filter(f => f.page === pageIdx + 1).map(field => {
                      const isMyField = !field.assigned_to || field.assigned_to === data?.signer_email;
                      const value = fieldValues[field.id];
                      const isFilled = field.field_type === 'checkbox' ? value === true : !!value;
                      const Icon = FIELD_ICONS[field.field_type] || Type;

                      return (
                        <div
                          key={field.id}
                          className={`absolute transition-all ${isMyField ? 'cursor-pointer hover:ring-2 hover:ring-brand-400' : 'opacity-40 cursor-not-allowed'}`}
                          style={{
                            left: `${field.x}%`,
                            top: `${field.y}%`,
                            width: `${field.width}%`,
                            height: `${field.height}%`,
                            backgroundColor: isFilled ? (isMyField ? 'rgba(16,185,129,0.15)' : 'rgba(100,100,100,0.1)') : (isMyField ? 'rgba(99,102,241,0.15)' : 'rgba(100,100,100,0.1)'),
                            border: `2px solid ${isFilled ? (isMyField ? 'rgba(16,185,129,0.5)' : 'rgba(100,100,100,0.3)') : (isMyField ? 'rgba(99,102,241,0.5)' : 'rgba(100,100,100,0.3)')}`,
                            borderRadius: 4,
                          }}
                          onClick={() => isMyField && handleFieldClick(field)}
                        >
                          {/* Filled content */}
                          {isFilled ? (
                            <div className="w-full h-full flex items-center justify-center overflow-hidden px-1">
                              {field.field_type === 'signature' && signatureChoice && (
                                <span style={{ fontFamily: signatureChoice.fontFamily, fontSize: '1.2em' }} className="text-gray-800 truncate">
                                  {signatureChoice.signatureText}
                                </span>
                              )}
                              {field.field_type === 'initials' && signatureChoice && (
                                <span style={{ fontFamily: signatureChoice.fontFamily, fontSize: '1.1em' }} className="text-gray-800 truncate">
                                  {signatureChoice.initialsText}
                                </span>
                              )}
                              {field.field_type === 'checkbox' && <Check size={16} className="text-emerald-600" />}
                              {['date', 'name', 'text', 'address', 'email'].includes(field.field_type) && (
                                <span className="text-gray-800 text-xs truncate">{String(value)}</span>
                              )}
                            </div>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center gap-1 text-xs" style={{ color: isMyField ? '#6366f1' : '#888' }}>
                              <Icon size={12} />
                              <span className="truncate">{field.label || field.field_type}</span>
                            </div>
                          )}

                          {/* Inline text input */}
                          {editingFieldId === field.id && (
                            <div className="absolute inset-0 z-10" onClick={e => e.stopPropagation()}>
                              <input
                                autoFocus
                                className="w-full h-full px-2 text-xs text-gray-800 bg-white border-2 border-brand-400 rounded outline-none"
                                value={String(fieldValues[field.id] || '')}
                                onChange={e => setFieldValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                                onBlur={() => setEditingFieldId(null)}
                                onKeyDown={e => { if (e.key === 'Enter') setEditingFieldId(null); }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ) : (
              /* Fallback: Legacy field flow */
              <>
                {data.has_file && (
                  <div className="glass overflow-hidden">
                    <button onClick={() => setShowPdf(!showPdf)}
                      className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition">
                      <span className="flex items-center gap-2 text-sm font-medium text-white">
                        {showPdf ? <EyeOff size={16} /> : <Eye size={16} />}
                        {showPdf ? 'Hide Document Preview' : 'View Document'}
                      </span>
                      <FileText size={16} className="text-white/40" />
                    </button>
                    {showPdf && (
                      <div className="border-t border-white/10">
                        <iframe src={`/api/sign/${token}/pdf`} className="w-full bg-white" style={{ height: '70vh' }} title="Document Preview" />
                      </div>
                    )}
                  </div>
                )}

                <div className="glass p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-lg text-white">Signing Fields</h2>
                    <button onClick={() => { setStep('choose'); setSignatureChoice(null); }} className="text-brand-400 text-sm hover:underline">Change style</button>
                  </div>

                  {/* Signature */}
                  <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-white/40 font-medium uppercase tracking-wider"><FileText size={12} /> Signature</div>
                    <div className="bg-white/5 rounded-lg p-4 text-center border border-dashed border-white/10">
                      <div style={{ fontFamily: signatureChoice.fontFamily, fontSize: '2.5rem' }} className="text-white">{signatureChoice.signatureText}</div>
                    </div>
                  </div>

                  {/* Initials */}
                  <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-white/40 font-medium uppercase tracking-wider"><User size={12} /> Initials</div>
                    <div className="bg-white/5 rounded-lg p-4 text-center border border-dashed border-white/10">
                      <div style={{ fontFamily: signatureChoice.fontFamily, fontSize: '2rem' }} className="text-white">{signatureChoice.initialsText}</div>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-white/40 font-medium uppercase tracking-wider"><Calendar size={12} /> Date Signed</div>
                    <input type="text" value={String(fields.find(f => f.type === 'date')?.value || '')}
                      onChange={e => setFields(prev => prev.map(f => f.type === 'date' ? { ...f, value: e.target.value } : f))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-brand-400 focus:border-brand-400" />
                  </div>

                  {/* Name */}
                  <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-white/40 font-medium uppercase tracking-wider"><User size={12} /> Full Name</div>
                    <input type="text" value={String(fields.find(f => f.type === 'name')?.value || '')}
                      onChange={e => setFields(prev => prev.map(f => f.type === 'name' ? { ...f, value: e.target.value } : f))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-brand-400 focus:border-brand-400" />
                  </div>

                  {/* Checkmark */}
                  <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div onClick={() => setFields(prev => prev.map(f => f.type === 'checkmark' ? { ...f, value: !f.value } : f))}
                        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition cursor-pointer ${fields.find(f => f.type === 'checkmark')?.value ? 'bg-accent-500 border-accent-400' : 'border-white/20 hover:border-white/40'}`}>
                        {fields.find(f => f.type === 'checkmark')?.value && <Check size={14} className="text-white" />}
                      </div>
                      <span className="text-white/70 text-sm">I acknowledge this document</span>
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* Agreement + Submit */}
            <div className="glass p-6 space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-white/20 bg-white/10 text-brand-400 focus:ring-brand-400" />
                <span className="text-white/70 text-sm">I have reviewed this document and agree to sign it electronically. I understand this constitutes a legally binding signature under ESIGN and UETA.</span>
              </label>

              <button onClick={handleSign} disabled={!agreed || !allFieldsComplete || signing}
                className="w-full bg-brand-400 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition text-lg">
                {signing ? 'Signing...' : 'Sign Document'}
              </button>

              {!allFieldsComplete && hasPositionedFields && (
                <p className="text-yellow-400/70 text-sm text-center">Please complete all required fields before signing.</p>
              )}
              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
