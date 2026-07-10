import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Field } from '@/components/ui/Label';
import { PageHeader } from '@/components/ui/PageHeader';
import { Settings } from 'lucide-react';

const DAY_OPTIONS = [
  { value: 1, label: 'Pazartesi' },
  { value: 2, label: 'Salı' },
  { value: 3, label: 'Çarşamba' },
  { value: 4, label: 'Perşembe' },
  { value: 5, label: 'Cuma' },
  { value: 6, label: 'Cumartesi' },
  { value: 0, label: 'Pazar' },
];

export function SettingsPage() {
  const qc = useQueryClient();
  const { data: company } = useQuery({
    queryKey: ['company'],
    queryFn: () => api.get<{
      name: string;
      deviceBindingEnabled: boolean;
      dataRetentionDays: number;
      overtimeMultiplier: number;
      workScheduleMode: 'SHIFT' | 'STANDARD';
      standardWorkDays: number[];
      standardStartTime: string;
      standardEndTime: string;
    }>('/companies/me'),
  });

  const { data: kvkk } = useQuery({
    queryKey: ['kvkk'],
    queryFn: () => api.get('/kvkk/disclosure'),
  });

  const [deviceBinding, setDeviceBinding] = useState<boolean | null>(null);
  const [retention, setRetention] = useState('');
  const [overtime, setOvertime] = useState('');
  const [workScheduleMode, setWorkScheduleMode] = useState<'SHIFT' | 'STANDARD' | null>(null);
  const [standardWorkDays, setStandardWorkDays] = useState<number[] | null>(null);
  const [standardStartTime, setStandardStartTime] = useState('');
  const [standardEndTime, setStandardEndTime] = useState('');

  const save = useMutation({
    mutationFn: () =>
      api.patch('/companies/settings', {
        deviceBindingEnabled: deviceBinding ?? company?.deviceBindingEnabled,
        dataRetentionDays: retention ? parseInt(retention) : company?.dataRetentionDays,
        overtimeMultiplier: overtime ? parseFloat(overtime) : company?.overtimeMultiplier,
        workScheduleMode: workScheduleMode ?? company?.workScheduleMode,
        standardWorkDays: standardWorkDays ?? company?.standardWorkDays,
        standardStartTime: standardStartTime || company?.standardStartTime,
        standardEndTime: standardEndTime || company?.standardEndTime,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['company'] });
      setDeviceBinding(null);
      setRetention('');
      setOvertime('');
      setWorkScheduleMode(null);
      setStandardWorkDays(null);
      setStandardStartTime('');
      setStandardEndTime('');
    },
  });

  const activeMode = workScheduleMode ?? company?.workScheduleMode ?? 'STANDARD';
  const activeDays = standardWorkDays ?? company?.standardWorkDays ?? [1, 2, 3, 4, 5];

  const toggleDay = (day: number) => {
    const current = [...activeDays];
    const idx = current.indexOf(day);
    if (idx >= 0) current.splice(idx, 1);
    else current.push(day);
    setStandardWorkDays(current.sort((a, b) => a - b));
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Ayarlar & KVKK" description="Şirket ayarları, çalışma düzeni ve yasal metinler" icon={<Settings className="h-5 w-5" />} />

      <Card>
        <CardHeader>
          <CardTitle>Şirket Ayarları</CardTitle>
        </CardHeader>
        <dl className="mb-6 space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-slate-500">Ad</dt><dd className="font-medium text-slate-900">{company?.name}</dd></div>
        </dl>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Cihaz bağlama">
            <Select
              value={String(deviceBinding ?? company?.deviceBindingEnabled ?? false)}
              onChange={(e) => setDeviceBinding(e.target.value === 'true')}
            >
              <option value="true">Açık</option>
              <option value="false">Kapalı</option>
            </Select>
          </Field>
          <Field label="Veri saklama (gün)">
            <Input type="number" placeholder={String(company?.dataRetentionDays ?? 365)} value={retention} onChange={(e) => setRetention(e.target.value)} />
          </Field>
          <Field label="Fazla mesai çarpanı">
            <Input type="number" step="0.1" placeholder={String(company?.overtimeMultiplier ?? 1.5)} value={overtime} onChange={(e) => setOvertime(e.target.value)} />
          </Field>
        </div>
        <Button className="mt-4" onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
        {save.isSuccess && <p className="mt-2 text-sm text-emerald-600">Ayarlar güncellendi</p>}
        {save.isError && <p className="mt-2 text-sm text-rose-600">{save.error.message}</p>}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Çalışma Düzeni</CardTitle>
        </CardHeader>
        <p className="mb-4 text-sm text-slate-500">
          Vardiya kullanmayan firmalar için standart mesai saatleri ve çalışma günlerini tanımlayın.
          Vardiya modunda personel bazlı vardiya ataması kullanılır.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Çalışma modu" className="sm:col-span-2">
            <Select value={activeMode} onChange={(e) => setWorkScheduleMode(e.target.value as 'SHIFT' | 'STANDARD')}>
              <option value="STANDARD">Standart mesai (vardiya yok)</option>
              <option value="SHIFT">Vardiya sistemi</option>
            </Select>
          </Field>
          {activeMode === 'STANDARD' && (
            <>
              <Field label="Mesai başlangıç">
                <Input type="time" value={standardStartTime || company?.standardStartTime || '09:00'} onChange={(e) => setStandardStartTime(e.target.value)} />
              </Field>
              <Field label="Mesai bitiş">
                <Input type="time" value={standardEndTime || company?.standardEndTime || '18:00'} onChange={(e) => setStandardEndTime(e.target.value)} />
              </Field>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium">Çalışma günleri</label>
                <div className="flex flex-wrap gap-2">
                  {DAY_OPTIONS.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => toggleDay(d.value)}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                        activeDays.includes(d.value)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        <Button className="mt-4" onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? 'Kaydediliyor...' : 'Çalışma düzenini kaydet'}
        </Button>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>KVKK Aydınlatma Metni</CardTitle>
        </CardHeader>
        <div className="space-y-4">
          {(kvkk as { sections: Array<{ title: string; content: string }> })?.sections?.map((s, i) => (
            <div key={i}>
              <h4 className="font-medium text-slate-900">{s.title}</h4>
              <p className="mt-1 text-sm text-slate-600">{s.content}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
