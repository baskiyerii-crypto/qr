import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { api } from '../../lib/api';
import { Card, StatCard } from '../../components/ui';
import { ScreenScroll, ScreenHeader, screen, EmptyState } from '../../components/screen';
import { theme } from '../../lib/theme';

export default function MarketerPaymentsScreen() {
  const [data, setData] = useState<{
    totalCommission: number; monthlyCommission: number;
    payments: Array<{ id: string; marketerAmount: number; paidAt: string; company: { name: string }; reseller?: { companyName: string } | null }>;
  } | null>(null);

  useEffect(() => {
    api.get<NonNullable<typeof data>>('/marketer/payments').then(setData).catch(() => {});
  }, []);

  return (
    <ScreenScroll>
      <ScreenHeader title="Komisyon Geçmişi" subtitle="Kazançlarınızı takip edin" />
      <View style={styles.statsRow}>
        <StatCard label="Toplam" value={`${(data?.totalCommission ?? 0).toLocaleString('tr-TR')} ₺`} icon="wallet-outline" />
        <StatCard label="Bu ay" value={`${(data?.monthlyCommission ?? 0).toLocaleString('tr-TR')} ₺`} icon="trending-up-outline" tone="success" />
      </View>

      <Text style={screen.section}>Ödemeler</Text>
      <View style={{ gap: 8 }}>
        {data?.payments.map((p) => (
          <Card key={p.id} style={styles.row}>
            <Text style={styles.name}>{p.company.name}{p.reseller ? ` · ${p.reseller.companyName}` : ''}</Text>
            <Text style={styles.amount}>+{p.marketerAmount.toLocaleString('tr-TR')} ₺</Text>
          </Card>
        ))}
        {!data?.payments.length && <EmptyState icon="wallet-outline" title="Ödeme yok" />}
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 14, flex: 1, color: theme.colors.text },
  amount: { fontSize: 15, fontWeight: '700', color: theme.colors.success },
});
