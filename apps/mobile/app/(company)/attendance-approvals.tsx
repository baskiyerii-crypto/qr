import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { api } from '../../lib/api';
import { Button, Card } from '../../components/ui';
import { ScreenScroll, screen } from '../../components/screen';

interface PendingRecord {
  id: string;
  type: string;
  serverTimestamp: string;
  notes: string | null;
  employee: { user: { firstName: string; lastName: string } };
  branch: { name: string };
}

export default function AttendanceApprovalsScreen() {
  const [items, setItems] = useState<PendingRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.get<PendingRecord[]>('/attendance/pending-approvals');
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const review = async (id: string, approve: boolean) => {
    try {
      await api.patch(`/attendance/${id}/review`, { approve });
      setItems((prev) => prev.filter((r) => r.id !== id));
    } catch {}
  };

  return (
    <ScreenScroll
      refreshing={refreshing}
      onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
    >
      <Text style={screen.title}>Giriş Onayları</Text>
      {items.map((r) => (
        <Card key={r.id} style={screen.row}>
          <Text style={{ fontWeight: '600' }}>
            {r.employee.user.firstName} {r.employee.user.lastName}
          </Text>
          <Text style={screen.muted}>
            {r.type === 'CHECK_IN' ? 'Giriş' : 'Çıkış'} · {r.branch.name} ·{' '}
            {new Date(r.serverTimestamp).toLocaleString('tr-TR')}
          </Text>
          {r.notes ? <Text style={screen.muted}>Gerekçe: {r.notes}</Text> : null}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <Button title="Onayla" onPress={() => review(r.id, true)} />
            <Button title="Reddet" variant="secondary" onPress={() => review(r.id, false)} />
          </View>
        </Card>
      ))}
      {!items.length && <Text style={screen.empty}>Onay bekleyen giriş yok</Text>}
    </ScreenScroll>
  );
}
