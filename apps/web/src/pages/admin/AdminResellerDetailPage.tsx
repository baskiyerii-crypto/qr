import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from '@tanstack/react-router';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Field } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeft } from 'lucide-react';

type ResellerDetail = {
  id: string;
  companyName: string;
  code: string;
  commissionRate: number;
  isActive: boolean;
  iban: string | null;
  taxNumber: string | null;
  iyzicoOnboardingStatus: string;
  iyzicoSubMerchantKey: string | null;
  assignedPlan: { id: string; name: string } | null;
  user: { email: string; firstName: string; lastName: string; isActive: boolean };
  companies: Array<{ id: string; name: string; _count: { employees: number } }>;
  payments: Array<{
    id: string;
    amount: number;
    resellerAmount: number;
    status: string;
    createdAt: string;
    company: { name: string };
    plan: { name: string } | null;
  }>;
  _count: { companies: number };
};

type Plan = { id: string; name: string };

export function AdminResellerDetailPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const qc = useQueryClient();

  const { data: reseller } = useQuery({
    queryKey: ['admin-reseller', id],
    queryFn: () => api.get<ResellerDetail>(`/admin/resellers/${id}`),
  });

  const { data: plans } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: () => api.get<Plan[]>('/admin/subscription-plans'),
  });

  const update = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.patch(`/admin/resellers/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-reseller', id] }),
  });

  if (!reseller) return <p className="text-slate-500">Yükleniyor…</p>;

  return (
    <div className="space-y-6">
      <Link to="/admin/resellers" className="inline-flex items-center gap-1 text-sm text-slate-500 transition-colors hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Bayiler
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-slate-900">{reseller.companyName}</h1>
        <Badge variant="primary">{reseller.code}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Profil</CardTitle></CardHeader>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">E-posta</dt><dd>{reseller.user.email}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Müşteri sayısı</dt><dd className="font-medium text-slate-900">{reseller._count.companies}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">iyzico</dt><dd><Badge>{reseller.iyzicoOnboardingStatus}</Badge></dd></div>
          </dl>
        </Card>

        <Card>
          <CardHeader><CardTitle>Aksiyonlar</CardTitle></CardHeader>
          <div className="space-y-3">
            <Field label="Komisyon (%)"><Input type="number" defaultValue={reseller.commissionRate * 100} onBlur={(e) => update.mutate({ commissionRate: parseFloat(e.target.value) / 100 })} /></Field>
            <Field label="IBAN"><Input defaultValue={reseller.iban ?? ''} onBlur={(e) => update.mutate({ iban: e.target.value })} /></Field>
            <Field label="Vergi No"><Input defaultValue={reseller.taxNumber ?? ''} onBlur={(e) => update.mutate({ taxNumber: e.target.value })} /></Field>
            <Field label="Atanan plan">
              <Select defaultValue={reseller.assignedPlan?.id ?? ''} onChange={(e) => update.mutate({ assignedPlanId: e.target.value || null })}>
                <option value="">Plan yok</option>
                {plans?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </Field>
            <Button variant={reseller.isActive ? 'danger' : 'primary'} size="sm" onClick={() => update.mutate({ isActive: !reseller.isActive })}>
              {reseller.isActive ? 'Pasifleştir' : 'Aktifleştir'}
            </Button>
          </div>
        </Card>
      </div>

      <Card padded={false}>
        <CardHeader className="border-b border-slate-100 px-6 py-4"><CardTitle>Bağlı Şirketler</CardTitle></CardHeader>
        <div className="divide-y divide-slate-100">
          {reseller.companies.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-6 py-3 text-sm">
              <span className="font-medium text-slate-900">{c.name}</span>
              <span className="text-slate-500">{c._count.employees} personel</span>
              <Link to="/admin/companies/$id" params={{ id: c.id }} className="font-medium text-primary hover:underline">Detay</Link>
            </div>
          ))}
          {!reseller.companies.length && <p className="px-6 py-6 text-center text-sm text-slate-400">Şirket yok</p>}
        </div>
      </Card>

      <Card padded={false}>
        <CardHeader className="border-b border-slate-100 px-6 py-4"><CardTitle>Komisyon Geçmişi</CardTitle></CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-6 py-3">Tarih</th><th className="px-6 py-3">Şirket</th><th className="px-6 py-3">Tutar</th><th className="px-6 py-3">Komisyon</th><th className="px-6 py-3">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reseller.payments.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-6 py-3">{new Date(p.createdAt).toLocaleDateString('tr-TR')}</td>
                  <td className="px-6 py-3">{p.company.name}</td>
                  <td className="px-6 py-3">{p.amount} ₺</td>
                  <td className="px-6 py-3">{p.resellerAmount} ₺</td>
                  <td className="px-6 py-3"><Badge variant={p.status === 'SUCCESS' || p.status === 'PAID' ? 'success' : 'default'}>{p.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
