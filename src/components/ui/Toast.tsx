// Created: 2026-04-07
// Last Updated: 2026-04-07

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { toast, type ToastMessage } from '../../lib/toast';

const icons = {
  success: <CheckCircle size={18} className="shrink-0 text-status-success" />,
  error: <XCircle size={18} className="shrink-0 text-status-error" />,
  info: <Info size={18} className="shrink-0 text-status-info" />,
};

const borderColors = {
  success: 'border-status-success/30',
  error: 'border-status-error/30',
  info: 'border-status-info/30',
};

function ToastItem({ item }: { item: ToastMessage }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation on mount
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`
        flex items-start gap-3 px-4 py-3 rounded-xl
        bg-navy-800 border ${borderColors[item.type]}
        shadow-2xl min-w-[280px] max-w-[360px]
        transition-all duration-300 ease-out
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
      role="alert"
    >
      {icons[item.type]}
      <p className="flex-1 text-sm text-content-inverse leading-snug">{item.message}</p>
      <button
        onClick={() => toast.remove(item.id)}
        className="shrink-0 text-content-muted hover:text-content-inverse transition-colors"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    return toast.subscribe(setToasts);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem item={t} />
        </div>
      ))}
    </div>
  );
}
