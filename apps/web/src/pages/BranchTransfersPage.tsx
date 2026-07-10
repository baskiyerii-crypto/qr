import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Field } from '@/components/ui/Label';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/StatCard';
import { Plus, ArrowLeftRight } from 'lucide-react';

interface Transfer {
  id: string;
  type: string;
  status: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  reason: string | null;
  employee: { user: { firstName: string; lastName: string } };
  fromBranch: { name: string } | null;
  toBranch: { name: string };
}

export function BranchTransfersPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    employeeId: '',
    toBranchId: '',
    type: 'TEMPORARY',
    effectiveFrom: '',
    effectiveTo: '',
    reason: '',
  });

  const { data: transfers } = useQuery({
    queryKey: ['branch-transfers'],
    queryFn: () => api.get<Transfer[]>('/branch-transfers'),
  });
  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: () =>
      api.get<Array<{ id: string; user: { firstName: string; lastName: string } }>>('/employees'),
  });
  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => api.get<Array<{ id: string; name: string }>>('/companies/branches'),
  });

  const create = useMutation({
    mutationFn: () =>
      api.post('/branch-transfers', {
        employeeId: form.employeeId,
        toBranchId: form.toBranchId,
        type: form.type,
        effectiveFrom: form.effectiveFrom ? new Date(form.effectiveFrom).toISOString() : undefined,
        effectiveTo:
          form.type === 'TEMPORARY' && form.effectiveTo
            ? new Date(form.effectiveTo).toISOString()
            : undefined,
        reason: form.reason || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['branch-transfers'] });
      setShowForm(false);
      setForm({ employeeId: '', toBranchId: '', type: 'TEMPORARY', effectiveFrom: '', effectiveTo: '', reason: '' });
    },
  });

  const end = useMutation({
    mutationFn: (id: string) => api.patch(`/branch-transfers/${id}/end`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['branch-transfers'] }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Şube Geçişleri"
        description="Personeli kalıcı veya geçici olarak başka şubeye atayın"
        icon={<ArrowLeftRight className="h-5 w-5" />}
        actions={<Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> Yeni Geçiş</Button>}
      />

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Yeni Şube Geçişi" size="lg">
        <form id="transfer-form" onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="grid gap-4 sm:grid-cols-2">
          <Field label="Personel">
            <Select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} required>
              <option value="">Personel seçin</option>
              {employees?.map((e) => <option key={e.id} value={e.id}>{e.user.firstName} {e.user.lastName}</option>)}
            </Select>
          </Field>
          <Field label="Hedef Şube">
            <Select value={form.toBranchId} onChange={(e) => setForm({ ...form, toBranchId: e.target.value })} required>
              <option value="">Hedef şube</option>
              {branches?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
          </Field>
          <Field label="Tür">
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="TEMPORARY">Geçici</option>
              <option value="PERMANENT">Kalıcı</option>
            </Select>
          </Field>
          <div className="hidden sm:block" />
          <Field label="Başlangıç"><Input type="date" value={form.effectiveFrom} onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })} /></Field>
          <Field label="Bitiş"><Input type="date" value={form.effectiveTo} onChange={(e) => setForm({ ...form, effectiveTo: e.target.value })} disabled={form.type === 'PERMANENT'} /></Field>
          <Field label="Gerekçe" className="sm:col-span-2"><Input placeholder="Gerekçe" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></Field>
        </form>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>İptal</Button>
          <Button type="submit" form="transfer-form" disabled={create.isPending}>Oluştur</Button>
        </div>
      </Modal>

      <Card padded={false}>
        {transfers && transfers.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {transfers.map((t) => (
              <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={`${t.employee.user.firstName} ${t.employee.user.lastName}`} size="sm" />
                  <div>
                    <p className="font-medium text-slate-900">{t.employee.user.firstName} {t.employee.user.lastName}</p>
                    <p className="text-sm text-slate-500">
                      {t.fromBranch?.name ?? '—'} → {t.toBranch.name} · {t.type === 'PERMANENT' ? 'Kalıcı' : 'Geçici'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(t.effectiveFrom).toLocaleDateString('tr-TR')}
                      {t.effectiveTo ? ` – ${new Date(t.effectiveTo).toLocaleDateString('tr-TR')}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={t.status === 'ACTIVE' ? 'success' : 'default'} dot>{t.status}</Badge>
                  {t.status === 'ACTIVE' && <Button size="sm" variant="ghost" onClick={() => end.mutate(t.id)}>Sonlandır</Button>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Kayıt yok" description="Henüz şube geçişi tanımlanmadı." icon={<ArrowLeftRight className="h-6 w-6" />} />
        )}
      </Card>
    </div>
  );
}
