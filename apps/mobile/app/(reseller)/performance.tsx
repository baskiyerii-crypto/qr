import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { api } from '../../lib/api';
import { Card, StatCard } from '../../components/ui';
import { screen, ScreenScroll, ScreenHeader, EmptyState } from '../../components/screen';
import { theme } from '../../lib/theme';

export default function ResellerPerformanceScreen() {
  const [data, setData] = useState<{
    totalCompanies: number;
    totalEmployees: number;
    attendanceRecords30d: number;
    newCompaniesThisMonth: number;
    monthlyCommission: number;
    avgAttendancePerCompany: number;
    companies: Array<{ id: string; name: string; employeeCount: number; checkInRate30d: number; attendanceRecords30d: number }>;
  } | null>(null);

  useEffect(() => {
    api.get<NonNullable<typeof data>>('/reseller/analytics').then(setData).catch(() => {});
  }, []);

  return (
    <ScreenScroll>
      <ScreenHeader title="Performans" subtitle="Müşteri ağınızın özeti" />

      <View style={styles.statsRow}>
        <StatCard label="Müşteri" value={data?.totalCompanies ?? 0} icon="business-outline" />
        <StatCard label="Personel" value={data?.totalEmployees ?? 0} icon="people-outline" />
      </View>
      <View style={styles.statsRow}>
        <StatCard label="Giriş (30g)" value={data?.attendanceRecords30d ?? 0} icon="log-in-outline" tone="success" />
        <StatCard label="Yeni (ay)" value={data?.newCompaniesThisMonth ?? 0} icon="add-circle-outline" tone="info" />
      </View>

      {data?.monthlyCommission != null && (
        <Card style={styles.commission}>
          <Text style={styles.commissionLabel}>Bu ay komisyon</Text>
          <Text style={styles.commissionNum}>{data.monthlyCommission.toLocaleString('tr-TR')} ₺</Text>
        </Card>
      )}

      <Text style={screen.section}>Müşteri Bazlı</Text>
      <View style={{ gap: 8 }}>
        {data?.companies.map((c) => (
          <Card key={c.id}>
            <Text style={styles.companyName}>{c.name}</Text>
            <Text style={styles.companyMeta}>{c.employeeCount} personel · {c.attendanceRecords30d} giriş · %{c.checkInRate30d} oran</Text>
          </Card>
        ))}
        {!data?.companies.length && <EmptyState icon="bar-chart-outline" title="Veri yok" />}
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  commission: { alignItems: 'center', marginTop: 4, marginBottom: 20, backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary },
  commissionLabel: { fontSize: 14, color: theme.colors.textMuted },
  commissionNum: { fontSize: 28, fontWeight: '700', color: theme.colors.primary, marginTop: 4 },
  companyName: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
  companyMeta: { fontSize: 13, color: theme.colors.textMuted, marginTop: 4 },
});
