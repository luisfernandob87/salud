import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Share2, LogOut, Activity, Users, ChevronRight, BadgeCheck } from 'lucide-react';
import { APP_NAME } from '../../utils/app';
import { useAuth } from '../../stores/auth';
import { useUi } from '../../stores/ui';
import { initials, ageFrom } from '../../utils/format';
import { useState, useRef, useEffect } from 'react';

function relationLabel(p) {
  const relation = p.relation ? p.relation.charAt(0).toUpperCase() + p.relation.slice(1) : 'Familiar';
  const age = ageFrom(p.birth_date);
  return age === null ? relation : `${relation} · ${age} años`;
}

export default memo(function TopBar({ onOpenSearch }) {
  const user = useAuth((s) => s.user);
  const profiles = useAuth((s) => s.profiles);
  const activeProfile = useAuth((s) => s.activeProfile);
  const setProfile = useAuth((s) => s.setProfile);
  const logout = useAuth((s) => s.logout);
  const toast = useUi((s) => s.toast);
  const bumpRefresh = useUi((s) => s.bumpRefresh);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef(null);

  const active = activeProfile ? profiles.find((p) => p.id === activeProfile) || user : user;
  const isDependent = Boolean(activeProfile);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  function selectProfile(id) {
    setProfile(id);
    bumpRefresh();
    setMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-30 bg-ink-50/85 backdrop-blur border-b border-ink-100 lg:bg-white">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-10 max-w-5xl mx-auto">
        <div className="flex items-center gap-2.5 lg:hidden">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-400 to-mint-400 flex items-center justify-center text-white">
            <Activity size={18} />
          </div>
          <span className="font-bold text-ink-900">{APP_NAME}</span>
        </div>

        <button
          onClick={onOpenSearch}
          className="hidden lg:flex items-center gap-2 rounded-xl bg-ink-50 border border-ink-200 px-4 py-2 text-sm text-ink-400 hover:bg-ink-100 transition w-full max-w-sm"
        >
          <Search size={16} />
          <span className="flex-1 text-left">Buscar en tu historial…</span>
          <kbd className="text-[10px] font-semibold text-ink-400 border border-ink-200 rounded-md px-1.5 py-0.5">
            /
          </kbd>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => navigate('/share')}
            className="p-2.5 rounded-xl text-ink-500 hover:bg-ink-100 transition"
            title="Compartir con un médico"
          >
            <Share2 size={18} />
          </button>

          <div className="relative" ref={ref}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className={`flex items-center gap-2 rounded-full transition ${
                isDependent ? 'bg-primary-500 text-white hover:bg-primary-600' : 'bg-mint-100 text-mint-700 hover:bg-mint-200'
              }`}
            >
              <span className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm">
                {initials(active?.name)}
              </span>
              {isDependent && <Users size={15} className="mr-2" />}
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-lift border border-ink-100 p-1.5 fade-up max-h-[80vh] overflow-y-auto">
                <div className="px-3 py-2 border-b border-ink-100 mb-1">
                  <p className="text-sm font-semibold text-ink-900 truncate">{active?.name}</p>
                  <p className="text-xs text-ink-400 truncate">
                    {isDependent ? relationLabel(active) : user?.email}
                  </p>
                </div>

                <p className="px-3 pt-2 pb-1 text-[11px] font-semibold text-ink-400 uppercase tracking-wide">
                  Ver historial de
                </p>
                <button
                  onClick={() => selectProfile(null)}
                  className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm hover:bg-ink-50 ${
                    !isDependent ? 'text-primary-700 font-semibold' : 'text-ink-700'
                  }`}
                >
                  <span className="w-6 h-6 rounded-full bg-mint-100 text-mint-700 flex items-center justify-center text-[10px] font-bold">
                    {initials(user?.name)}
                  </span>
                  <span className="flex-1 text-left truncate">Mi historial</span>
                  {!isDependent && <BadgeCheck size={14} className="text-primary-500" />}
                </button>
                {profiles
                  .filter((p) => p.id !== user?.id)
                  .map((p) => (
                    <button
                      key={p.id}
                      onClick={() => selectProfile(p.id)}
                      className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm hover:bg-ink-50 ${
                        activeProfile === p.id ? 'text-primary-700 font-semibold' : 'text-ink-700'
                      }`}
                    >
                      <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-[10px] font-bold">
                        {initials(p.name)}
                      </span>
                      <span className="flex-1 text-left truncate">{p.name}</span>
                      <span className="text-[10px] text-ink-400">{relationLabel(p)}</span>
                      {activeProfile === p.id && <BadgeCheck size={14} className="text-primary-500" />}
                    </button>
                  ))}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigate('/family');
                  }}
                  className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 mt-1"
                >
                  <Users size={16} />
                  <span className="flex-1 text-left">Administrar familia</span>
                  <ChevronRight size={15} />
                </button>

                <div className="border-t border-ink-100 mt-1 pt-1">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      navigate('/settings');
                    }}
                    className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink-700 hover:bg-ink-50"
                  >
                    Configuración
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={16} />
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
});
