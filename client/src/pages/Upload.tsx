import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { usePageTitle } from '../lib/usePageTitle';
import ParsedContractView from '../components/ParsedContractView';
import { Upload as UploadIcon, FileText, Loader2, CheckCircle } from 'lucide-react';

export default function Upload() {
  usePageTitle('Upload Contract');
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<any>(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const navigate = useNavigate();

  const handleFile = (f: File) => {
    if (f.type !== 'application/pdf') { setError('Please upload a PDF file'); return; }
    setFile(f);
    setError('');
    setParsed(null);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  }, []);

  const handleParse = async () => {
    if (!file) return;
    setParsing(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      const result = await api.post('/parse', form);
      setParsed(result);
    } catch (err: any) {
      setError(err.message || 'Parsing failed');
    } finally {
      setParsing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Upload Contract</h1>
      <p className="text-white/50">Upload a PDF contract and let AI extract all the details automatically.</p>

      {!parsed ? (
        <>
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`glass p-12 text-center cursor-pointer transition-all ${dragOver ? 'border-brand-400 bg-brand-500/10' : 'hover:bg-white/5'}`}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <input id="file-input" type="file" accept=".pdf" className="hidden"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText size={32} className="text-brand-400" />
                <div>
                  <div className="font-semibold">{file.name}</div>
                  <div className="text-white/40 text-sm">{(file.size / 1024).toFixed(0)} KB</div>
                </div>
              </div>
            ) : (
              <>
                <UploadIcon size={48} className="mx-auto text-white/30 mb-4" />
                <div className="text-white/60">Drop a PDF here or click to browse</div>
                <div className="text-white/30 text-sm mt-1">Supports FL FAR/BAR and other standard contracts</div>
              </>
            )}
          </div>

          {error && <div className="bg-red-500/20 text-red-300 px-4 py-3 rounded-lg text-sm">{error}</div>}

          <button onClick={handleParse} disabled={!file || parsing}
            className="btn-brand flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            {parsing ? <><Loader2 size={18} className="animate-spin" /> Parsing with AI... (may take 20-30s)</> : <><UploadIcon size={18} /> Parse Contract</>}
          </button>
        </>
      ) : (
        <>
          <div className="flex items-center gap-3 bg-green-500/20 text-green-300 px-4 py-3 rounded-lg">
            <CheckCircle size={20} /> Contract parsed and saved as a new transaction!
          </div>
          <ParsedContractView tx={parsed} />
          <div className="flex gap-3">
            <button onClick={() => navigate(`/transactions/${parsed.id}`)} className="btn-brand">View Transaction</button>
            <button onClick={() => { setFile(null); setParsed(null); }} className="glass glass-hover px-6 py-2.5 font-medium">Upload Another</button>
          </div>
        </>
      )}
    </div>
  );
}
