import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { Plus, Layers } from 'lucide-react';

type Plan = {
  id: string;
  name: string;
  slug: string;
  monthlyPrice: number;
  maxEmployees: number;
  maxBranches: number;
  platformShareRate: number;
  resellerShareRate: number;
  isActive: boolean;
  sortOrder: number;
};

const emptyPlan = {
  name: '', slug: '', monthlyPrice: '299', maxEmployees: '50', maxBranches: '1',
  platformShareRate: '70', resellerShareRate: '30', sortOrder: '0',
};

export function AdminPlansPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyPlan);

  const { data: plans } = useQuery({
    queryKey: ['admin-plans'],
    queryFn: () => api.get<Plan[]>('/admin/subscription-plans'),
  });

  const create = useMutation({
    mutationFn: () => api.post('/admin/subscription-plans', {
      name: form.name,
      slug: form.slug.toLowerCase().replace(/\s+/g, '-'),
      monthlyPrice: parseFloat(form.monthlyPrice),
      maxEmployees: parseInt(form.maxEmployees),
      maxBranches: parseInt(form.maxBranches),
      platformShareRate: parseFloat(form.platformShareRate) / 100,
      resellerShareRate: parseFloat(form.resellerShareRate) / 100,
      sortOrder: parseInt(form.sortOrder),
      isActive: true,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-plans'] });
      setShowForm(false);
      setForm(emptyPlan);
    },
  });

  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Plan> }) =>
      api.patch(`/admin/subscription-plans/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-plans'] }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Abonelik Planları"
        description="Plan fiyatları ve komisyon paylaşımları"
        icon={<Layers className="h-5 w-5" />}
        actions={<Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> Yeni Plan</Button>}
      />

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Yeni Plan" size="lg">
        <form id="plan-form" onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="grid gap-3 sm:grid-cols-2">
          <Input placeholder="Plan adı" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input placeholder="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required />
          <Input placeholder="Aylık fiyat" type="number" value={form.monthlyPrice} onChange={(e) => setForm({ ...form, monthlyPrice: e.target.value })} />
          <Input placeholder="Max personel" type="number" value={form.maxEmployees} onChange={(e) => setForm({ ...form, maxEmployees: e.target.value })} />
          <Input placeholder="Max şube" type="number" value={form.maxBranches} onChange={(e) => setForm({ ...form, maxBranches: e.target.value })} />
          <Input placeholder="Platform payı %" type="number" value={form.platformShareRate} onChange={(e) => setForm({ ...form, platformShareRate: e.target.value })} />
          <Input placeholder="Bayi payı %" type="number" value={form.resellerShareRate} onChange={(e) => setForm({ ...form, resellerShareRate: e.target.value })} />
        </form>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>İptal</Button>
          <Button type="submit" form="plan-form" disabled={create.isPending}>Oluştur</Button>
        </div>
      </Modal>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans?.map((p) => (
          <Card key={p.id} hover>
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-slate-900">{p.name}</h3>
              <Badge variant={p.isActive ? 'success' : 'default'} dot>{p.isActive ? 'Aktif' : 'Pasif'}</Badge>
            </div>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{p.monthlyPrice} ₺<span className="text-sm font-normal text-slate-500">/ay</span></p>
            <p className="mt-1 text-sm text-slate-500">{p.maxEmployees} personel · {p.maxBranches} şube</p>
            <p className="mt-1 text-sm text-slate-500">Platform %{(p.platformShareRate * 100).toFixed(0)} · Bayi %{(p.resellerShareRate * 100).toFixed(0)}</p>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => update.mutate({ id: p.id, body: { isActive: !p.isActive } })}>
                {p.isActive ? 'Pasifleştir' : 'Aktifleştir'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
