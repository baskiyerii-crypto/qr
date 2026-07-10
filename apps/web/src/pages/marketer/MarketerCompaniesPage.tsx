import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from '@tanstack/react-router';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Field } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/StatCard';
import { Plus, Building2 } from 'lucide-react';

export function MarketerCompaniesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    companyName: '', email: '', password: '', firstName: '', lastName: '', phone: '',
  });

  const { data } = useQuery({
    queryKey: ['marketer-dashboard'],
    queryFn: () => api.get<{ directCompanies: Array<{ id: string; name: string; employeeCount: number }> }>('/marketer/dashboard'),
  });

  const create = useMutation({
    mutationFn: () => api.post('/marketer/companies', form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marketer-dashboard'] });
      setShowForm(false);
      setForm({ companyName: '', email: '', password: '', firstName: '', lastName: '', phone: '' });
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Doğrudan Müşteriler"
        description="Pazarlamacı olarak eklediğiniz şirketler"
        icon={<Building2 className="h-5 w-5" />}
        actions={<Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> Yeni Müşteri</Button>}
      />

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Yeni Müşteri" size="lg">
        <form id="mkt-company-form" onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="grid gap-4 sm:grid-cols-2">
          <Field label="Şirket adı"><Input placeholder="Şirket adı" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} required /></Field>
          <Field label="Telefon"><Input placeholder="Telefon" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></Field>
          <Field label="Yönetici adı"><Input placeholder="Ad" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required /></Field>
          <Field label="Yönetici soyadı"><Input placeholder="Soyad" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required /></Field>
          <Field label="E-posta" className="sm:col-span-2"><Input placeholder="ornek@firma.com" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></Field>
          <Field label="Şifre" hint="En az 8 karakter" className="sm:col-span-2"><Input placeholder="••••••••" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} /></Field>
        </form>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>İptal</Button>
          <Button type="submit" form="mkt-company-form" disabled={create.isPending}>Müşteri Oluştur</Button>
        </div>
      </Modal>

      {data?.directCompanies.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.directCompanies.map((c) => (
            <Link key={c.id} to="/marketer/companies/$id" params={{ id: c.id }}>
              <Card hover>
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-900">{c.name}</p>
                  <Badge variant="primary">{c.employeeCount} personel</Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card><EmptyState title="Müşteri yok" description="İlk müşterinizi ekleyin." icon={<Building2 className="h-6 w-6" />} /></Card>
      )}
    </div>
  );
}

export function MarketerCompanyDetailPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const { data, isLoading } = useQuery({
    queryKey: ['marketer-company', id],
    queryFn: () => api.get<{
      name: string; monthlySubscriptionFee: number; qrToken: string;
      reseller?: { companyName: string; code: string } | null;
      branches: Array<{ name: string }>;
      employees: Array<{ user: { firstName: string; lastName: string; publicId: string }; position: string | null }>;
      performance: { activeEmployees: number; checkInRate30d: number; taskCompletionRate: number };
    }>(`/marketer/companies/${id}`),
  });
  const { data: qr } = useQuery({
    queryKey: ['marketer-company-qr', id],
    queryFn: () => api.get<{ qrImageDataUrl: string }>(`/marketer/companies/${id}/qr`),
  });

  if (isLoading) return <p className="text-slate-500">Yükleniyor...</p>;
  const perf = data?.performance;

  return (
    <div className="space-y-6">
      <PageHeader
        title={data?.name ?? 'Müşteri'}
        description={data?.reseller ? `Bayi: ${data.reseller.companyName} (${data.reseller.code})` : 'Doğrudan müşteri'}
        icon={<Building2 className="h-5 w-5" />}
      />
      {qr && (
        <Card className="text-center">
          <p className="mb-2 font-medium text-slate-900">Kayıt QR Kodu</p>
          <img src={qr.qrImageDataUrl} alt="QR" className="mx-auto h-48 w-48" />
        </Card>
      )}
      {perf && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard title="Aktif personel" value={perf.activeEmployees} />
          <StatCard title="Giriş oranı" value={`${perf.checkInRate30d}%`} />
          <StatCard title="Görev tamamlama" value={`${perf.taskCompletionRate}%`} />
        </div>
      )}
      <Card padded={false}>
        <CardHeader className="border-b border-slate-100 px-6 py-4"><CardTitle>Personel</CardTitle></CardHeader>
        <div className="divide-y divide-slate-100">
          {data?.employees.map((e, i) => (
            <div key={i} className="px-6 py-3 text-sm text-slate-700">{e.user.firstName} {e.user.lastName} — {e.user.publicId} — {e.position || '—'}</div>
          ))}
          {!data?.employees.length && <p className="px-6 py-6 text-center text-sm text-slate-400">Personel yok</p>}
        </div>
      </Card>
    </div>
  );
}
