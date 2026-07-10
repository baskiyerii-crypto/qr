import { useState } from 'react';
import { useNavigate, Link } from '@tanstack/react-router';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { getHomeRoute } from '@/lib/auth-routes';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Field } from '@/components/ui/Label';
import { MarketingHeader } from '@/components/layout/MarketingHeader';
import { MarketingFooter } from '@/components/layout/MarketingFooter';
import { QrCode, CheckCircle2 } from 'lucide-react';

const highlights = [
  'QR ile anlık giriş-çıkış kaydı',
  'Geofence ile konum doğrulama',
  'Puantaj, izin ve bordro tek panelde',
  'Excel ile toplu personel yükleme',
];

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api.post<{
        accessToken: string;
        refreshToken: string;
        user: Parameters<typeof setAuth>[0];
      }>('/auth/login', { email, password });
      setAuth(data.user, data.accessToken, data.refreshToken);
      navigate({ to: getHomeRoute(data.user.role) });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingHeader />

      <div className="flex flex-1">
        <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-stone-950 p-12 text-white lg:flex">
          <img src="/marketing/hero-bg.png" alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-60" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-stone-950/50 via-stone-950/60 to-stone-950/90" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-sky-400">
                <QrCode className="h-5 w-5" />
              </div>
              <span className="text-xl font-semibold">QR Personel</span>
            </div>
            <h1 className="mt-16 text-4xl font-bold leading-tight tracking-tight">
              Yönetim paneline hoş geldiniz
            </h1>
            <p className="mt-4 text-lg text-stone-300">
              Şirket yöneticisi, İK, bayi veya süper admin hesabınızla giriş yapın.
            </p>
            <ul className="mt-8 space-y-3">
              {highlights.map((item) => (
                <li key={item} className="flex items-center gap-2 text-stone-200">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <p className="relative text-sm text-stone-300">
            Personel misiniz?{' '}
            <span className="text-white">Mobil uygulamadan giriş yapın.</span>
          </p>
        </div>

        <div className="flex w-full flex-col items-center justify-center p-6 sm:p-10 lg:w-1/2">
          <Card className="w-full max-w-md shadow-elevated">
            <CardHeader>
              <div>
                <CardTitle className="text-xl">Giriş Yap</CardTitle>
                <CardDescription>E-posta ve şifrenizle yönetim paneline erişin</CardDescription>
              </div>
            </CardHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="E-posta">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@firma.com"
                  required
                />
              </Field>
              <Field label="Şifre">
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Field>
              {error && (
                <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-600 dark:text-rose-400">{error}</p>
              )}
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              Hesabınız yok mu?{' '}
              <Link to="/register" className="font-medium text-foreground hover:underline">
                Ücretsiz şirket kaydı
              </Link>
            </p>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              <Link to="/" className="hover:text-foreground hover:underline">
                ← Ana sayfaya dön
              </Link>
            </p>
          </Card>
        </div>
      </div>

      <MarketingFooter />
    </div>
  );
}
