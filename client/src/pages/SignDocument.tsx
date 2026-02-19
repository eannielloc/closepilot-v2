import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, CheckCircle, XCircle, Eye, EyeOff, Calendar, User, Check } from 'lucide-react';
import SignatureSelector from '../components/SignatureSelector';

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

export default function SignDocument() {
  const { token } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const [signatureChoice, setSignatureChoice] = useState<SignatureChoice | null>(null);
  const [step, setStep] = useState<'choose' | 'sign'>('choose');

  // Field entries the signer fills in
  const [fields, setFields] = useState<FieldEntry[]>([
    { id: 'sig', type: 'signature', label: 'Signature', value: null },
    { id: 'init', type: 'initials', label: 'Initials', value: null },
    { id: 'date', type: 'date', label: 'Date Signed', value: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
    { id: 'name', type: 'name', label: 'Full Name', value: null },
    { id: 'check', type: 'checkmark', label: 'I acknowledge this document', value: false },
  ]);

  useEffect(() => {
    fetch(`/api/sign/${token}`)
      .then(r => r.ok ? r.json() : r.json().then(d => Promise.reject(d.error)))
      .then(d => {
        setData(d);
        // Pre-fill name field
        setFields(prev => prev.map(f => f.type === 'name' ? { ...f, value: d.signer_name } : f));
      })
      .catch(e => setError(typeof e === 'string' ? e : 'Invalid or expired signing link'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSignatureConfirm = (choice: SignatureChoice) => {
    setSignatureChoice(choice);
    setFields(prev => prev.map(f => {
      if (f.type === 'signature') return { ...f, value: 'applied' };
      if (f.type === 'initials') return { ...f, value: 'applied' };
      return f;
    }));
    setStep('sign');
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
        fields: fields.map(f => ({ id: f.id, type: f.type, value: f.value })),
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

  const allFieldsComplete = fields.every(f => {
    if (f.type === 'checkmark') return f.value === true;
    return !!f.value;
  });

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
      <div className="max-w-3xl mx-auto space-y-6 py-8">
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
            {/* PDF Preview */}
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
                    <iframe
                      src={`/api/sign/${token}/pdf`}
                      className="w-full bg-white"
                      style={{ height: '70vh' }}
                      title="Document Preview"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Signing Fields */}
            <div className="glass p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg text-white">Signing Fields</h2>
                <button onClick={() => { setStep('choose'); setSignatureChoice(null); }} className="text-brand-400 text-sm hover:underline">
                  Change style
                </button>
              </div>

              {/* Signature Field */}
              <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-xs text-white/40 font-medium uppercase tracking-wider">
                  <FileText size={12} /> Signature
                </div>
                <div className="bg-white/5 rounded-lg p-4 text-center border border-dashed border-white/10">
                  <div style={{ fontFamily: signatureChoice.fontFamily, fontSize: '2.5rem' }} className="text-white">
                    {signatureChoice.signatureText}
                  </div>
                </div>
              </div>

              {/* Initials Field */}
              <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-xs text-white/40 font-medium uppercase tracking-wider">
                  <User size={12} /> Initials
                </div>
                <div className="bg-white/5 rounded-lg p-4 text-center border border-dashed border-white/10">
                  <div style={{ fontFamily: signatureChoice.fontFamily, fontSize: '2rem' }} className="text-white">
                    {signatureChoice.initialsText}
                  </div>
                </div>
              </div>

              {/* Date Field */}
              <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-xs text-white/40 font-medium uppercase tracking-wider">
                  <Calendar size={12} /> Date Signed
                </div>
                <input
                  type="text"
                  value={String(fields.find(f => f.type === 'date')?.value || '')}
                  onChange={e => setFields(prev => prev.map(f => f.type === 'date' ? { ...f, value: e.target.value } : f))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-brand-400 focus:border-brand-400"
                />
              </div>

              {/* Name Field */}
              <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-xs text-white/40 font-medium uppercase tracking-wider">
                  <User size={12} /> Full Name
                </div>
                <input
                  type="text"
                  value={String(fields.find(f => f.type === 'name')?.value || '')}
                  onChange={e => setFields(prev => prev.map(f => f.type === 'name' ? { ...f, value: e.target.value } : f))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-brand-400 focus:border-brand-400"
                />
              </div>

              {/* Checkmark Field */}
              <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => setFields(prev => prev.map(f => f.type === 'checkmark' ? { ...f, value: !f.value } : f))}
                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition cursor-pointer ${
                      fields.find(f => f.type === 'checkmark')?.value
                        ? 'bg-accent-500 border-accent-400'
                        : 'border-white/20 hover:border-white/40'
                    }`}
                  >
                    {fields.find(f => f.type === 'checkmark')?.value && <Check size={14} className="text-white" />}
                  </div>
                  <span className="text-white/70 text-sm">I acknowledge this document</span>
                </label>
              </div>
            </div>

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

              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
