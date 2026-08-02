import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function Modal({ open, onClose, title, children, footer, wide }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={`sheet-up relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-lift max-h-[92vh] overflow-y-auto ${
          wide ? 'sm:max-w-2xl' : ''
        }`}
      >
        <div className="sticky top-0 bg-white/90 backdrop-blur px-5 pt-5 pb-3 flex items-center justify-between border-b border-ink-100 rounded-t-3xl">
          <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-ink-400 hover:bg-ink-100 hover:text-ink-700"
          >
            <X size={20} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-ink-100 sticky bottom-0 bg-white">{footer}</div>}
      </div>
    </div>
  );
}
