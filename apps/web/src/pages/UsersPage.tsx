import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Field } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Plus, UserCog, Users } from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
  COMPANY_ADMIN: 'Şirket Yöneticisi',
  HR_MANAGER: 'İK Yöneticisi',
  REGIONAL_MANAGER: 'Bölge Yöneticisi',
  BRANCH_MANAGER: 'Şube Yöneticisi',
};

const BRANCH_SCOPED = ['REGIONAL_MANAGER', 'BRANCH_MANAGER'];

interface StaffUser {
  id: string; email: string; firstName: string; lastName: string;
  role: string; isActive: boolean;
  branchAssignments?: Array<{ branchId: string; branch?: { name: string } }>;
}

export function UsersPage() {
  const [showForm, setShowForm] = useState(false);
  const [resetId, setResetId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [form, setForm] = useState({
    email: '', password: '', firstName: '', lastName: '', role: 'HR_MANAGER',
  });
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const qc = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get<StaffUser[]>('/users'),
  });

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => api.get<Array<{ id: string; name: string }>>('/companies/branches'),
  });

  const isBranchScoped = BRANCH_SCOPED.includes(form.role);
  const singleBranch = form.role === 'BRANCH_MANAGER';

  const toggleBranch = (id: string) => {
    setSelectedBranches((prev) => {
      if (singleBranch) return prev.includes(id) ? [] : [id];
      return prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id];
    });
  };

  const create = useMutation({
    mutationFn: () =>
      api.post('/users', { ...form, ...(isBranchScoped ? { branchIds: selectedBranches } : {}) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setShowForm(false);
      setForm({ email: '', password: '', firstName: '', lastName: '', role: 'HR_MANAGER' });
      setSelectedBranches([]);
    },
  });

  const resetPw = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      api.patch(`/users/${id}/password`, { password }),
    onSuccess: () => { setResetId(null); setNewPassword(''); },
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/users/${id}/active`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const columns: Column<StaffUser>[] = [
    {
      key: 'user',
      header: 'Kullanıcı',
      render: (u) => (
        <div className="flex items-center gap-3">
          <Avatar name={`${u.firstName} ${u.lastName}`} size="sm" />
          <div>
            <p className="font-medium text-slate-900">{u.firstName} {u.lastName}</p>
            <p className="text-xs text-slate-400">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Rol',
      render: (u) => (
        <div>
          <Badge variant="primary">{ROLE_LABELS[u.role] || u.role}</Badge>
          {u.branchAssignments && u.branchAssignments.length > 0 && (
            <p className="mt-1 text-xs text-slate-400">
              {u.branchAssignments.map((a) => a.branch?.name).filter(Boolean).join(', ')}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Durum',
      render: (u) => <Badge variant={u.isActive ? 'success' : 'default'} dot>{u.isActive ? 'Aktif' : 'Pasif'}</Badge>,
    },
    {
      key: 'actions',
      header: 'İşlem',
      align: 'right',
      render: (u) => (
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={() => setResetId(resetId === u.id ? null : u.id)}>
              <UserCog className="h-4 w-4" /> Şifre
            </Button>
            <Button size="sm" variant="ghost" onClick={() => toggleActive.mutate({ id: u.id, isActive: !u.isActive })}>
              {u.isActive ? 'Pasifleştir' : 'Aktifleştir'}
            </Button>
          </div>
          {resetId === u.id && (
            <div className="flex gap-2">
              <Input type="password" placeholder="Yeni şifre" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-8 w-40" />
              <Button size="sm" onClick={() => resetPw.mutate({ id: u.id, password: newPassword })}>Kaydet</Button>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kullanıcılar"
        description="Yönetici ve İK kullanıcıları — her kullanıcıya şifre belirleyin"
        icon={<Users className="h-5 w-5" />}
        actions={<Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> Kullanıcı Ekle</Button>}
      />

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Yeni Kullanıcı" size="lg">
        <form id="user-form" onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="grid gap-4 sm:grid-cols-2">
          <Field label="Ad"><Input placeholder="Ad" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required /></Field>
          <Field label="Soyad"><Input placeholder="Soyad" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required /></Field>
          <Field label="E-posta" className="sm:col-span-2"><Input placeholder="ornek@firma.com" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></Field>
          <Field label="Şifre" hint="En az 8 karakter" className="sm:col-span-2"><Input placeholder="••••••••" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} /></Field>
          <Field label="Rol" className="sm:col-span-2">
            <Select value={form.role} onChange={(e) => { setForm({ ...form, role: e.target.value }); setSelectedBranches([]); }}>
              <option value="HR_MANAGER">İK Yöneticisi</option>
              <option value="REGIONAL_MANAGER">Bölge Yöneticisi</option>
              <option value="BRANCH_MANAGER">Şube Yöneticisi</option>
              <option value="COMPANY_ADMIN">Şirket Yöneticisi</option>
            </Select>
          </Field>
          {isBranchScoped && (
            <div className="sm:col-span-2">
              <p className="mb-2 text-sm font-medium text-slate-700">{singleBranch ? 'Sorumlu Şube (tek)' : 'Sorumlu Şubeler (çoklu)'}</p>
              <div className="flex flex-wrap gap-2">
                {branches?.map((b) => (
                  <button
                    type="button"
                    key={b.id}
                    onClick={() => toggleBranch(b.id)}
                    className={
                      'rounded-full border px-3 py-1.5 text-sm transition-colors ' +
                      (selectedBranches.includes(b.id)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50')
                    }
                  >
                    {b.name}
                  </button>
                ))}
              </div>
              {branches?.length === 0 && <p className="text-sm text-slate-400">Önce şube ekleyin.</p>}
            </div>
          )}
        </form>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>İptal</Button>
          <Button type="submit" form="user-form" disabled={create.isPending || (isBranchScoped && selectedBranches.length === 0)}>Oluştur</Button>
        </div>
      </Modal>

      <DataTable
        columns={columns}
        data={users}
        loading={isLoading}
        rowKey={(u) => u.id}
        emptyTitle="Kullanıcı yok"
        emptyDescription="İlk yönetici veya İK kullanıcısını ekleyin."
        emptyIcon={<Users className="h-6 w-6" />}
      />
    </div>
  );
}
