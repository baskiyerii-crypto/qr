import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { AuthUser } from '@qr/shared';

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => Promise<void>;
  patchUser: (partial: Partial<AuthUser>) => Promise<void>;
  logout: () => Promise<void>;
  loadAuth: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setAuth: async (user, accessToken, refreshToken) => {
    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    await SecureStore.setItemAsync('user', JSON.stringify(user));
    set({ user, isLoading: false });
  },
  patchUser: async (partial) => {
    let next: AuthUser | null = null;
    set((state) => {
      if (!state.user) return state;
      next = { ...state.user, ...partial };
      return { user: next };
    });
    if (next) {
      await SecureStore.setItemAsync('user', JSON.stringify(next));
    }
  },
  logout: async () => {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('user');
    set({ user: null });
  },
  loadAuth: async () => {
    try {
      const raw = await SecureStore.getItemAsync('user');
      if (raw) set({ user: JSON.parse(raw), isLoading: false });
      else set({ isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },
}));
