import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Field } from '@/components/ui/Label';
import { PageHeader } from '@/components/ui/PageHeader';
import { Settings } from 'lucide-react';

type SettingsResponse = {
  settings: {
    defaultCommissionRate: number;
    monthlySubscriptionFee: number;
    defaultPlanId: string | null;
    webAppUrl: string | null;
    requireEmployeeLocation: boolean;
  };
  plans: Array<{ id: string; name: string }>;
};

export function AdminSettingsPage() {
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => api.get<SettingsResponse>('/admin/settings'),
  });

  const save = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.patch('/admin/settings', body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-settings'] }),
  });

  const s = data?.settings;

  return (
    <div className="space-y-6">
      <PageHeader title="Platform Ayarları" description="Varsayılan komisyon, ücret ve entegrasyon ayarları" icon={<Settings className="h-5 w-5" />} />

      <Card>
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
    </div>
  );
}
