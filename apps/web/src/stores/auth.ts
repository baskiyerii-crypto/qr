import { create } from 'zustand';
import type { AuthUser } from '@qr/shared';
import { clearSession } from '@/lib/auth-routes';

interface AuthState {
  user: AuthUser | null;
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },
  logout: () => {
    clearSession();
    set({ user: null });
  },
  loadFromStorage: () => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) set({ user: JSON.parse(raw) });
    } catch {
      clearSession();
      set({ user: null });
    }
  },
}));
