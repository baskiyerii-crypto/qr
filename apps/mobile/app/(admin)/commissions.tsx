import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { api } from '../../lib/api';
import { Card, StatCard } from '../../components/ui';
import { ScreenScroll, ScreenHeader, screen, EmptyState } from '../../components/screen';
import { theme } from '../../lib/theme';

type Summary = {
  monthTotals: { platform: number; reseller: number; marketer: number; gross: number };
  resellers: Array<{ id: string; companyName: string; code: string; monthlyCommission: number; marketerName: string | null }>;
  marketers: Array<{ id: string; companyName: string; code: string; monthlyCommission: number }>;
};

export default function AdminCommissionsScreen() {
  const [data, setData] = useState<Summary | null>(null);

  useEffect(() => {
    api.get<Summary>('/admin/commissions/summary').then(setData).catch(() => {});
  }, []);

  const t = data?.monthTotals;

  return (
    <ScreenScroll>
      <ScreenHeader title="Komisyon" subtitle="Bu ayın dağılımı" />
      <View style={styles.grid}>
        <View style={styles.cell}><StatCard label="Brüt" value={`${(t?.gross ?? 0).toLocaleString('tr-TR')} ₺`} icon="cash-outline" /></View>
        <View style={styles.cell}><StatCard label="Platform" value={`${(t?.platform ?? 0).toLocaleString('tr-TR')} ₺`} icon="server-outline" tone="info" /></View>
        <View style={styles.cell}><StatCard label="Bayi" value={`${(t?.reseller ?? 0).toLocaleString('tr-TR')} ₺`} icon="storefront-outline" tone="success" /></View>
        <View style={styles.cell}><StatCard label="Pazarlamacı" value={`${(t?.marketer ?? 0).toLocaleString('tr-TR')} ₺`} icon="megaphone-outline" tone="warning" /></View>
      </View>

      <Text style={screen.section}>Bayiler</Text>
      <View style={{ gap: 8 }}>
        {data?.resellers.map((r) => (
          <Card key={r.id}>
            <Text style={styles.name}>{r.companyName} ({r.code})</Text>
            <Text style={screen.muted}>{r.monthlyCommission.toLocaleString('tr-TR')} ₺ · {r.marketerName ?? 'Doğrudan'}</Text>
          </Card>
        ))}
        {!data?.resellers.length && <EmptyState icon="storefront-outline" title="Bayi yok" />}
      </View>

      <Text style={screen.section}>Pazarlamacılar</Text>
      <View style={{ gap: 8 }}>
        {data?.marketers.map((m) => (
          <Card key={m.id}>
            <Text style={styles.name}>{m.companyName} ({m.code})</Text>
            <Text style={screen.muted}>{m.monthlyCommission.toLocaleString('tr-TR')} ₺</Text>
          </Card>
        ))}
        {!data?.marketers.length && <EmptyState icon="megaphone-outline" title="Pazarlamacı yok" />}
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cell: { width: '47.5%', flexGrow: 1 },
  name: { fontWeight: '600', color: theme.colors.text, fontSize: 15 },
});
