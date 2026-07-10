const API_URL = import.meta.env.VITE_API_URL || '/api';

export interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class ApiClient {
  private getToken() {
    return localStorage.getItem('accessToken');
  }

  async request<T>(path: string, options: RequestInit = {}, retried = false): Promise<T> {
    const token = this.getToken();
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    if (res.status === 401 && !retried) {
      const refreshed = await this.tryRefresh();
      if (refreshed) return this.request<T>(path, options, true);
      localStorage.clear();
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    const raw = await res.text();
    let json: any = null;
    try {
      json = raw ? JSON.parse(raw) : null;
    } catch {
      json = null;
    }
    if (!res.ok) throw new Error(json?.error || json?.message || 'İstek başarısız');
    return (json?.data ?? json) as T;
  }

  async download(path: string, filename: string): Promise<void> {
    const token = this.getToken();
    const res = await fetch(`${API_URL}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.status === 401) {
      const refreshed = await this.tryRefresh();
      if (refreshed) return this.download(path, filename);
      localStorage.clear();
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    if (!res.ok) throw new Error('İndirme başarısız');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  private async tryRefresh() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;
      const json = await res.json();
      localStorage.setItem('accessToken', json.data.accessToken);
      localStorage.setItem('refreshToken', json.data.refreshToken);
      return true;
    } catch {
      return false;
    }
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

  delete<T>(path: string) {
    return this.request<T>(path, { method: 'DELETE' });
  }

  async upload<T>(path: string, file: File, fieldName = 'file'): Promise<T> {
    const token = this.getToken();
    const form = new FormData();
    form.append(fieldName, file);
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    if (res.status === 401) {
      const refreshed = await this.tryRefresh();
      if (refreshed) return this.upload<T>(path, file, fieldName);
      localStorage.clear();
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    const raw = await res.text();
    let json: any = null;
    try {
      json = raw ? JSON.parse(raw) : null;
    } catch {
      json = null;
    }
    if (!res.ok) throw new Error(json?.error || json?.message || 'Yükleme başarısız');
    return (json?.data ?? json) as T;
  }
}

export const api = new ApiClient();
