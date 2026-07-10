import { useCallback, useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { api } from '../../lib/api';
import { Button, Card, Chip } from '../../components/ui';
import { ScreenScroll, ScreenHeader, screen, EmptyState, Loading } from '../../components/screen';

type PendingDevice = {
  id: string;
  deviceName: string;
  platform: string;
  createdAt: string;
  employee: { user: { firstName: string; lastName: string; email: string } };
};

export default function CompanyDevicesScreen() {
  const [devices, setDevices] = useState<PendingDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const list = await api.get<PendingDevice[]>('/devices/pending');
    setDevices(list);
  }, []);

  useEffect(() => {
    load()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [load]);

  const review = async (id: string, approve: boolean) => {
    setBusy(true);
    try {
      await api.post(`/devices/${id}/review`, { approve });
      await load();
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <ScreenScroll><Loading /></ScreenScroll>;

  return (
    <ScreenScroll
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true);
        await load().catch(() => {});
        setRefreshing(false);
      }}
    >
      <ScreenHeader title="Cihazlar" subtitle="Onay bekleyen cihaz bağlantıları" />

      {devices.map((d) => (
        <Card key={d.id} style={{ marginBottom: 8 }}>
          <Text style={{ fontWeight: '600' }}>{d.deviceName}</Text>
          <Text style={screen.muted}>{d.platform}</Text>
          <Text style={screen.muted}>
            {d.employee.user.firstName} {d.employee.user.lastName} · {d.employee.user.email}
          </Text>
          <Text style={screen.muted}>{new Date(d.createdAt).toLocaleString('tr-TR')}</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <Button title="Onayla" onPress={() => review(d.id, true)} loading={busy} />
            <Button title="Reddet" variant="secondary" onPress={() => review(d.id, false)} loading={busy} />
          </View>
        </Card>
      ))}

      {!devices.length ? (
        <EmptyState icon="phone-portrait-outline" title="Bekleyen cihaz yok" subtitle="Tüm cihaz talepleri işlendi." />
      ) : null}
    </ScreenScroll>
  );
}
