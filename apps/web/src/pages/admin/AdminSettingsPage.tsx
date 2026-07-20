import { useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Label';
import { PageHeader } from '@/components/ui/PageHeader';
import { Settings, Upload, X } from 'lucide-react';

type SettingsResponse = {
  settings: {
    defaultCommissionRate: number;
    monthlySubscriptionFee: number;
    defaultPlanId: string | null;
    webAppUrl: string | null;
    requireEmployeeLocation: boolean;
    brandTitle: string | null;
    brandAddress: string | null;
    brandIconUrl: string | null;
    brandSubtitleCompany: string | null;
    brandSubtitleAdmin: string | null;
    brandSubtitleReseller: string | null;
    brandSubtitleMarketer: string | null;
  };
  plans: Array<{ id: string; name: string }>;
};

export function AdminSettingsPage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const { data } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => api.get<SettingsResponse>('/admin/settings'),
  });

  const save = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.patch('/admin/settings', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-settings'] });
      qc.invalidateQueries({ queryKey: ['platform-config'] });
    },
  });

  const uploadIcon = useMutation({
    mutationFn: async (file: File) => {
      return api.upload<{ fileUrl: string }>('/admin/settings/branding/icon', file);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-settings'] });
      qc.invalidateQueries({ queryKey: ['platform-config'] });
    },
  });

  const s = data?.settings;

  const handleIconUpload = () => {
    const file = fileRef.current?.files?.[0];
    if (file) {
      uploadIcon.mutate(file);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removeIcon = () => {
    save.mutate({ brandIconUrl: null });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Platform Ayarları" description="Varsayılan komisyon, ücret, entegrasyon ve marka ayarları" icon={<Settings className="h-5 w-5" />} />

      {/* Existing platform settings */}
      <Card>
        <CardHeader>
          <CardTitle>Genel Ayarlar</CardTitle>
        </CardHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Varsayılan komisyon (%)">
            <Input type="number" defaultValue={s ? s.defaultCommissionRate * 100 : 15} onBlur={(e) => save.mutate({ defaultCommissionRate: parseFloat(e.target.value) / 100 })} />
          </Field>
          <Field label="Varsayılan aylık ücret (₺)">
            <Input type="number" defaultValue={s?.monthlySubscriptionFee ?? 299} onBlur={(e) => save.mutate({ monthlySubscriptionFee: parseFloat(e.target.value) })} />
          </Field>
          <Field label="Varsayılan plan">
            <Select defaultValue={s?.defaultPlanId ?? ''} onChange={(e) => save.mutate({ defaultPlanId: e.target.value || null })}>
              <option value="">Seçilmedi</option>
              {data?.plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </Field>
          <Field label="Web uygulama URL">
            <Input placeholder="http://localhost:5173" defaultValue={s?.webAppUrl ?? ''} onBlur={(e) => save.mutate({ webAppUrl: e.target.value })} />
          </Field>
          <Field label="Personel konum zorunluluğu">
            <Select
              defaultValue={String(s?.requireEmployeeLocation ?? true)}
              onChange={(e) => save.mutate({ requireEmployeeLocation: e.target.value === 'true' })}
            >
              <option value="true">Açık — QR girişinde konum gerekli</option>
              <option value="false">Kapalı — sadece QR yeterli</option>
            </Select>
          </Field>
        </div>
        {save.isSuccess && <p className="mt-4 text-sm text-emerald-600">Kaydedildi</p>}
      </Card>

      {/* Branding settings */}
      <Card>
        <CardHeader>
          <CardTitle>Marka Ayarları</CardTitle>
        </CardHeader>
        <p className="mb-4 text-sm text-slate-500">
          Sidebar ve header'da görünen logo, platform ismi ve alt başlıkları buradan yönetin.
        </p>

        {/* Icon/Logo upload */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium">Platform İkonu / Logo</label>
          <div className="flex items-center gap-4">
            {s?.brandIconUrl ? (
              <div className="relative">
                <img
                  src={s.brandIconUrl}
                  alt="Platform ikonu"
                  className="h-14 w-14 rounded-xl object-cover ring-1 ring-border"
                />
                <button
                  onClick={removeIcon}
                  className="absolute -right-1.5 -top-1.5 rounded-full bg-rose-500 p-0.5 text-white shadow hover:bg-rose-600"
                  title="İkonu kaldır"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted text-muted-foreground ring-1 ring-border">
                <Upload className="h-5 w-5" />
              </div>
            )}
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp,image/x-icon"
                className="hidden"
                onChange={handleIconUpload}
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={() => fileRef.current?.click()}
                disabled={uploadIcon.isPending}
              >
                {uploadIcon.isPending ? 'Yükleniyor...' : 'İkon Yükle'}
              </Button>
              <p className="mt-1 text-xs text-muted-foreground">PNG, JPG, SVG, WebP — maks 2 MB</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Platform Adı">
            <Input
              placeholder="QR Personel"
              defaultValue={s?.brandTitle ?? ''}
              onBlur={(e) => save.mutate({ brandTitle: e.target.value || null })}
            />
          </Field>
          <Field label="Adres / İletişim">
            <Input
              placeholder="İstanbul, Türkiye"
              defaultValue={s?.brandAddress ?? ''}
              onBlur={(e) => save.mutate({ brandAddress: e.target.value || null })}
            />
          </Field>
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium">Role Bazlı Alt Başlıklar</label>
          <p className="mb-3 text-xs text-muted-foreground">
            Her panelde sidebar'da ismin altında görünen metin. Boş bırakılırsa varsayılan kullanılır.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Şirket Paneli Alt Başlık">
              <Input
                placeholder="Yönetim Paneli"
                defaultValue={s?.brandSubtitleCompany ?? ''}
                onBlur={(e) => save.mutate({ brandSubtitleCompany: e.target.value || null })}
              />
            </Field>
            <Field label="Admin Paneli Alt Başlık">
              <Input
                placeholder="Süper Yönetici"
                defaultValue={s?.brandSubtitleAdmin ?? ''}
                onBlur={(e) => save.mutate({ brandSubtitleAdmin: e.target.value || null })}
              />
            </Field>
            <Field label="Bayi Paneli Alt Başlık">
              <Input
                placeholder="Bayi Paneli"
                defaultValue={s?.brandSubtitleReseller ?? ''}
                onBlur={(e) => save.mutate({ brandSubtitleReseller: e.target.value || null })}
              />
            </Field>
            <Field label="Pazarlamacı Paneli Alt Başlık">
              <Input
                placeholder="Pazarlamacı Paneli"
                defaultValue={s?.brandSubtitleMarketer ?? ''}
                onBlur={(e) => save.mutate({ brandSubtitleMarketer: e.target.value || null })}
              />
            </Field>
          </div>
        </div>

        {save.isSuccess && <p className="mt-4 text-sm text-emerald-600">Kaydedildi</p>}
        {uploadIcon.isSuccess && <p className="mt-4 text-sm text-emerald-600">İkon yüklendi</p>}
      </Card>
    </div>
  );
}
