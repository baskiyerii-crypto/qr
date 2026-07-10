import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { api } from '../../lib/api';
import { Button, Card, Chip } from '../../components/ui';
import { ScreenScroll, ScreenHeader, FormInput, screen, Loading } from '../../components/screen';
import { theme } from '../../lib/theme';

type Company = {
  name: string;
  deviceBindingEnabled: boolean;
  dataRetentionDays: number;
  overtimeMultiplier: number;
  workScheduleMode: 'SHIFT' | 'STANDARD';
  standardWorkDays: number[];
  standardStartTime: string;
  standardEndTime: string;
};

const DAY_OPTIONS = [
  { value: 1, label: 'Pzt' },
  { value: 2, label: 'Sal' },
  { value: 3, label: 'Çar' },
  { value: 4, label: 'Per' },
  { value: 5, label: 'Cum' },
  { value: 6, label: 'Cmt' },
  { value: 0, label: 'Paz' },
];

export default function CompanySettingsScreen() {
  const [company, setCompany] = useState<Company | null>(null);
  const [deviceBinding, setDeviceBinding] = useState<boolean | null>(null);
  const [retention, setRetention] = useState('');
  const [overtime, setOvertime] = useState('');
  const [workScheduleMode, setWorkScheduleMode] = useState<'SHIFT' | 'STANDARD' | null>(null);
  const [standardWorkDays, setStandardWorkDays] = useState<number[] | null>(null);
  const [standardStartTime, setStandardStartTime] = useState('');
  const [standardEndTime, setStandardEndTime] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => api.get<Company>('/companies/me').then(setCompany).catch(() => {});

  useEffect(() => {
    load();
  }, []);

  if (!company) return <ScreenScroll><Loading /></ScreenScroll>;

  const activeMode = workScheduleMode ?? company.workScheduleMode;
  const activeDays = standardWorkDays ?? company.standardWorkDays ?? [1, 2, 3, 4, 5];

  const toggleDay = (day: number) => {
    const current = [...activeDays];
    const idx = current.indexOf(day);
    if (idx >= 0) current.splice(idx, 1);
    else current.push(day);
    setStandardWorkDays(current.sort((a, b) => a - b));
  };

  const save = async () => {
    setBusy(true);
    setMsg('');
    try {
      await api.patch('/companies/settings', {
        deviceBindingEnabled: deviceBinding ?? company.deviceBindingEnabled,
        dataRetentionDays: retention ? parseInt(retention, 10) : company.dataRetentionDays,
        overtimeMultiplier: overtime ? parseFloat(overtime) : company.overtimeMultiplier,
        workScheduleMode: workScheduleMode ?? company.workScheduleMode,
        standardWorkDays: standardWorkDays ?? company.standardWorkDays,
        standardStartTime: standardStartTime || company.standardStartTime,
        standardEndTime: standardEndTime || company.standardEndTime,
      });
      setMsg('Ayarlar güncellendi');
      setDeviceBinding(null);
      setRetention('');
      setOvertime('');
      setWorkScheduleMode(null);
      setStandardWorkDays(null);
      setStandardStartTime('');
      setStandardEndTime('');
      await load();
    } catch {
      setMsg('Kayıt başarısız');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScreenScroll>
      <ScreenHeader title="Ayarlar" subtitle={company.name} />

      <Card style={{ gap: 12, marginBottom: 12 }}>
        <Text style={screen.label}>Cihaz bağlama</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[true, false].map((v) => (
            <TouchableOpacity key={String(v)} onPress={() => setDeviceBinding(v)}>
              <Chip
                label={v ? 'Açık' : 'Kapalı'}
                tone={(deviceBinding ?? company.deviceBindingEnabled) === v ? 'primary' : 'default'}
              />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={screen.label}>Veri saklama (gün)</Text>
        <FormInput
          keyboardType="number-pad"
          placeholder={String(company.dataRetentionDays)}
          value={retention}
          onChangeText={setRetention}
        />

        <Text style={screen.label}>Fazla mesai çarpanı</Text>
        <FormInput
          keyboardType="decimal-pad"
          placeholder={String(company.overtimeMultiplier)}
          value={overtime}
          onChangeText={setOvertime}
        />

        <Button title="Kaydet" onPress={save} loading={busy} />
        {msg ? <Text style={screen.msg}>{msg}</Text> : null}
      </Card>

      <Card style={{ gap: 12 }}>
        <Text style={{ fontWeight: '600', color: theme.colors.text }}>Çalışma düzeni</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['STANDARD', 'SHIFT'] as const).map((mode) => (
            <TouchableOpacity key={mode} onPress={() => setWorkScheduleMode(mode)}>
              <Chip label={mode === 'STANDARD' ? 'Standart' : 'Vardiya'} tone={activeMode === mode ? 'primary' : 'default'} />
            </TouchableOpacity>
          ))}
        </View>

        {activeMode === 'STANDARD' ? (
          <>
            <Text style={screen.label}>Çalışma günleri</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {DAY_OPTIONS.map((d) => (
                <TouchableOpacity key={d.value} onPress={() => toggleDay(d.value)}>
                  <Chip label={d.label} tone={activeDays.includes(d.value) ? 'primary' : 'default'} />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={screen.label}>Başlangıç saati (HH:MM)</Text>
            <FormInput placeholder={company.standardStartTime} value={standardStartTime} onChangeText={setStandardStartTime} />
            <Text style={screen.label}>Bitiş saati (HH:MM)</Text>
            <FormInput placeholder={company.standardEndTime} value={standardEndTime} onChangeText={setStandardEndTime} />
            <Button title="Çalışma düzenini kaydet" onPress={save} loading={busy} variant="secondary" />
          </>
        ) : null}
      </Card>
    </ScreenScroll>
  );
}
