import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from '@tanstack/react-router';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Field } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeft } from 'lucide-react';

export function AdminMarketerDetailPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const qc = useQueryClient();
  const [rate, setRate] = useState('');

  const { data } = useQuery({
    queryKey: ['admin-marketer', id],
    queryFn: () => api.get<{
      id: string; companyName: string; code: string; commissionRate: number; isActive: boolean; phone: string | null;
      user: { email: string; firstName: string; lastName: string; publicId: string };
      resellers: Array<{ id: string; companyName: string; code: string; _count: { companies: number } }>;
      companies: Array<{ id: string; name: string; _count: { employees: number } }>;
    }>(`/admin/marketers/${id}`),
  });

  const update = useMutation({
    mutationFn: (body: { commissionRate?: number; isActive?: boolean }) => api.patch(`/admin/marketers/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-marketer', id] }),
  });

  return (
    <div className="space-y-6">
      <Link to="/admin/marketers" className="inline-flex items-center gap-1 text-sm text-slate-500 transition-colors hover:text-slate-700"><ArrowLeft className="h-4 w-4" /> Pazarlamacılar</Link>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{data?.companyName}</h1>
          <p className="flex items-center gap-2 text-slate-500">{data?.user.email} <Badge variant="primary">{data?.code}</Badge></p>
        </div>
        <Button variant="secondary" onClick={() => update.mutate({ isActive: !data?.isActive })}>
          {data?.isActive ? 'Pasifleştir' : 'Aktifleştir'}
        </Button>
      </div>

      <Card>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Komisyon oranı (%)">
            <div className="flex gap-2">
              <Input type="number" placeholder={String((data?.commissionRate ?? 0) * 100)} value={rate} onChange={(e) => setRate(e.target.value)} />
              <Button onClick={() => rate && update.mutate({ commissionRate: parseFloat(rate) / 100 })}>Kaydet</Button>
            </div>
          </Field>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card padded={false}>
          <CardHeader className="border-b border-slate-100 px-6 py-4"><CardTitle>Bayiler ({data?.resellers.length})</CardTitle></CardHeader>
          <div className="divide-y divide-slate-100">
            {data?.resellers.map((r) => (
              <div key={r.id} className="flex items-center gap-2 px-6 py-3 text-sm text-slate-700">{r.companyName} <Badge variant="primary">{r.code}</Badge> — {r._count.companies} müşteri</div>
            ))}
            {!data?.resellers.length && <p className="px-6 py-6 text-center text-sm text-slate-400">Bayi yok</p>}
          </div>
        </Card>
        <Card padded={false}>
          <CardHeader className="border-b border-slate-100 px-6 py-4"><CardTitle>Doğrudan Müşteriler ({data?.companies.length})</CardTitle></CardHeader>
          <div className="divide-y divide-slate-100">
            {data?.companies.map((c) => (
              <div key={c.id} className="px-6 py-3 text-sm text-slate-700">{c.name} — {c._count.employees} personel</div>
            ))}
            {!data?.companies.length && <p className="px-6 py-6 text-center text-sm text-slate-400">Müşteri yok</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
