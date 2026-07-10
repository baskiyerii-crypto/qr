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
import { Users, Plus, Upload, Download, CheckCircle2 } from 'lucide-react';

type Employee = {
  id: string;
  position: string | null;
  monthlySalary: string | null;
  user: { firstName: string; lastName: string; email: string; isActive: boolean };
  branch: { name: string } | null;
  department: { name: string } | null;
  shifts: Array<{ shiftTemplate: { name: string; dayOfWeek: number } }>;
};

export function EmployeesPage() {
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<{
    message: string;
    created: number;
    failed: number;
    failedRows: Array<{ row: number; email?: string; error: string }>;
  } | null>(null);
  const [form, setForm] = useState({
    email: '', password: '', firstName: '', lastName: '',
    position: '', monthlySalary: '', branchId: '', departmentId: '', managerId: '',
  });
  const [success, setSuccess] = useState('');
  const qc = useQueryClient();

  const { data: employees, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => api.get<Employee[]>('/employees?includeInactive=true'),
  });

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => api.get<Array<{ id: string; name: string }>>('/companies/branches'),
  });

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.get<Array<{ id: string; name: string }>>('/companies/departments'),
  });

  const { data: company } = useQuery({
    queryKey: ['company'],
    queryFn: () => api.get<{ workScheduleMode: 'SHIFT' | 'STANDARD' }>('/companies/me'),
  });

  const createMutation = useMutation({
    mutationFn: (body: unknown) => api.post<{ message: string }>('/employees', body),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['employees'] });
      setShowForm(false);
      setSuccess(data.message || 'Personel oluşturuldu');
      setForm({ email: '', password: '', firstName: '', lastName: '', position: '', monthlySalary: '', branchId: '', departmentId: '', managerId: '' });
    },
  });

  const deactivate = useMutation({
    mutationFn: (id: string) => api.patch(`/employees/${id}/deactivate`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  });

  const importMutation = useMutation({
    mutationFn: (file: File) =>
      api.upload<{
        message: string;
        created: number;
        failed: number;
        failedRows: Array<{ row: number; email?: string; error: string }>;
      }>('/employees/import', file),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['employees'] });
      setImportResult(data);
      setImportFile(null);
      setSuccess(data.message);
    },
  });

  const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
  const usesStandardSchedule = company?.workScheduleMode === 'STANDARD';

  const columns: Column<Employee>[] = [
    {
      key: 'employee',
      header: 'Personel',
      render: (emp) => (
        <div className="flex items-center gap-3">
          <Avatar name={`${emp.user.firstName} ${emp.user.lastName}`} size="sm" />
          <div>
            <p className="font-medium text-slate-900">{emp.user.firstName} {emp.user.lastName}</p>
            <p className="text-xs text-slate-400">{emp.user.email}</p>
            {emp.position && <p className="text-xs text-slate-500">{emp.position}</p>}
          </div>
        </div>
      ),
    },
    {
      key: 'branch',
      header: 'Şube / Departman',
      render: (emp) => (
        <div>
          <p className="text-slate-700">{emp.branch?.name || '—'}</p>
          <p className="text-xs text-slate-400">{emp.department?.name || ''}</p>
        </div>
      ),
    },
    {
      key: 'shift',
      header: 'Vardiya',
      render: (emp) =>
        emp.shifts?.length ? (
          <span className="text-xs text-slate-600">{emp.shifts.map((s) => dayNames[s.shiftTemplate.dayOfWeek]).join(', ')}</span>
        ) : usesStandardSchedule ? (
          <span className="text-xs text-slate-500">Standart mesai</span>
        ) : (
          <span className="text-xs text-amber-600">Atanmadı</span>
        ),
    },
    {
      key: 'salary',
      header: 'Maaş',
      render: (emp) => (emp.monthlySalary ? `${Number(emp.monthlySalary).toLocaleString('tr-TR')} ₺` : '—'),
    },
    {
      key: 'status',
      header: 'Durum',
      render: (emp) => (
        <Badge variant={emp.user.isActive ? 'success' : 'default'} dot>
          {emp.user.isActive ? 'Aktif' : 'Pasif'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (emp) =>
        emp.user.isActive ? (
          <Button size="sm" variant="ghost" onClick={() => deactivate.mutate(emp.id)}>Pasifleştir</Button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Personel"
        description="Tek tek veya Excel ile toplu personel ekleyin"
        icon={<Users className="h-5 w-5" />}
        actions={
          <>
            <Button variant="secondary" onClick={() => { setShowImport(true); setShowForm(false); }}>
              <Upload className="h-4 w-4" /> Excel ile Yükle
            </Button>
            <Button onClick={() => { setShowForm(true); setShowImport(false); }}>
              <Plus className="h-4 w-4" /> Personel Ekle
            </Button>
          </>
        }
      />

      {success && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" /> {success}
        </div>
      )}

      <Modal open={showImport} onClose={() => setShowImport(false)} title="Excel ile Toplu Personel Yükleme" size="lg">
        <p className="mb-4 text-sm text-slate-500">
          Şablonu indirin, personel bilgilerini ve şifrelerini doldurun, ardından dosyayı yükleyin.
          Şube ve departman adları sistemdeki kayıtlarla eşleşmelidir.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => api.download('/employees/import/template', 'personel-sablonu.xlsx')}>
            <Download className="h-4 w-4" /> Şablon İndir
          </Button>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-card px-4 py-2.5 text-sm font-medium text-slate-700 shadow-xs transition-colors hover:bg-slate-50">
            <Upload className="h-4 w-4" />
            {importFile ? importFile.name : 'Excel dosyası seç (.xlsx)'}
            <input
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <Button disabled={!importFile || importMutation.isPending} onClick={() => importFile && importMutation.mutate(importFile)}>
            {importMutation.isPending ? 'Yükleniyor...' : 'Yükle'}
          </Button>
        </div>
        {importMutation.isError && <p className="mt-3 text-sm text-rose-600">{importMutation.error.message}</p>}
        {importResult && importResult.failed > 0 && (
          <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm">
            <p className="font-medium text-amber-800">{importResult.failed} satır eklenemedi:</p>
            <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-amber-700">
              {importResult.failedRows.map((f) => (
                <li key={f.row}>Satır {f.row}{f.email ? ` (${f.email})` : ''}: {f.error}</li>
              ))}
            </ul>
          </div>
        )}
      </Modal>

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title="Yeni Personel"
        size="lg"
      >
        <form
          id="employee-form"
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate({
              email: form.email,
              password: form.password,
              firstName: form.firstName,
              lastName: form.lastName,
              position: form.position || undefined,
              branchId: form.branchId || undefined,
              departmentId: form.departmentId || undefined,
              managerId: form.managerId || undefined,
              monthlySalary: form.monthlySalary ? parseFloat(form.monthlySalary) : undefined,
            });
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <Field label="Ad"><Input placeholder="Ad" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required /></Field>
          <Field label="Soyad"><Input placeholder="Soyad" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required /></Field>
          <Field label="E-posta" className="sm:col-span-2"><Input placeholder="ornek@firma.com" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></Field>
          <Field label="Şifre" hint="En az 8 karakter" className="sm:col-span-2"><Input placeholder="••••••••" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} /></Field>
          <Field label="Pozisyon"><Input placeholder="Pozisyon" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} /></Field>
          <Field label="Yönetici">
            <Select value={form.managerId} onChange={(e) => setForm({ ...form, managerId: e.target.value })}>
              <option value="">Yönetici (opsiyonel)</option>
              {employees?.map((e) => <option key={e.id} value={e.id}>{e.user.firstName} {e.user.lastName}</option>)}
            </Select>
          </Field>
          <Field label="Şube">
            <Select value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })}>
              <option value="">Şube seçin</option>
              {branches?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
          </Field>
          <Field label="Departman">
            <Select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
              <option value="">Departman seçin</option>
              {departments?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          </Field>
          <Field label="Aylık maaş (TL)"><Input placeholder="0" type="number" value={form.monthlySalary} onChange={(e) => setForm({ ...form, monthlySalary: e.target.value })} /></Field>
          {createMutation.isError && <p className="text-sm text-rose-600 sm:col-span-2">{createMutation.error.message}</p>}
        </form>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>İptal</Button>
          <Button type="submit" form="employee-form" disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Kaydediliyor...' : 'Personel Oluştur'}
          </Button>
        </div>
      </Modal>

      <DataTable
        columns={columns}
        data={employees}
        loading={isLoading}
        rowKey={(emp) => emp.id}
        emptyTitle="Henüz personel yok"
        emptyDescription="Excel ile toplu yükleyin veya tek tek ekleyin"
        emptyIcon={<Users className="h-6 w-6" />}
      />
    </div>
  );
}
