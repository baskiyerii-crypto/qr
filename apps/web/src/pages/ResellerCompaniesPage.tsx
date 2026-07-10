import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from '@tanstack/react-router';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Field } from '@/components/ui/Label';
import { Modal } from '@/components/ui/Modal';
import { StatCard } from '@/components/ui/StatCard';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/StatCard';
import { Plus, Building2, ArrowLeft, QrCode } from 'lucide-react';

export function ResellerCompaniesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    companyName: '', email: '', password: '', firstName: '', lastName: '', phone: '',
  });

  const { data } = useQuery({
    queryKey: ['reseller-dashboard'],
    queryFn: () => api.get<{ companies: Array<{ id: string; name: string; employeeCount: number; commission: number }> }>('/reseller/dashboard'),
  });

  const create = useMutation({
    mutationFn: () => api.post('/reseller/companies', form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reseller-dashboard'] });
      setShowForm(false);
      setForm({ companyName: '', email: '', password: '', firstName: '', lastName: '', phone: '' });
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Müşterilerim"
        description="Bayilik altındaki şirketler"
        icon={<Building2 className="h-5 w-5" />}
        actions={<Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> Yeni Müşteri</Button>}
      />

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Yeni Müşteri" size="lg">
        <form id="reseller-company-form" onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="grid gap-4 sm:grid-cols-2">
          <Field label="Şirket adı"><Input placeholder="Şirket adı" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} required /></Field>
          <Field label="İletişim telefonu"><Input placeholder="Telefon" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></Field>
          <Field label="Yönetici adı"><Input placeholder="Ad" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required /></Field>
          <Field label="Yönetici soyadı"><Input placeholder="Soyad" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required /></Field>
          <Field label="Yönetici e-posta" className="sm:col-span-2"><Input placeholder="ornek@firma.com" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></Field>
          <Field label="Geçici şifre" hint="En az 8 karakter" className="sm:col-span-2"><Input placeholder="••••••••" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} /></Field>
        </form>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>İptal</Button>
          <Button type="submit" form="reseller-company-form" disabled={create.isPending}>Müşteri Oluştur</Button>
        </div>
      </Modal>

      {data?.companies.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.companies.map((c) => (
            <Link key={c.id} to="/reseller/companies/$id" params={{ id: c.id }}>
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

type Performance = {
  activeEmployees: number;
  checkInRate30d: number;
  taskCompletionRate: number;
  attendanceRecords30d: number;
};

export function ResellerCompanyDetailPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const { data, isLoading } = useQuery({
    queryKey: ['reseller-company', id],
    queryFn: () => api.get<{
      name: string; monthlySubscriptionFee: number; qrToken: string;
      branches: Array<{ name: string }>;
      employees: Array<{ user: { firstName: string; lastName: string; email: string; isActive: boolean; publicId: string }; position: string | null }>;
      _count: { employees: number; attendanceRecords: number };
      performance: Performance;
    }>(`/reseller/companies/${id}`),
  });

  const { data: qr } = useQuery({
    queryKey: ['reseller-company-qr', id],
    queryFn: () => api.get<{ qrImageDataUrl: string; companyName: string }>(`/reseller/companies/${id}/qr`),
  });

  if (isLoading) return <p className="text-slate-500">Yükleniyor...</p>;

  const perf = data?.performance;

  return (
    <div className="space-y-6">
      <Link to="/reseller/companies" className="inline-flex items-center gap-1 text-sm text-slate-500 transition-colors hover:text-slate-700"><ArrowLeft className="h-4 w-4" /> Müşteriler</Link>
      <PageHeader
        title={data?.name ?? 'Müşteri'}
        description={`${data?._count.employees ?? 0} personel · ${Number(data?.monthlySubscriptionFee).toLocaleString('tr-TR')} ₺/ay`}
        icon={<Building2 className="h-5 w-5" />}
      />

      {perf && (
        <div className="grid gap-4 sm:grid-cols-4">
          <StatCard title="Aktif personel" value={perf.activeEmployees} />
          <StatCard title="Check-in oranı (30g)" value={`%${perf.checkInRate30d}`} />
          <StatCard title="Görev tamamlama" value={`%${perf.taskCompletionRate}`} />
          <StatCard title="Yoklama (30g)" value={perf.attendanceRecords30d} />
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Müşteri QR Kodu</CardTitle></CardHeader>
        <p className="mb-4 text-sm text-slate-500">Personeller bu QR ile giriş/çıkış yapar. Her müşterinin QR kodu ayrıdır.</p>
        {qr?.qrImageDataUrl && (
          <div className="flex flex-col items-center gap-4">
            <img src={qr.qrImageDataUrl} alt="QR" className="max-w-xs rounded-xl border border-slate-200" />
            <a href={qr.qrImageDataUrl} download={`qr-${data?.name}.png`} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"><QrCode className="h-4 w-4" /> QR İndir</a>
          </div>
        )}
      </Card>

      <Card padded={false}>
        <CardHeader className="border-b border-slate-100 px-6 py-4"><CardTitle>Şubeler</CardTitle></CardHeader>
        <div className="divide-y divide-slate-100">
          {data?.branches.map((b, i) => <p key={i} className="px-6 py-3 text-sm text-slate-700">{b.name}</p>)}
          {!data?.branches.length && <p className="px-6 py-6 text-center text-sm text-slate-400">Şube yok</p>}
        </div>
      </Card>

      <Card padded={false}>
        <CardHeader className="border-b border-slate-100 px-6 py-4"><CardTitle>Personel Listesi</CardTitle></CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-6 py-3">ID</th><th className="px-6 py-3">Ad</th><th className="px-6 py-3">E-posta</th><th className="px-6 py-3">Pozisyon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.employees.map((e, i) => (
                <tr key={i} className="transition-colors hover:bg-slate-50">
                  <td className="px-6 py-3 font-mono text-xs">{e.user.publicId}</td>
                  <td className="px-6 py-3 font-medium text-slate-900">{e.user.firstName} {e.user.lastName}</td>
                  <td className="px-6 py-3 text-slate-500">{e.user.email}</td>
                  <td className="px-6 py-3">{e.position || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
