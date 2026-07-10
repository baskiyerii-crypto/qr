import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { api } from '../../lib/api';
import { Card } from '../../components/ui';
import { ScreenScroll, screen } from '../../components/screen';

interface BranchStat {
  branchId: string;
  branchName: string;
  employeeCount: number;
  presentToday: number;
  totalWorkedHours: number;
  totalOvertimeHours: number;
  absentDays: number;
  lateEntries: number;
}

interface Absentee {
  employeeId: string;
  name: string;
  branchName: string | null;
}

export default function ReportsScreen() {
  const [stats, setStats] = useState<BranchStat[]>([]);
  const [absentees, setAbsentees] = useState<Absentee[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const now = new Date();
    try {
      const [s, a] = await Promise.all([
        api.get<BranchStat[]>(`/reports/branches?year=${now.getFullYear()}&month=${now.getMonth() + 1}`),
        api.get<Absentee[]>('/reports/absence-alerts'),
      ]);
      setStats(Array.isArray(s) ? s : []);
      setAbsentees(Array.isArray(a) ? a : []);
    } catch {
      setStats([]);
      setAbsentees([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <ScreenScroll
      refreshing={refreshing}
      onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}
    >
      <Text style={screen.title}>Şube Karşılaştırma</Text>
      {stats.map((b) => (
        <Card key={b.branchId} style={screen.row}>
          <Text style={{ fontWeight: '600' }}>{b.branchName}</Text>
          <Text style={screen.muted}>
            {b.employeeCount} personel · Bugün {b.presentToday} giriş
          </Text>
          <Text style={screen.muted}>
            Çalışılan {b.totalWorkedHours}s · Mesai {b.totalOvertimeHours}s · Geç {b.lateEntries} · Devamsız {b.absentDays}
          </Text>
        </Card>
      ))}
      {!stats.length && <Text style={screen.empty}>Veri yok</Text>}

      <Text style={[screen.title, { marginTop: 20 }]}>Bugün Giriş Yapmayanlar</Text>
      {absentees.map((a) => (
        <Card key={a.employeeId} style={screen.row}>
          <Text style={{ fontWeight: '600' }}>{a.name}</Text>
          <Text style={screen.muted}>{a.branchName ?? '—'}</Text>
        </Card>
      ))}
      {!absentees.length && <Text style={screen.empty}>Devamsız personel yok</Text>}
      <View style={{ height: 24 }} />
    </ScreenScroll>
  );
}
