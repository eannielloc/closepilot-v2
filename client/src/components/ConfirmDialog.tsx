import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

const variantStyles = {
  danger: { icon: 'text-red-400', btn: 'bg-red-500 hover:bg-red-600' },
  warning: { icon: 'text-yellow-400', btn: 'bg-yellow-500 hover:bg-yellow-600' },
  info: { icon: 'text-brand-400', btn: 'bg-brand-500 hover:bg-brand-600' },
};

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', variant = 'danger', onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null;
  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onCancel}>
      <div className="glass w-full max-w-sm p-6 space-y-4 animate-slide-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 ${styles.icon}`}><AlertTriangle size={20} /></div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-white/50 text-sm mt-1">{message}</p>
          </div>
          <button onClick={onCancel} className="text-white/40 hover:text-white transition"><X size={18} /></button>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition">{cancelLabel}</button>
          <button onClick={onConfirm} className={`px-4 py-2 text-sm text-white font-medium rounded-lg transition ${styles.btn}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
