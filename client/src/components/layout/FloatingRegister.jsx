import { Plus } from 'lucide-react';
import { useUi } from '../../stores/ui';

export default function FloatingRegister() {
  const { setQuickAddOpen } = useUi();
  return (
    <button
      onClick={() => setQuickAddOpen(true)}
      className="fixed bottom-20 lg:bottom-8 right-4 sm:right-6 z-40 inline-flex items-center gap-2 rounded-full bg-primary-500 text-white px-5 py-3.5 shadow-lift hover:bg-primary-600 active:scale-95 transition"
      title="Registrar"
    >
      <Plus size={20} strokeWidth={2.6} />
      <span className="font-semibold text-sm">Registrar</span>
    </button>
  );
}
