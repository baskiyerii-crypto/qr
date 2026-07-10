import { useState } from 'react';
import { useNavigate, Link } from '@tanstack/react-router';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Field } from '@/components/ui/Label';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { MarketingHeader } from '@/components/layout/MarketingHeader';
import { MarketingFooter } from '@/components/layout/MarketingFooter';
import { Building2, Clock, FileSpreadsheet, HandCoins } from 'lucide-react';

const perks = [
  { icon: Clock, text: '15 dakikada kurulum' },
  { icon: FileSpreadsheet, text: 'Excel ile toplu personel' },
  { icon: Building2, text: 'Çok şubeli yapı desteği' },
  { icon: HandCoins, text: 'Bayi koduyla komisyon kazanımı' },
];

export function RegisterPage() {
  const params = new URLSearchParams(window.location.search);
  const [form, setForm] = useState({
    companyName: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    resellerCode: params.get('code') || '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.post<{
        accessToken: string;
        refreshToken: string;
        user: Parameters<typeof setAuth>[0];
      }>('/auth/register', form);
      setAuth(data.user, data.accessToken, data.refreshToken);
      navigate({ to: '/onboarding' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <MarketingHeader />

      <div className="flex flex-1 flex-col items-center px-4 py-10 sm:px-6 lg:flex-row lg:items-start lg:justify-center lg:gap-12 lg:py-16">
        <div className="mb-8 max-w-md lg:mb-0 lg:mt-8 lg:max-w-sm">
          <h1 className="text-2xl font-bold text-primary lg:text-3xl">Şirketinizi kaydedin</h1>
          <p className="mt-3 text-slate-600">
            Ücretsiz hesap açın, şubenizi oluşturun ve personel devam takibine bugün başlayın.
            Kredi kartı gerekmez.
          </p>
          <ul className="mt-6 space-y-3">
            {perks.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-slate-700">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                {text}
              </li>
            ))}
          </ul>
          {form.resellerCode && (
            <p className="mt-6 rounded-xl bg-muted px-4 py-3 text-sm text-primary">
              Bayi kodu uygulandı: <strong>{form.resellerCode}</strong>
            </p>
          )}
        </div>

        <Card className="w-full max-w-lg shadow-elevated">
          <CardHeader>
            <CardTitle>Ücretsiz Başla</CardTitle>
            <CardDescription>Şirket ve yönetici hesabınızı oluşturun</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <Field label="Şirket Adı" className="sm:col-span-2">
              <Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} placeholder="Örn: ABC Ltd. Şti." required />
            </Field>
            <Field label="Ad">
              <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
            </Field>
            <Field label="Soyad">
              <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
            </Field>
            <Field label="E-posta" className="sm:col-span-2">
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </Field>
            <Field label="İletişim Telefonu" className="sm:col-span-2">
              <Input placeholder="05XX XXX XX XX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required minLength={10} />
            </Field>
            <Field label="Şifre" hint="En az 8 karakter" className="sm:col-span-2">
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
            </Field>
            <Field label="Bayi Kodu (varsa)" hint="Bayi üzerinden kayıt oluyorsanız kodunuzu girin" className="sm:col-span-2">
              <Input placeholder="DEMO-BAYI" value={form.resellerCode} onChange={(e) => setForm({ ...form, resellerCode: e.target.value.toUpperCase() })} />
            </Field>
            {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 sm:col-span-2">{error}</p>}
            <div className="sm:col-span-2">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Kaydediliyor...' : 'Hesap Oluştur'}
              </Button>
            </div>
          </form>
          <p className="mt-4 text-center text-sm text-slate-500">
            Zaten hesabınız var mı?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Giriş yap
            </Link>
          </p>
          <p className="mt-2 text-center text-sm text-slate-400">
            <Link to="/" className="transition-colors hover:text-primary hover:underline">
              ← Ana sayfaya dön
            </Link>
          </p>
        </Card>
      </div>

      <MarketingFooter />
    </div>
  );
}
