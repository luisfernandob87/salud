import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useUi } from '../../stores/ui';

const styles = {
  success: { icon: CheckCircle2, cls: 'text-mint-600' },
  error: { icon: AlertCircle, cls: 'text-red-500' },
  info: { icon: Info, cls: 'text-primary-500' },
};

export default function Toasts() {
  const { toasts, dismissToast } = useUi();
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm">
      {toasts.map((t) => {
        const cfg = styles[t.type] || styles.info;
        const Icon = cfg.icon;
        return (
          <div
            key={t.id}
            className="fade-up flex items-start gap-2.5 rounded-2xl bg-white shadow-lift border border-ink-100 px-4 py-3"
          >
            <Icon size={18} className={`${cfg.cls} mt-0.5 shrink-0`} />
            <p className="text-sm text-ink-800 flex-1">{t.message}</p>
            <button onClick={() => dismissToast(t.id)} className="text-ink-300 hover:text-ink-500">
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
