import { create } from 'zustand';
import { api } from '../api/client';
import { setActiveProfile } from '../utils/activeProfile';
import { useUi } from './ui';

const PROFILE_KEY = 'salud_active_profile';

function readStoredProfile() {
  const raw = localStorage.getItem(PROFILE_KEY);
  const id = raw ? Number(raw) : null;
  return Number.isInteger(id) ? id : null;
}

export const useAuth = create((set, get) => ({
  user: null,
  loading: true,
  error: null,
  profiles: [],
  familyLoaded: false,
  activeProfile: null, // id del perfil en vista; null = el propio usuario

  async fetchMe() {
    set({ loading: true });
    try {
      const data = await api.get('/api/auth/me');
      set({ user: data.user, loading: false, error: null });
      get().restoreProfile();
    } catch (err) {
      set({ user: null, loading: false, error: err.status === 401 ? null : err.message });
    }
  },

  async fetchFamily() {
    try {
      const data = await api.get('/api/family');
      const profiles = data.profiles || [];
      set({ profiles, familyLoaded: true });
      const dropped = get().restoreProfile(profiles);
      if (dropped) useUi.getState().bumpRefresh();
    } catch (err) {
      set({ familyLoaded: true });
    }
  },

  // Restaura la selección guardada si sigue siendo accesible. Devuelve true si
  // se descartó una selección previa (para recargar las vistas).
  restoreProfile(profiles) {
    const stored = readStoredProfile();
    const user = get().user;
    if (!user) {
      setActiveProfile(null);
      set({ activeProfile: null });
      return false;
    }
    if (stored && stored !== user.id) {
      const list = profiles || get().profiles;
      const loaded = get().familyLoaded || Boolean(profiles);
      if (loaded && !list.some((p) => p.id === stored)) {
        setActiveProfile(null);
        set({ activeProfile: null });
        localStorage.removeItem(PROFILE_KEY);
        return true;
      }
      setActiveProfile(stored);
      set({ activeProfile: stored });
      return false;
    }
    setActiveProfile(null);
    set({ activeProfile: null });
    return false;
  },

  setProfile(id) {
    const user = get().user;
    const next = id && id !== user?.id ? id : null;
    setActiveProfile(next);
    set({ activeProfile: next });
    if (next) {
      localStorage.setItem(PROFILE_KEY, String(next));
    } else {
      localStorage.removeItem(PROFILE_KEY);
    }
  },

  refreshProfiles() {
    return get().fetchFamily();
  },

  async login(email, password) {
    const data = await api.post('/api/auth/login', { email, password });
    set({ user: data.user, loading: false, error: null });
    await get().fetchFamily();
    get().restoreProfile();
    return data.user;
  },

  async register(name, email, password, claimCode) {
    const data = await api.post('/api/auth/register', { name, email, password, claim_code: claimCode || undefined });
    set({ user: data.user, loading: false, error: null });
    await get().fetchFamily();
    get().restoreProfile();
    return data.user;
  },

  async logout() {
    try {
      await api.post('/api/auth/logout');
    } catch (err) {
      /* ignore */
    }
    setActiveProfile(null);
    localStorage.removeItem(PROFILE_KEY);
    set({ user: null, profiles: [], familyLoaded: false, activeProfile: null });
  },

  setUser(user) {
    set({ user });
  },
}));
