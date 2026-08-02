import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, History, HeartPulse, Search, MoreHorizontal } from 'lucide-react';
import { useUi } from '../../stores/ui';

const MAIN = [
  { to: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { to: '/timeline', label: 'Línea de tiempo', icon: History },
  { to: '/health', label: 'Salud', icon: HeartPulse },
  { to: '/search', label: 'Buscar', icon: Search },
];

const MORE = [
  { to: '/studies', label: 'Estudios' },
  { to: '/medications', label: 'Medicamentos' },
  { to: '/appointments', label: 'Consultas' },
  { to: '/share', label: 'Compartir' },
  { to: '/family', label: 'Familia' },
  { to: '/settings', label: 'Configuración' },
];

export default function MobileTabs() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { setQuickAddOpen } = useUi();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-ink-100 px-2 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-stretch justify-around">
          {MAIN.map(({ to, label, icon: Icon }) => {
            const active = pathname === to || (to !== '/dashboard' && pathname.startsWith(to));
            return (
              <button
                key={to}
                onClick={() => navigate(to)}
                className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
                  active ? 'text-primary-600' : 'text-ink-400'
                }`}
              >
                <Icon size={21} strokeWidth={active ? 2.4 : 2} />
                {label}
              </button>
            );
          })}
          <button
            onClick={() => setMoreOpen(true)}
            className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
              MORE.some((m) => pathname.startsWith(m.to)) ? 'text-primary-600' : 'text-ink-400'
            }`}
          >
            <MoreHorizontal size={21} />
            Más
          </button>
        </div>
      </nav>

      {moreOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-ink-900/40" onClick={() => setMoreOpen(false)} />
          <div className="sheet-up relative w-full bg-white rounded-t-3xl p-4 pb-8 max-w-lg">
            <h3 className="font-semibold text-ink-900 px-2 mb-2">Más opciones</h3>
            <div className="grid grid-cols-2 gap-2">
              {MORE.map(({ to, label }) => (
                <button
                  key={to}
                  onClick={() => {
                    setMoreOpen(false);
                    navigate(to);
                  }}
                  className="rounded-2xl bg-ink-50 hover:bg-ink-100 px-4 py-3.5 text-sm font-medium text-ink-700 text-left"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
