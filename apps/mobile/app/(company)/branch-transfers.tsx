import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { api } from '../../lib/api';
import { Button, Card } from '../../components/ui';
import { ScreenScroll, screen } from '../../components/screen';

interface Transfer {
  id: string;
  type: string;
  status: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  employee: { user: { firstName: string; lastName: string } };
  fromBranch: { name: string } | null;
  toBranch: { name: string };
}

export default function BranchTransfersScreen() {
  const [items, setItems] = useState<Transfer[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.get<Transfer[]>('/branch-transfers');
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const end = async (id: string) => {
    try {
      await api.patch(`/branch-transfers/${id}/end`);
      await load();
    } catch {}
  };

  return (
    <ScreenScroll
      refreshing={refreshing}
      onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
    >
      <Text style={screen.title}>Şube Geçişleri</Text>
      {items.map((t) => (
        <Card key={t.id} style={screen.row}>
          <Text style={{ fontWeight: '600' }}>
            {t.employee.user.firstName} {t.employee.user.lastName}
          </Text>
          <Text style={screen.muted}>
            {t.fromBranch?.name ?? '—'} → {t.toBranch.name} ·{' '}
            {t.type === 'PERMANENT' ? 'Kalıcı' : 'Geçici'} · {t.status}
          </Text>
          <Text style={screen.muted}>
            {new Date(t.effectiveFrom).toLocaleDateString('tr-TR')}
            {t.effectiveTo ? ` – ${new Date(t.effectiveTo).toLocaleDateString('tr-TR')}` : ''}
          </Text>
          {t.status === 'ACTIVE' ? (
            <View style={{ marginTop: 8 }}>
              <Button title="Sonlandır" variant="secondary" onPress={() => end(t.id)} />
            </View>
          ) : null}
        </Card>
      ))}
      {!items.length && <Text style={screen.empty}>Kayıt yok</Text>}
    </ScreenScroll>
  );
}
