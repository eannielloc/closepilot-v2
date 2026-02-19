import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Keyboard } from 'lucide-react';

const shortcuts = [
  { keys: ['⌘/Ctrl', 'N'], desc: 'New transaction' },
  { keys: ['⌘/Ctrl', 'U'], desc: 'Upload page' },
  { keys: ['?'], desc: 'Show this help' },
  { keys: ['Esc'], desc: 'Close modal' },
];

export function KeyboardShortcutsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div className="glass p-6 w-full max-w-sm space-y-4 animate-slide-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg flex items-center gap-2"><Keyboard size={20} /> Keyboard Shortcuts</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X size={20} /></button>
        </div>
        <div className="space-y-2">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <span className="text-sm text-[var(--text-secondary)]">{s.desc}</span>
              <div className="flex gap-1">
                {s.keys.map((k, j) => (
                  <kbd key={j} className="px-2 py-1 text-xs rounded bg-white/10 border border-white/20 text-[var(--text-primary)] font-mono">{k}</kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function useKeyboardShortcuts(callbacks: {
  onNewTransaction?: () => void;
}) {
  const navigate = useNavigate();
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable;

      // Escape - close modals
      if (e.key === 'Escape') {
        setShowHelp(false);
        return;
      }

      // ? - show help (only when not in input)
      if (e.key === '?' && !isInput && !meta) {
        e.preventDefault();
        setShowHelp(prev => !prev);
        return;
      }

      if (meta) {
        if (e.key === 'n' || e.key === 'N') {
          e.preventDefault();
          callbacks.onNewTransaction?.();
        } else if (e.key === 'u' || e.key === 'U') {
          e.preventDefault();
          navigate('/upload');
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate, callbacks]);

  return { showHelp, setShowHelp };
}

export function ShortcutsHelpButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 right-4 z-50 w-8 h-8 rounded-full glass glass-hover flex items-center justify-center text-white/40 hover:text-white text-sm font-bold"
      title="Keyboard shortcuts (?)"
    >
      ?
    </button>
  );
}
