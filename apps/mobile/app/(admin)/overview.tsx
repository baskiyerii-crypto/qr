import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { api } from '../../lib/api';
import { Card, StatCard, Chip } from '../../components/ui';
import { ScreenScroll, ScreenHeader, screen, EmptyState } from '../../components/screen';
import { theme } from '../../lib/theme';

export default function AdminOverviewScreen() {
  const [data, setData] = useState<{
    stats: {
      totalCompanies: number; totalResellers: number; totalEmployees: number;
      pendingApplications: number; monthlyPlatformRevenue: number; activeSubscriptions: number; whatsappState: string;
    };
    recentPayments: Array<{ id: string; amount: number; status: string; company: { name: string } }>;
    recentApplications: Array<{ id: string; firstName: string; lastName: string; email: string; status: string }>;
  } | null>(null);

  useEffect(() => {
    api.get<NonNullable<typeof data>>('/admin/overview').then(setData).catch(() => {});
  }, []);

  const s = data?.stats;

  return (
    <ScreenScroll>
      <ScreenHeader title="Genel Bakış" subtitle="Platform özeti" />
      <View style={styles.statsGrid}>
        <View style={styles.cell}><StatCard label="Şirketler" value={s?.totalCompanies ?? 0} icon="business-outline" /></View>
        <View style={styles.cell}><StatCard label="Bayiler" value={s?.totalResellers ?? 0} icon="storefront-outline" /></View>
        <View style={styles.cell}><StatCard label="Personel" value={s?.totalEmployees ?? 0} icon="people-outline" /></View>
        <View style={styles.cell}><StatCard label="Bekleyen başvuru" value={s?.pendingApplications ?? 0} icon="mail-unread-outline" tone="warning" /></View>
        <View style={styles.cell}><StatCard label="Bu ay gelir" value={`${(s?.monthlyPlatformRevenue ?? 0).toLocaleString('tr-TR')} ₺`} icon="cash-outline" tone="success" /></View>
        <View style={styles.cell}><StatCard label="Aktif abonelik" value={s?.activeSubscriptions ?? 0} icon="card-outline" tone="info" /></View>
      </View>

      <Text style={screen.section}>Son Ödemeler</Text>
      <View style={{ gap: 8 }}>
        {data?.recentPayments.slice(0, 5).map((p) => (
          <Card key={p.id} style={styles.row}>
            <Text style={styles.name}>{p.company.name}</Text>
            <Text style={screen.muted}>{p.amount.toLocaleString('tr-TR')} ₺ · {p.status}</Text>
          </Card>
        ))}
        {!data?.recentPayments.length && <EmptyState icon="wallet-outline" title="Ödeme yok" />}
      </View>

      <Text style={screen.section}>Son Başvurular</Text>
      <View style={{ gap: 8 }}>
        {data?.recentApplications.slice(0, 5).map((a) => (
          <Card key={a.id} style={styles.appRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{a.firstName} {a.lastName}</Text>
              <Text style={screen.muted}>{a.email}</Text>
            </View>
            <Chip label={a.status} tone={a.status === 'PENDING' ? 'warning' : a.status === 'APPROVED' ? 'success' : 'default'} />
          </Card>
        ))}
        {!data?.recentApplications.length && <EmptyState icon="mail-outline" title="Başvuru yok" />}
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cell: { width: '47.5%', flexGrow: 1 },
  row: {},
  appRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
});
