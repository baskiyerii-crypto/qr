import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Field } from '@/components/ui/Label';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

export function InvitePage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const params = new URLSearchParams(window.location.search);
  const token = params.get('token') || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Şifreler eşleşmiyor');
      return;
    }
    if (!token) {
      setError('Geçersiz davet bağlantısı');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await api.post<{
        accessToken: string;
        refreshToken: string;
        user: Parameters<typeof setAuth>[0];
      }>('/auth/accept-invite', { token, password });
      setAuth(data.user, data.accessToken, data.refreshToken);
      navigate({ to: '/dashboard' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Davet kabul edilemedi');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface p-8">
        <Card className="w-full max-w-md shadow-elevated">
          <CardHeader>
            <CardTitle>Geçersiz Davet</CardTitle>
            <CardDescription>Davet bağlantısı eksik veya süresi dolmuş</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-8">
      <Card className="w-full max-w-md shadow-elevated">
        <CardHeader>
          <CardTitle>Personel Daveti</CardTitle>
          <CardDescription>Hesabınızı aktifleştirmek için şifre belirleyin</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Şifre" hint="En az 8 karakter">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          </Field>
          <Field label="Şifre tekrar">
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} />
          </Field>
          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Kaydediliyor...' : 'Hesabı Aktifleştir'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
