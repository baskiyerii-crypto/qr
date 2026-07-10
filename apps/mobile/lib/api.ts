import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const API_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  process.env.EXPO_PUBLIC_API_URL ||
  'http://localhost:3001/api';
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

function wrapNetworkError(err: unknown): Error {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('Network request failed') || msg.includes('Failed to fetch')) {
    return new Error(
      'Sunucuya bağlanılamadı. Bilgisayarınızda API çalışıyor mu? Telefon ile PC aynı Wi‑Fi ağında olmalı.',
    );
  }
  return err instanceof Error ? err : new Error(msg);
}

class MobileApi {
  private async getToken() {
    return SecureStore.getItemAsync('accessToken');
  }

  private async tryRefresh(): Promise<boolean> {
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    if (!refreshToken) return false;
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;
      const json = await res.json();
      await SecureStore.setItemAsync('accessToken', json.data.accessToken);
      await SecureStore.setItemAsync('refreshToken', json.data.refreshToken);
      return true;
    } catch {
      return false;
    }
  }

  async request<T>(path: string, options: RequestInit = {}, retried = false): Promise<T> {
    const token = await this.getToken();
    let res: Response;
    try {
      res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options.headers,
        },
      });
    } catch (err) {
      throw wrapNetworkError(err);
    }

    if (res.status === 401 && !retried) {
      const refreshed = await this.tryRefresh();
      if (refreshed) return this.request<T>(path, options, true);
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      await SecureStore.deleteItemAsync('user');
      throw new Error('Oturum süresi doldu');
    }

    const json = await res.json();
    if (!res.ok) throw new Error(json.error || json.message || 'İstek başarısız');
    return json.data ?? json;
  }

  get<T>(path: string) {
    return this.request<T>(path);
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: 'POST', body: JSON.stringify(body) });
  }

  patch<T>(path: string, body?: unknown) {
    return this.request<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
  }
}

export const api = new MobileApi();
