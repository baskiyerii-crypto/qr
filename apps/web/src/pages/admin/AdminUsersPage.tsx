import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Field } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Plus, ShieldCheck } from 'lucide-react';

type AdminUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: string;
};

export function AdminUsersPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '' });

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get<AdminUser[]>('/admin/users'),
  });

  const create = useMutation({
    mutationFn: () => api.post('/admin/users', form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      setShowForm(false);
      setForm({ email: '', password: '', firstName: '', lastName: '' });
    },
  });

  const toggle = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/admin/users/${id}`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const columns: Column<AdminUser>[] = [
    { key: 'user', header: 'Kullanıcı', render: (u) => (<div className="flex items-center gap-3"><Avatar name={`${u.firstName} ${u.lastName}`} size="sm" /><span className="font-medium text-slate-900">{u.firstName} {u.lastName}</span></div>) },
    { key: 'email', header: 'E-posta', render: (u) => <span className="text-slate-500">{u.email}</span> },
    { key: 'created', header: 'Kayıt', render: (u) => <span className="text-slate-400">{new Date(u.createdAt).toLocaleDateString('tr-TR')}</span> },
    { key: 'status', header: 'Durum', render: (u) => <Badge variant={u.isActive ? 'success' : 'error'} dot>{u.isActive ? 'Aktif' : 'Pasif'}</Badge> },
    { key: 'actions', header: '', align: 'right', render: (u) => <Button size="sm" variant="secondary" onClick={() => toggle.mutate({ id: u.id, isActive: !u.isActive })}>{u.isActive ? 'Pasifleştir' : 'Aktifleştir'}</Button> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Kullanıcıları"
        description="Süper admin hesapları"
        icon={<ShieldCheck className="h-5 w-5" />}
        actions={<Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> Yeni Süper Admin</Button>}
      />

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Yeni Süper Admin" size="lg">
        <form id="admin-user-form" onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="grid gap-4 sm:grid-cols-2">
          <Field label="Ad"><Input placeholder="Ad" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required /></Field>
          <Field label="Soyad"><Input placeholder="Soyad" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required /></Field>
          <Field label="E-posta" className="sm:col-span-2"><Input placeholder="ornek@firma.com" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></Field>
          <Field label="Şifre" hint="En az 8 karakter" className="sm:col-span-2"><Input placeholder="••••••••" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} /></Field>
        </form>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>İptal</Button>
          <Button type="submit" form="admin-user-form" disabled={create.isPending}>Oluştur</Button>
        </div>
      </Modal>

      <DataTable columns={columns} data={users} loading={isLoading} rowKey={(u) => u.id} emptyTitle="Kullanıcı yok" emptyDescription="İlk süper admini ekleyin." emptyIcon={<ShieldCheck className="h-6 w-6" />} />
    </div>
  );
}
