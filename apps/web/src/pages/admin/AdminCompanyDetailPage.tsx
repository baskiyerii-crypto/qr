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

type CompanyDetail = {
  id: string;
  name: string;
  qrToken: string;
  monthlySubscriptionFee: number;
  createdAt: string;
  reseller: { id: string; companyName: string; code: string } | null;
  marketer: { id: string; companyName: string; code: string } | null;
  subscription: {
    id: string;
    status: string;
    plan: { name: string; monthlyPrice: number };
    lastPaymentAt: string | null;
    nextBillingAt: string | null;
  } | null;
  branches: Array<{ id: string; name: string }>;
  _count: { employees: number; branches: number };
  payments: Array<{
    id: string;
    amount: number;
    status: string;
    createdAt: string;
    plan: { name: string } | null;
  }>;
};

type Reseller = { id: string; companyName: string; code: string };
type Marketer = { id: string; companyName: string; code: string };

export function AdminCompanyDetailPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const qc = useQueryClient();

  const { data: company } = useQuery({
    queryKey: ['admin-company', id],
    queryFn: () => api.get<CompanyDetail>(`/admin/companies/${id}`),
  });

  const { data: resellers } = useQuery({
    queryKey: ['admin-resellers'],
    queryFn: () => api.get<Reseller[]>('/admin/resellers'),
  });

  const { data: marketers } = useQuery({
    queryKey: ['admin-marketers'],
    queryFn: () => api.get<Marketer[]>('/admin/marketers'),
  });

  const update = useMutation({
    mutationFn: (body: { resellerId?: string | null; marketerId?: string | null; monthlySubscriptionFee?: number }) =>
      api.patch(`/admin/companies/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-company', id] }),
  });

  const suspendSub = useMutation({
    mutationFn: () => api.patch(`/admin/subscriptions/${company!.subscription!.id}`, { status: 'CANCELLED' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-company', id] }),
  });

  if (!company) return <p className="text-slate-500">Yükleniyor…</p>;

  return (
    <div className="space-y-6">
      <Link to="/admin/companies" className="inline-flex items-center gap-1 text-sm text-slate-500 transition-colors hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Şirketler
      </Link>
      <h1 className="text-2xl font-semibold text-slate-900">{company.name}</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Bilgiler</CardTitle></CardHeader>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">QR Token</dt><dd className="font-mono text-xs">{company.qrToken.slice(0, 8)}…</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Personel</dt><dd className="font-medium text-slate-900">{company._count.employees}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Şube</dt><dd className="font-medium text-slate-900">{company._count.branches}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Kayıt</dt><dd>{new Date(company.createdAt).toLocaleDateString('tr-TR')}</dd></div>
          </dl>
        </Card>

        <Card>
          <CardHeader><CardTitle>Abonelik</CardTitle></CardHeader>
          {company.subscription ? (
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Plan</dt><dd className="font-medium text-slate-900">{company.subscription.plan.name} ({company.subscription.plan.monthlyPrice} ₺)</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Durum</dt><dd><Badge variant={company.subscription.status === 'ACTIVE' ? 'success' : 'default'} dot>{company.subscription.status}</Badge></dd></div>
              {company.subscription.status === 'ACTIVE' && (
                <Button size="sm" variant="danger" onClick={() => suspendSub.mutate()} disabled={suspendSub.isPending}>Askıya Al</Button>
              )}
            </dl>
          ) : <p className="text-sm text-slate-500">Abonelik yok</p>}
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Bayi, Pazarlamacı & Ücret</CardTitle></CardHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Bayi">
            <Select defaultValue={company.reseller?.id ?? ''} onChange={(e) => update.mutate({ resellerId: e.target.value || null })}>
              <option value="">Doğrudan (bayi yok)</option>
              {resellers?.map((r) => <option key={r.id} value={r.id}>{r.companyName} ({r.code})</option>)}
            </Select>
          </Field>
          <Field label="Pazarlamacı">
            <Select defaultValue={company.marketer?.id ?? ''} onChange={(e) => update.mutate({ marketerId: e.target.value || null })}>
              <option value="">Yok</option>
              {marketers?.map((m) => <option key={m.id} value={m.id}>{m.companyName} ({m.code})</option>)}
            </Select>
          </Field>
          <Field label="Aylık ücret (₺)">
            <Input type="number" defaultValue={company.monthlySubscriptionFee} onBlur={(e) => update.mutate({ monthlySubscriptionFee: parseFloat(e.target.value) })} />
          </Field>
        </div>
      </Card>

      <Card padded={false}>
        <CardHeader className="border-b border-slate-100 px-6 py-4"><CardTitle>Son Ödemeler</CardTitle></CardHeader>
        <div className="divide-y divide-slate-100">
          {company.payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-6 py-3 text-sm">
              <span className="text-slate-500">{new Date(p.createdAt).toLocaleDateString('tr-TR')}</span>
              <span>{p.plan?.name ?? '—'}</span>
              <span>{p.amount} ₺</span>
              <Badge variant={p.status === 'SUCCESS' || p.status === 'PAID' ? 'success' : 'default'}>{p.status}</Badge>
            </div>
          ))}
          {!company.payments.length && <p className="px-6 py-6 text-center text-sm text-slate-400">Ödeme yok</p>}
        </div>
      </Card>
    </div>
  );
}
