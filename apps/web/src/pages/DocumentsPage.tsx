import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Field } from '@/components/ui/Label';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/StatCard';
import { Plus, FileText, Trash2 } from 'lucide-react';

interface Doc {
  id: string;
  type: string;
  title: string;
  fileUrl: string;
  createdAt: string;
  employee: { user: { firstName: string; lastName: string } };
}

export function DocumentsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ employeeId: '', type: 'CONTRACT', title: '' });
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const { data: docs } = useQuery({
    queryKey: ['documents'],
    queryFn: () => api.get<Doc[]>('/documents'),
  });
  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: () =>
      api.get<Array<{ id: string; user: { firstName: string; lastName: string } }>>('/employees'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.request(`/documents/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!file) { setError('Dosya seçin'); return; }
    setUploading(true);
    try {
      const { fileUrl } = await api.upload<{ fileUrl: string }>('/documents/upload', file);
      await api.post('/documents', { employeeId: form.employeeId, type: form.type, title: form.title, fileUrl });
      qc.invalidateQueries({ queryKey: ['documents'] });
      setShowForm(false);
      setForm({ employeeId: '', type: 'CONTRACT', title: '' });
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Yükleme başarısız');
    } finally {
      setUploading(false);
    }
  };

  const apiBase = import.meta.env.VITE_API_URL ? '' : '';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Personel Belgeleri"
        description="Sözleşme, kimlik, diploma vb. belgeleri yükleyin"
        icon={<FileText className="h-5 w-5" />}
        actions={<Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> Belge Ekle</Button>}
      />

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Belge Ekle" size="lg">
        <form id="doc-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Personel">
            <Select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} required>
              <option value="">Personel seçin</option>
              {employees?.map((e) => <option key={e.id} value={e.id}>{e.user.firstName} {e.user.lastName}</option>)}
            </Select>
          </Field>
          <Field label="Belge türü">
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="CONTRACT">Sözleşme</option>
              <option value="ID">Kimlik</option>
              <option value="DIPLOMA">Diploma</option>
              <option value="HEALTH">Sağlık Raporu</option>
              <option value="OTHER">Diğer</option>
            </Select>
          </Field>
          <Field label="Belge başlığı" className="sm:col-span-2"><Input placeholder="Belge başlığı" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></Field>
          <Field label="Dosya" className="sm:col-span-2"><input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" /></Field>
          {error && <p className="text-sm text-rose-600 sm:col-span-2">{error}</p>}
        </form>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>İptal</Button>
          <Button type="submit" form="doc-form" disabled={uploading}>{uploading ? 'Yükleniyor...' : 'Yükle'}</Button>
        </div>
      </Modal>

      <Card padded={false}>
        {docs && docs.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {docs.map((d) => (
              <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-primary"><FileText className="h-5 w-5" /></div>
                  <div>
                    <p className="font-medium text-slate-900">{d.title}</p>
                    <p className="text-sm text-slate-500">
                      {d.employee.user.firstName} {d.employee.user.lastName} · {d.type} · {new Date(d.createdAt).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a href={`${apiBase}${d.fileUrl}`} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="secondary">Görüntüle</Button>
                  </a>
                  <Button size="sm" variant="ghost" onClick={() => remove.mutate(d.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Belge yok" description="İlk personel belgesini yükleyin." icon={<FileText className="h-6 w-6" />} />
        )}
      </Card>
    </div>
  );
}
