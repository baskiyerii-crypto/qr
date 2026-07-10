import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { api } from '../../lib/api';
import { StatCard } from '../../components/ui';
import { ScreenScroll, ScreenHeader } from '../../components/screen';

export default function MarketerPerformanceScreen() {
  const [data, setData] = useState<{
    totalResellers: number; directCompanies: number; resellerCompanies: number; monthlyCommission: number;
  } | null>(null);

  useEffect(() => {
    api.get<NonNullable<typeof data>>('/marketer/analytics').then(setData).catch(() => {});
  }, []);

  return (
    <ScreenScroll>
      <ScreenHeader title="Performans" subtitle="Ağınızın genel görünümü" />
      <View style={styles.statsRow}>
        <StatCard label="Bayi" value={data?.totalResellers ?? 0} icon="storefront-outline" />
        <StatCard label="Doğrudan" value={data?.directCompanies ?? 0} icon="business-outline" />
      </View>
      <View style={styles.statsRow}>
        <StatCard label="Bayi müşteri" value={data?.resellerCompanies ?? 0} icon="people-outline" tone="info" />
        <StatCard label="Bu ay" value={`${(data?.monthlyCommission ?? 0).toLocaleString('tr-TR')} ₺`} icon="cash-outline" tone="success" />
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
});
