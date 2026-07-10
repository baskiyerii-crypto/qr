import { create } from 'zustand';

const STORAGE_KEY = 'sidebar-collapsed';

function readCollapsed(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) === '1';
}

interface SidebarState {
  collapsed: boolean;
  init: () => void;
  toggle: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

export const useSidebarStore = create<SidebarState>((set, get) => ({
  collapsed: false,
  init: () => set({ collapsed: readCollapsed() }),
  toggle: () => {
    const next = !get().collapsed;
    localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    set({ collapsed: next });
  },
  setCollapsed: (collapsed) => {
    localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
    set({ collapsed });
  },
}));
