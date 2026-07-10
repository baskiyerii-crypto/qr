import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/StatCard';
import { ClipboardList, Plus, Trash2 } from 'lucide-react';

type FieldDraft = {
  order: number;
  type: string;
  label: string;
  required: boolean;
  options: string[];
};

type Template = {
  id: string;
  name: string;
  isDefault: boolean;
  fields: Array<{ id: string; order: number; type: string; label: string; required: boolean; options: string | null }>;
  _count: { postings: number };
};

const FIELD_TYPES = [
  { value: 'TEXT', label: 'Kısa metin' },
  { value: 'TEXTAREA', label: 'Uzun metin' },
  { value: 'SINGLE_CHOICE', label: 'Tek seçim' },
  { value: 'MULTI_CHOICE', label: 'Çoklu seçim' },
  { value: 'NUMBER', label: 'Sayı' },
  { value: 'DATE', label: 'Tarih' },
  { value: 'FILE_CV', label: 'CV yükleme' },
];

export function RecruitmentFormTemplatesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [fields, setFields] = useState<FieldDraft[]>([
    { order: 0, type: 'TEXT', label: 'Ad', required: true, options: [] },
    { order: 1, type: 'TEXT', label: 'Soyad', required: true, options: [] },
    { order: 2, type: 'TEXT', label: 'Telefon', required: true, options: [] },
    { order: 3, type: 'FILE_CV', label: 'CV Yükle', required: false, options: [] },
  ]);

  const { data: templates } = useQuery({
    queryKey: ['job-form-templates'],
    queryFn: () => api.get<Template[]>('/recruitment/manage/form-templates'),
  });

  const create = useMutation({
    mutationFn: () =>
      api.post('/recruitment/manage/form-templates', {
        name,
        fields: fields.map((f, i) => ({
          order: i,
          type: f.type,
          label: f.label,
          required: f.required,
          options: ['SINGLE_CHOICE', 'MULTI_CHOICE'].includes(f.type)
            ? f.options.filter(Boolean)
            : undefined,
        })),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['job-form-templates'] });
      setShowForm(false);
      setName('');
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/recruitment/manage/form-templates/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['job-form-templates'] }),
  });

  const addField = () => {
    setFields((p) => [...p, { order: p.length, type: 'TEXT', label: '', required: false, options: ['', ''] }]);
  };

  const updateField = (idx: number, patch: Partial<FieldDraft>) => {
    setFields((p) => p.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Başvuru Form Şablonları"
        description="İlanlarınız için özel başvuru formları oluşturun"
        icon={<ClipboardList className="h-5 w-5" />}
        actions={<Button onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4" /> Yeni Şablon</Button>}
      />

      {showForm && (
        <Card>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate();
            }}
            className="space-y-4"
          >
            <Input placeholder="Şablon adı" value={name} onChange={(e) => setName(e.target.value)} required />
            {fields.map((f, fi) => (
              <div key={fi} className="rounded-xl border border-border p-4 space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Alan etiketi"
                    value={f.label}
                    onChange={(e) => updateField(fi, { label: e.target.value })}
                    className="flex-1"
                    required
                  />
                  <select
                    value={f.type}
                    onChange={(e) =>
                      updateField(fi, {
                        type: e.target.value,
                        options: ['SINGLE_CHOICE', 'MULTI_CHOICE'].includes(e.target.value) ? ['', ''] : [],
                      })
                    }
                    className="rounded-lg border border-input bg-background px-2 text-sm"
                  >
                    {FIELD_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  {fields.length > 1 && (
                    <Button type="button" variant="ghost" onClick={() => setFields((p) => p.filter((_, i) => i !== fi))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={f.required} onChange={(e) => updateField(fi, { required: e.target.checked })} />
                  Zorunlu
                </label>
                {['SINGLE_CHOICE', 'MULTI_CHOICE'].includes(f.type) &&
                  f.options.map((opt, oi) => (
                    <Input
                      key={oi}
                      placeholder={`Seçenek ${oi + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const opts = [...f.options];
                        opts[oi] = e.target.value;
                        updateField(fi, { options: opts });
                      }}
                    />
                  ))}
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addField}>Alan Ekle</Button>
            <Button type="submit" disabled={create.isPending}>Kaydet</Button>
          </form>
        </Card>
      )}

      <div className="grid gap-4">
        {templates?.map((t) => (
          <Card key={t.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900">{t.name}</h3>
                  {t.isDefault && <Badge variant="success">Varsayılan</Badge>}
                </div>
                <p className="mt-1 text-sm text-slate-500">{t.fields.length} alan · {t._count.postings} ilanda kullanılıyor</p>
                <ul className="mt-2 text-xs text-slate-600">
                  {t.fields.map((f) => (
                    <li key={f.id}>• {f.label} ({f.type}){f.required ? ' *' : ''}</li>
                  ))}
                </ul>
              </div>
              {!t.isDefault && t._count.postings === 0 && (
                <Button size="sm" variant="ghost" onClick={() => remove.mutate(t.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </Card>
        ))}
        {!templates?.length && (
          <Card><EmptyState title="Şablon yok" description="İlk başvuru formu şablonunuzu oluşturun." icon={<ClipboardList className="h-6 w-6" />} /></Card>
        )}
      </div>
    </div>
  );
}
