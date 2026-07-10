import { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { api } from '../../lib/api';
import { Card, Button, Chip } from '../../components/ui';
import { ScreenScroll, screen, FormInput, ScreenHeader } from '../../components/screen';
import { clearPlatformConfigCache } from '../../lib/platform-config';

type SettingsData = {
  settings: {
    monthlySubscriptionFee: number;
    defaultCommissionRate: number;
    requireEmployeeLocation: boolean;
  };
};

export default function AdminSettingsScreen() {
  const [fee, setFee] = useState('');
  const [rate, setRate] = useState('');
  const [requireLocation, setRequireLocation] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get<SettingsData>('/admin/settings')
      .then((d) => {
        setFee(String(d.settings.monthlySubscriptionFee));
        setRate(String((d.settings.defaultCommissionRate * 100).toFixed(0)));
        setRequireLocation(d.settings.requireEmployeeLocation ?? true);
      })
      .catch(() => {});
  }, []);

  const save = async () => {
    await api.patch('/admin/settings', {
      monthlySubscriptionFee: parseFloat(fee),
      defaultCommissionRate: parseFloat(rate) / 100,
      requireEmployeeLocation: requireLocation,
    });
    clearPlatformConfigCache();
    setMsg('Kaydedildi');
  };

  return (
    <ScreenScroll>
      <ScreenHeader title="Platform Ayarları" subtitle="Sistem geneli yapılandırma" />
      {msg ? <Text style={screen.msg}>{msg}</Text> : null}
      <Card style={{ gap: 12 }}>
        <Text style={screen.label}>Varsayılan aylık ücret (₺)</Text>
        <FormInput value={fee} onChangeText={setFee} keyboardType="numeric" />
        <Text style={screen.label}>Varsayılan komisyon (%)</Text>
        <FormInput value={rate} onChangeText={setRate} keyboardType="numeric" />

        <Text style={screen.label}>Personel konum zorunluluğu</Text>
        <Text style={screen.muted}>
          Kapalıyken personel QR okutarak konum paylaşmadan giriş/çıkış yapabilir.
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[true, false].map((v) => (
            <TouchableOpacity key={String(v)} onPress={() => setRequireLocation(v)}>
              <Chip
                label={v ? 'Açık' : 'Kapalı'}
                tone={requireLocation === v ? 'primary' : 'default'}
              />
            </TouchableOpacity>
          ))}
        </View>

        <Button title="Kaydet" onPress={save} />
      </Card>
    </ScreenScroll>
  );
}
