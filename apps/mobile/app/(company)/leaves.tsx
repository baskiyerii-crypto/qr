import { useCallback, useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { api } from '../../lib/api';
import { Button, Card, Chip } from '../../components/ui';
import { ScreenScroll, ScreenHeader, screen, EmptyState, Loading } from '../../components/screen';

type Leave = {
  id: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  employee: { user: { firstName: string; lastName: string } };
};

export default function CompanyLeavesScreen() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const list = await api.get<Leave[]>('/leaves');
    setLeaves(list);
  }, []);

  useEffect(() => {
    load()
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [load]);

  const review = async (id: string, approve: boolean) => {
    setBusy(true);
    try {
      await api.post(`/leaves/${id}/review`, { approve });
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
      <ScreenHeader title="İzinler" subtitle="İzin taleplerini yönetin" />

      {leaves.map((l) => (
        <Card key={l.id} style={{ marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600' }}>
                {l.employee.user.firstName} {l.employee.user.lastName}
              </Text>
              <Text style={screen.muted}>{l.type}</Text>
              <Text style={screen.muted}>
                {new Date(l.startDate).toLocaleDateString('tr-TR')} – {new Date(l.endDate).toLocaleDateString('tr-TR')}
              </Text>
            </View>
            <Chip
              label={l.status}
              tone={l.status === 'PENDING' ? 'warning' : l.status === 'APPROVED' ? 'success' : 'default'}
            />
          </View>
          {l.status === 'PENDING' ? (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <Button title="Onayla" onPress={() => review(l.id, true)} loading={busy} />
              <Button title="Reddet" variant="secondary" onPress={() => review(l.id, false)} loading={busy} />
            </View>
          ) : null}
        </Card>
      ))}

      {!leaves.length ? (
        <EmptyState icon="calendar-outline" title="İzin kaydı yok" subtitle="Henüz izin talebi bulunmuyor." />
      ) : null}
    </ScreenScroll>
  );
}
