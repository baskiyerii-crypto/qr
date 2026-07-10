import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Field } from '@/components/ui/Label';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/StatCard';
import { Plus, Copy, Briefcase, ClipboardList, ExternalLink } from 'lucide-react';

interface Posting {
  id: string;
  title: string;
  position: string | null;
  employmentType: string | null;
  status: string;
  publicToken: string;
  branch: { name: string } | null;
  _count: { applications: number };
}

interface Template {
  id: string;
  name: string;
  isDefault: boolean;
}

export function RecruitmentPostingsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', position: '', employmentType: '', salaryRange: '', branchId: '', formTemplateId: '',
  });

  const { data: postings } = useQuery({
    queryKey: ['recruitment-postings'],
    queryFn: () => api.get<Posting[]>('/recruitment/manage/postings'),
  });
  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => api.get<Array<{ id: string; name: string }>>('/companies/branches'),
  });
  const { data: templates } = useQuery({
    queryKey: ['job-form-templates'],
    queryFn: () => api.get<Template[]>('/recruitment/manage/form-templates'),
  });
  const { data: company } = useQuery({
    queryKey: ['company'],
    queryFn: () => api.get<{ slug: string; name: string }>('/companies/me'),
  });

  const create = useMutation({
    mutationFn: () =>
      api.post('/recruitment/manage/postings', {
        title: form.title,
        description: form.description || undefined,
        position: form.position || undefined,
        employmentType: form.employmentType || undefined,
        salaryRange: form.salaryRange || undefined,
        branchId: form.branchId || undefined,
        formTemplateId: form.formTemplateId || undefined,
        status: 'OPEN',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recruitment-postings'] });
      setShowForm(false);
      setForm({ title: '', description: '', position: '', employmentType: '', salaryRange: '', branchId: '', formTemplateId: '' });
    },
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/recruitment/manage/postings/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recruitment-postings'] }),
  });

  const publicUrl = (token: string) => `${window.location.origin}/kariyer/basvuru/${token}`;
  const careersUrl = company ? `${window.location.origin}/kariyer/${company.slug}` : '';

  return (
    <div className="space-y-6">
      <PageHeader
        title="İşe Alım İlanları"
        description="İlan oluşturun, özel başvuru formu ve public link paylaşın"
        icon={<Briefcase className="h-5 w-5" />}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/recruitment/templates">
              <Button variant="secondary"><ClipboardList className="h-4 w-4" /> Form Şablonları</Button>
            </Link>
            <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4" /> Yeni İlan</Button>
          </div>
        }
      />

      {careersUrl && (
        <Card className="flex flex-wrap items-center justify-between gap-3 bg-primary/5">
          <div>
            <p className="text-sm font-semibold text-slate-900">Public kariyer sayfanız</p>
            <code className="text-xs text-slate-600">{careersUrl}</code>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(careersUrl)}><Copy className="h-4 w-4" /></Button>
            <a href={careersUrl} target="_blank" rel="noreferrer">
              <Button size="sm" variant="secondary"><ExternalLink className="h-4 w-4" /> Görüntüle</Button>
            </a>
          </div>
        </Card>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Yeni İlan" size="lg">
        <form id="posting-form" onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="grid gap-4 sm:grid-cols-2">
          <Field label="Başlık" className="sm:col-span-2"><Input placeholder="İlan başlığı" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></Field>
          <Field label="Pozisyon"><Input placeholder="Pozisyon" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} /></Field>
          <Field label="Çalışma tipi"><Input placeholder="Tam/Yarı zamanlı" value={form.employmentType} onChange={(e) => setForm({ ...form, employmentType: e.target.value })} /></Field>
          <Field label="Maaş aralığı"><Input placeholder="Maaş aralığı" value={form.salaryRange} onChange={(e) => setForm({ ...form, salaryRange: e.target.value })} /></Field>
          <Field label="Şube">
            <Select value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })}>
              <option value="">Şube (opsiyonel)</option>
              {branches?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
          </Field>
          <Field label="Başvuru formu" className="sm:col-span-2">
            <Select value={form.formTemplateId} onChange={(e) => setForm({ ...form, formTemplateId: e.target.value })}>
              <option value="">Varsayılan şablon</option>
              {templates?.map((t) => <option key={t.id} value={t.id}>{t.name}{t.isDefault ? ' (varsayılan)' : ''}</option>)}
            </Select>
          </Field>
          <Field label="Açıklama" className="sm:col-span-2"><Textarea placeholder="Açıklama" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        </form>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>İptal</Button>
          <Button type="submit" form="posting-form" disabled={create.isPending}>Yayınla</Button>
        </div>
      </Modal>

      <div className="grid gap-4">
        {postings?.map((p) => (
          <Card key={p.id} hover>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900">{p.title}</h3>
                  <Badge variant={p.status === 'OPEN' ? 'success' : 'default'} dot>{p.status}</Badge>
                </div>
                <p className="text-sm text-slate-500">{[p.position, p.employmentType, p.branch?.name].filter(Boolean).join(' · ')}</p>
                <div className="mt-2 flex items-center gap-2">
                  <code className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-600">{publicUrl(p.publicToken)}</code>
                  <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(publicUrl(p.publicToken))}><Copy className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Link to="/recruitment/$id" params={{ id: p.id }}>
                  <Button size="sm" variant="secondary">{p._count.applications} Başvuru</Button>
                </Link>
                {p.status === 'OPEN' ? (
                  <Button size="sm" variant="ghost" onClick={() => setStatus.mutate({ id: p.id, status: 'CLOSED' })}>Kapat</Button>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => setStatus.mutate({ id: p.id, status: 'OPEN' })}>Aç</Button>
                )}
              </div>
            </div>
          </Card>
        ))}
        {postings?.length === 0 && (
          <Card><EmptyState title="İlan yok" description="İlk işe alım ilanını oluşturun." icon={<Briefcase className="h-6 w-6" />} /></Card>
        )}
      </div>
    </div>
  );
}
