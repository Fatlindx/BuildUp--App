import { useState, useCallback, useRef } from 'react';
import { Check, X, Info, AlertCircle } from 'lucide-react';

// ── Global Toast Hook ─────────────────────────────────────────
export function useToast() {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const show = useCallback((message, type = 'success', duration = 2200) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, type, id: Date.now() });
    timerRef.current = setTimeout(() => {
      setToast(t => t ? { ...t, hiding: true } : null);
      setTimeout(() => setToast(null), 280);
    }, duration);
  }, []);

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(t => t ? { ...t, hiding: true } : null);
    setTimeout(() => setToast(null), 280);
  }, []);

  return { toast, show, hide };
}

// ── Toast Component ───────────────────────────────────────────
const icons = {
  success: <Check size={13} strokeWidth={2.5} />,
  error:   <X size={13} strokeWidth={2.5} />,
  info:    <Info size={13} strokeWidth={2} />,
  warning: <AlertCircle size={13} strokeWidth={2} />,
};

export function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`toast toast-${toast.type}${toast.hiding ? ' toast-hide' : ''}`}>
      {icons[toast.type]}
      <span>{toast.message}</span>
    </div>
  );
}
