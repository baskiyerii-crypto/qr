import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { api } from '../../lib/api';
import { Button, Card } from '../../components/ui';
import { ScreenScroll, screen } from '../../components/screen';

interface Base {
  id: string;
  status: string;
  reason?: string | null;
  employee: { user: { firstName: string; lastName: string } };
}
interface RequestsData {
  shiftSwaps: Array<Base & { date: string }>;
  overtime: Array<Base & { date: string; minutes: number }>;
  advances: Array<Base & { type: string; amount: string }>;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Bekliyor', APPROVED: 'Onaylandı', REJECTED: 'Reddedildi', CANCELLED: 'İptal',
};

export default function CompanyRequestsScreen() {
  const [data, setData] = useState<RequestsData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await api.get<RequestsData>('/requests'));
    } catch {
      setData(null);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const review = async (kind: string, id: string, approve: boolean) => {
    try {
      await api.patch(`/requests/${kind}/${id}/review`, { approve });
      await load();
    } catch {}
  };

  const name = (r: Base) => `${r.employee.user.firstName} ${r.employee.user.lastName}`;

  const actions = (kind: string, r: Base) =>
    r.status === 'PENDING' ? (
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        <Button title="Onayla" onPress={() => review(kind, r.id, true)} />
        <Button title="Reddet" variant="secondary" onPress={() => review(kind, r.id, false)} />
      </View>
    ) : (
      <Text style={screen.muted}>{STATUS_LABELS[r.status] || r.status}</Text>
    );

  return (
    <ScreenScroll
      refreshing={refreshing}
      onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
    >
      <Text style={screen.title}>Talepler</Text>

      <Text style={screen.section}>Fazla Mesai</Text>
      {data?.overtime.map((r) => (
        <Card key={r.id} style={screen.row}>
          <Text style={{ fontWeight: '600' }}>{name(r)}</Text>
          <Text style={screen.muted}>{new Date(r.date).toLocaleDateString('tr-TR')} · {r.minutes} dk</Text>
          {actions('overtime', r)}
        </Card>
      ))}

      <Text style={screen.section}>Avans / Masraf</Text>
      {data?.advances.map((r) => (
        <Card key={r.id} style={screen.row}>
          <Text style={{ fontWeight: '600' }}>{name(r)}</Text>
          <Text style={screen.muted}>{r.type === 'ADVANCE' ? 'Avans' : 'Masraf'} · {r.amount} ₺</Text>
          {actions('advance', r)}
        </Card>
      ))}

      <Text style={screen.section}>Vardiya Takası</Text>
      {data?.shiftSwaps.map((r) => (
        <Card key={r.id} style={screen.row}>
          <Text style={{ fontWeight: '600' }}>{name(r)}</Text>
          <Text style={screen.muted}>{new Date(r.date).toLocaleDateString('tr-TR')}</Text>
          {actions('shift-swap', r)}
        </Card>
      ))}
    </ScreenScroll>
  );
}
