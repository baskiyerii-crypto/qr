import { api } from './api';
import * as SecureStore from 'expo-secure-store';
import type { AuthUser } from '@qr/shared';

export type PlatformConfig = {
  requireEmployeeLocation: boolean;
};

let cache: PlatformConfig | null = null;

async function readFromStoredUser(): Promise<PlatformConfig | null> {
  try {
    const raw = await SecureStore.getItemAsync('user');
    if (!raw) return null;
    const user = JSON.parse(raw) as AuthUser;
    if (typeof user.requireEmployeeLocation === 'boolean') {
      return { requireEmployeeLocation: user.requireEmployeeLocation };
    }
  } catch {
    // ignore
  }
  return null;
}

export async function getPlatformConfig(force = false): Promise<PlatformConfig> {
  if (!force && cache) return cache;

  const stored = await readFromStoredUser();
  if (!force && stored) {
    cache = stored;
    return stored;
  }

  try {
    const data = await api.get<PlatformConfig>('/platform/config');
    cache = {
      requireEmployeeLocation: data.requireEmployeeLocation === true,
    };
    return cache;
  } catch {
    if (stored) {
      cache = stored;
      return stored;
    }
    cache = { requireEmployeeLocation: false };
    return cache;
  }
}

export function clearPlatformConfigCache() {
  cache = null;
}
