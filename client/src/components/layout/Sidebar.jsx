import { memo } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  History,
  HeartPulse,
  FileText,
  Pill,
  Stethoscope,
  Search,
  Share2,
  Settings,
  Activity,
  Users,
} from 'lucide-react';
import { APP_NAME } from '../../utils/app';
import { useAuth } from '../../stores/auth';
import { initials } from '../../utils/format';

const NAV = [
  { to: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { to: '/timeline', label: 'Línea de tiempo', icon: History },
  { to: '/health', label: 'Salud diaria', icon: HeartPulse },
  { to: '/studies', label: 'Estudios', icon: FileText },
  { to: '/medications', label: 'Medicamentos', icon: Pill },
  { to: '/appointments', label: 'Consultas', icon: Stethoscope },
  { to: '/search', label: 'Buscar', icon: Search },
  { to: '/share', label: 'Compartir', icon: Share2 },
  { to: '/family', label: 'Familia', icon: Users },
  { to: '/settings', label: 'Configuración', icon: Settings },
];

export default memo(function Sidebar() {
  const user = useAuth((s) => s.user);
  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col bg-white border-r border-ink-100 z-40">
      <div className="flex items-center gap-2.5 px-6 h-16 border-b border-ink-100">
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-primary-400 to-mint-400 flex items-center justify-center text-white shadow-soft">
          <Activity size={20} />
        </div>
        <span className="font-bold text-lg text-ink-900">{APP_NAME}</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-ink-500 hover:bg-ink-50 hover:text-ink-800'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-ink-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-mint-100 text-mint-700 flex items-center justify-center font-semibold text-sm">
            {initials(user?.name)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink-900 truncate">{user?.name}</p>
            <p className="text-xs text-ink-400 truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
});
