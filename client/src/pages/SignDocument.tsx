import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import SignaturePad from '../components/SignaturePad';

export default function SignDocument() {
  const { token } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [showPdf, setShowPdf] = useState(false);

  useEffect(() => {
    fetch(`/api/sign/${token}`)
      .then(r => r.ok ? r.json() : r.json().then(d => Promise.reject(d.error)))
      .then(setData)
      .catch(e => setError(typeof e === 'string' ? e : 'Invalid or expired signing link'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSign = async () => {
    if (!signatureData) return;
    setSigning(true);
    try {
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

        {/* Document Info */}
        <div className="glass p-6 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div><span className="text-white/40">Document:</span> <span className="text-white font-medium">{data.doc_name}</span></div>
            <div><span className="text-white/40">Property:</span> <span className="text-white">{data.property}</span></div>
            <div><span className="text-white/40">Address:</span> <span className="text-white">{data.address}</span></div>
            <div><span className="text-white/40">Signer:</span> <span className="text-white">{data.signer_name} ({data.signer_email})</span></div>
          </div>
        </div>

        {/* PDF Preview */}
        {data.has_file && (
          <div className="glass overflow-hidden">
            <button onClick={() => setShowPdf(!showPdf)}
              className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition">
              <span className="flex items-center gap-2 text-sm font-medium">
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

        {/* Signature Section */}
        <div className="glass p-6 space-y-4">
          <h2 className="font-semibold text-lg text-white">Your Signature</h2>
          {signatureData ? (
            <div className="space-y-3">
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center justify-center">
                <img src={signatureData} alt="Your signature" className="max-h-24" />
              </div>
              <button onClick={() => setSignatureData(null)} className="text-brand-400 text-sm hover:underline">
                Re-draw signature
              </button>
            </div>
          ) : (
            <SignaturePad onSign={setSignatureData} />
          )}
        </div>

        {/* Agreement + Submit */}
        <div className="glass p-6 space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-white/20 bg-white/10 text-brand-400 focus:ring-brand-400" />
            <span className="text-white/70 text-sm">I have reviewed this document and agree to sign it electronically. I understand this constitutes a legally binding signature under ESIGN and UETA.</span>
          </label>

          <button onClick={handleSign} disabled={!agreed || !signatureData || signing}
            className="w-full bg-brand-400 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition text-lg">
            {signing ? 'Signing...' : 'Sign Document'}
          </button>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        </div>
      </div>
    </div>
  );
}
