import { useEffect, useState } from 'react';

export interface ToastItem { id: string; type: 'ok' | 'err' | 'info'; msg: string; }

interface Props { toasts: ToastItem[]; onRemove: (id: string) => void; }

function Toast({ t, onRemove }: { t: ToastItem; onRemove: () => void }) {
  const [leaving, setLeaving] = useState(false);

  const dismiss = () => { setLeaving(true); setTimeout(onRemove, 320); };

  useEffect(() => {
    const timer = setTimeout(dismiss, 3200);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`toast toast--${t.type}${leaving ? ' toast--leaving' : ''}`}>
      <span className={`toast-icon toast-icon--${t.type}`}>{{ ok: '✓', err: '✕', info: 'ℹ' }[t.type]}</span>
      <span className="toast-msg">{t.msg}</span>
      <button className="toast-close" onClick={dismiss} aria-label="Dismiss">×</button>
      <div className="toast-progress" />
    </div>
  );
}

export default function ToastContainer({ toasts, onRemove }: Props) {
  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map(t => <Toast key={t.id} t={t} onRemove={() => onRemove(t.id)} />)}
    </div>
  );
}
