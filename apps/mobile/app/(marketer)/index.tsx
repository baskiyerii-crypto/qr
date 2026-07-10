import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../lib/api';
import { useAuth } from '../../stores/auth';
import { Card, StatCard } from '../../components/ui';
import { ScreenScroll, ScreenHeader, screen, EmptyState } from '../../components/screen';
import { theme } from '../../lib/theme';

export default function MarketerDashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<{
    marketer: { companyName: string; code: string; commissionRate: number };
    stats: { totalResellers: number; directCompanies: number; resellerCompanies: number; monthlyCommission: number };
    resellers: Array<{ id: string; companyName: string; code: string; clientCount: number }>;
    directCompanies: Array<{ id: string; name: string; employeeCount: number }>;
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      setData(await api.get<NonNullable<typeof data>>('/marketer/dashboard'));
    } catch { /* network */ }
  };

  useEffect(() => { load(); }, []);

  return (
    <ScreenScroll refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}>
      <ScreenHeader
        title={`Merhaba, ${user?.firstName ?? ''}`}
        subtitle={data ? `${data.marketer.companyName} · ${data.marketer.code} · %${((data.marketer.commissionRate || 0) * 100).toFixed(0)} komisyon` : undefined}
      />

      <View style={styles.statsRow}>
        <StatCard label="Bayi" value={data?.stats.totalResellers ?? 0} icon="storefront-outline" />
        <StatCard label="Doğrudan" value={data?.stats.directCompanies ?? 0} icon="business-outline" />
      </View>
      <View style={styles.statsRow}>
        <StatCard label="Bayi müşteri" value={data?.stats.resellerCompanies ?? 0} icon="people-outline" tone="info" />
        <StatCard label="Bu ay" value={`${(data?.stats.monthlyCommission ?? 0).toLocaleString('tr-TR')} ₺`} icon="cash-outline" tone="success" />
      </View>

      <Text style={screen.section}>Bayilerim</Text>
      <View style={{ gap: 8 }}>
        {data?.resellers.slice(0, 5).map((r) => (
          <Card key={r.id}>
            <Text style={styles.name}>{r.companyName} · {r.code}</Text>
            <Text style={screen.muted}>{r.clientCount} müşteri</Text>
          </Card>
        ))}
        {!data?.resellers.length && <EmptyState icon="storefront-outline" title="Henüz bayi yok" />}
      </View>

      <Text style={screen.section}>Doğrudan Müşteriler</Text>
      <View style={{ gap: 8 }}>
        {data?.directCompanies.slice(0, 5).map((c) => (
          <TouchableOpacity key={c.id} onPress={() => router.push(`/(marketer)/companies/${c.id}`)} activeOpacity={0.85}>
            <Card>
              <Text style={styles.name}>{c.name}</Text>
              <Text style={screen.muted}>{c.employeeCount} personel</Text>
            </Card>
          </TouchableOpacity>
        ))}
        {!data?.directCompanies.length && <EmptyState icon="business-outline" title="Henüz müşteri yok" />}
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  name: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
});
