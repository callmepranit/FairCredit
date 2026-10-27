import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning';
  title: string;
  message?: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const bgClass =
    toast.type === 'success'
      ? 'bg-slate-900 border-teal-500/40 text-white'
      : toast.type === 'warning'
      ? 'bg-slate-900 border-amber-500/40 text-white'
      : 'bg-slate-900 border-slate-700 text-white';

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className={`p-4 rounded-xl border shadow-2xl flex items-start space-x-3 ${bgClass}`}>
        {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />}
        {toast.type === 'warning' && <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
        {toast.type === 'info' && <Info className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />}

        <div className="flex-1">
          <div className="text-xs font-bold">{toast.title}</div>
          {toast.message && <div className="text-[11px] text-slate-300 mt-0.5">{toast.message}</div>}
        </div>

        <button onClick={onClose} className="text-slate-400 hover:text-white p-0.5">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
