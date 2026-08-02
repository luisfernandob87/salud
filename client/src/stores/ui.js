import { create } from 'zustand';

let toastId = 0;

export const useUi = create((set, get) => ({
  toasts: [],
  quickAddOpen: false,
  refreshKey: 0,

  bumpRefresh() {
    set((s) => ({ refreshKey: s.refreshKey + 1 }));
  },

  toast(message, type = 'info') {
    const id = ++toastId;
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => get().dismissToast(id), 4000);
  },

  dismissToast(id) {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },

  setQuickAddOpen(open) {
    set({ quickAddOpen: open });
  },
}));
