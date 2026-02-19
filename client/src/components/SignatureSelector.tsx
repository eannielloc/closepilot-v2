import { useState } from 'react';
import { Check, Pen } from 'lucide-react';

interface SignatureStyle {
  id: string;
  label: string;
  fontFamily: string;
  fontSize: string;
  initialsFontSize: string;
}

const SIGNATURE_STYLES: SignatureStyle[] = [
  { id: 'elegant', label: 'Elegant', fontFamily: "'Great Vibes', cursive", fontSize: '2.5rem', initialsFontSize: '2rem' },
  { id: 'casual', label: 'Casual', fontFamily: "'Caveat', cursive", fontSize: '2.5rem', initialsFontSize: '2rem' },
  { id: 'classic', label: 'Classic', fontFamily: "'Dancing Script', cursive", fontSize: '2.5rem', initialsFontSize: '2rem' },
  { id: 'smooth', label: 'Smooth', fontFamily: "'Sacramento', cursive", fontSize: '3rem', initialsFontSize: '2.2rem' },
  { id: 'bold', label: 'Bold', fontFamily: "'Pacifico', cursive", fontSize: '2rem', initialsFontSize: '1.8rem' },
];

interface Props {
  signerName: string;
  onConfirm: (data: { styleId: string; fontFamily: string; signatureText: string; initialsText: string }) => void;
}

export default function SignatureSelector({ signerName, onConfirm }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<'signature' | 'initials'>('signature');

  const nameParts = signerName.trim().split(/\s+/);
  const initials = nameParts.map(p => p[0]?.toUpperCase()).filter(Boolean).join('');

  const selected = SIGNATURE_STYLES.find(s => s.id === selectedId);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 bg-brand-500/20 border border-brand-400/30 rounded-2xl flex items-center justify-center mx-auto">
          <Pen size={24} className="text-brand-400" />
        </div>
        <h2 className="text-xl font-bold text-white">Choose Your Signature Style</h2>
        <p className="text-white/50 text-sm">Select a style for your signature and initials. This will be used on all fields in this document.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-lg p-1">
        <button
          onClick={() => setTab('signature')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${tab === 'signature' ? 'bg-brand-500 text-white' : 'text-white/50 hover:text-white'}`}
        >
          Signature
        </button>
        <button
          onClick={() => setTab('initials')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${tab === 'initials' ? 'bg-brand-500 text-white' : 'text-white/50 hover:text-white'}`}
        >
          Initials
        </button>
      </div>

      {/* Style Options */}
      <div className="space-y-3">
        {SIGNATURE_STYLES.map(style => {
          const isSelected = selectedId === style.id;
          const displayText = tab === 'signature' ? signerName : initials;
          const fontSize = tab === 'signature' ? style.fontSize : style.initialsFontSize;

          return (
            <button
              key={style.id}
              onClick={() => setSelectedId(style.id)}
              className={`w-full group relative p-5 rounded-xl border transition-all duration-200 text-left ${
                isSelected
                  ? 'bg-brand-500/10 border-brand-400/50 ring-1 ring-brand-400/30'
                  : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs text-white/40 font-medium uppercase tracking-wider">{style.label}</span>
                  </div>
                  <div
                    className="text-white truncate"
                    style={{ fontFamily: style.fontFamily, fontSize }}
                  >
                    {displayText}
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-4 transition ${
                  isSelected ? 'border-brand-400 bg-brand-500' : 'border-white/20'
                }`}>
                  {isSelected && <Check size={14} className="text-white" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Preview */}
      {selected && (
        <div className="glass p-4 space-y-3">
          <span className="text-xs text-white/40 font-medium uppercase tracking-wider">Preview</span>
          <div className="flex gap-4">
            <div className="flex-1 bg-white/5 rounded-lg p-4 text-center">
              <span className="text-xs text-white/30 block mb-1">Signature</span>
              <div style={{ fontFamily: selected.fontFamily, fontSize: selected.fontSize }} className="text-white">
                {signerName}
              </div>
            </div>
            <div className="w-24 bg-white/5 rounded-lg p-4 text-center">
              <span className="text-xs text-white/30 block mb-1">Initials</span>
              <div style={{ fontFamily: selected.fontFamily, fontSize: selected.initialsFontSize }} className="text-white">
                {initials}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm */}
      <button
        onClick={() => selected && onConfirm({
          styleId: selected.id,
          fontFamily: selected.fontFamily,
          signatureText: signerName,
          initialsText: initials,
        })}
        disabled={!selected}
        className="w-full bg-brand-400 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition text-lg"
      >
        Adopt Signature & Continue
      </button>
    </div>
  );
}
