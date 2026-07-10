import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Field } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/StatCard';
import { Plus, Store } from 'lucide-react';

export function MarketerResellersPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    companyName: '', email: '', password: '', firstName: '', lastName: '', phone: '', code: '', commissionRate: '15',
  });

  const { data } = useQuery({
    queryKey: ['marketer-resellers'],
    queryFn: () => api.get<Array<{ id: string; companyName: string; code: string; commissionRate: number; _count: { companies: number }; user: { email: string } }>>('/marketer/resellers'),
  });

  const create = useMutation({
    mutationFn: () => api.post('/marketer/resellers', {
      ...form,
      code: form.code.toUpperCase(),
      commissionRate: parseFloat(form.commissionRate) / 100,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marketer-resellers'] });
      qc.invalidateQueries({ queryKey: ['marketer-dashboard'] });
      setShowForm(false);
      setForm({ companyName: '', email: '', password: '', firstName: '', lastName: '', phone: '', code: '', commissionRate: '15' });
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bayilerim"
        description="Kendi bayilerinizi oluşturun ve yönetin"
        icon={<Store className="h-5 w-5" />}
        actions={<Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> Yeni Bayi</Button>}
      />

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Yeni Bayi" size="lg">
        <form id="mkt-reseller-form" onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="grid gap-4 sm:grid-cols-2">
          <Field label="Bayi firma adı"><Input placeholder="Firma adı" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} required /></Field>
          <Field label="Bayi kodu"><Input placeholder="Kod" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required /></Field>
          <Field label="Ad"><Input placeholder="Ad" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required /></Field>
          <Field label="Soyad"><Input placeholder="Soyad" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required /></Field>
          <Field label="Telefon"><Input placeholder="Telefon" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required /></Field>
          <Field label="Komisyon %"><Input placeholder="15" type="number" value={form.commissionRate} onChange={(e) => setForm({ ...form, commissionRate: e.target.value })} /></Field>
          <Field label="E-posta" className="sm:col-span-2"><Input placeholder="ornek@firma.com" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></Field>
          <Field label="Şifre" hint="En az 8 karakter" className="sm:col-span-2"><Input placeholder="••••••••" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} /></Field>
        </form>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>İptal</Button>
          <Button type="submit" form="mkt-reseller-form" disabled={create.isPending}>Bayi Oluştur</Button>
        </div>
      </Modal>

      {data && data.length > 0 ? (
        <div className="grid gap-4">
          {data.map((r) => (
            <Card key={r.id} hover>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">{r.companyName}</p>
                  <p className="flex items-center gap-2 text-sm text-slate-500">{r.user.email} <Badge variant="primary">{r.code}</Badge></p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-medium text-slate-900">%{(r.commissionRate * 100).toFixed(0)} komisyon</p>
                  <p className="text-slate-500">{r._count.companies} müşteri</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card><EmptyState title="Bayi yok" description="İlk bayinizi oluşturun." icon={<Store className="h-6 w-6" />} /></Card>
      )}
    </div>
  );
}
