import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { api } from '../../../lib/api';
import { Card, StatCard } from '../../../components/ui';
import { screen, ScreenScroll, ScreenHeader, BackLink, EmptyState } from '../../../components/screen';
import { theme } from '../../../lib/theme';

export default function ResellerCompanyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<{
    name: string;
    performance: { activeEmployees: number; checkInRate30d: number; taskCompletionRate: number };
    employees: Array<{ user: { firstName: string; lastName: string; publicId: string }; position: string | null }>;
  } | null>(null);
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.get<NonNullable<typeof data>>(`/reseller/companies/${id}`).then(setData).catch(() => {});
    api.get<{ qrImageDataUrl: string }>(`/reseller/companies/${id}/qr`).then((r) => setQr(r.qrImageDataUrl)).catch(() => {});
  }, [id]);

  return (
    <ScreenScroll>
      <BackLink label="Müşteriler" />
      <ScreenHeader title={data?.name ?? 'Müşteri'} />

      {qr && (
        <Card style={styles.qrCard}>
          <Text style={styles.qrTitle}>Kayıt QR Kodu</Text>
          <Image source={{ uri: qr }} style={styles.qr} resizeMode="contain" />
        </Card>
      )}

      {data?.performance && (
        <View style={styles.statsRow}>
          <StatCard label="Aktif" value={data.performance.activeEmployees} icon="people-outline" />
          <StatCard label="Giriş oranı" value={`${data.performance.checkInRate30d}%`} icon="log-in-outline" tone="success" />
          <StatCard label="Görev" value={`${data.performance.taskCompletionRate}%`} icon="checkmark-done-outline" tone="info" />
        </View>
      )}

      <Text style={screen.section}>Personel</Text>
      <View style={{ gap: 8 }}>
        {data?.employees.map((e, i) => (
          <Card key={i}>
            <Text style={styles.empName}>{e.user.firstName} {e.user.lastName}</Text>
            <Text style={styles.empMeta}>{e.user.publicId} · {e.position || '—'}</Text>
          </Card>
        ))}
        {!data?.employees.length && <EmptyState icon="people-outline" title="Personel yok" />}
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  qrCard: { alignItems: 'center', marginBottom: 16 },
  qrTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, color: theme.colors.text },
  qr: { width: 200, height: 200 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  empName: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
  empMeta: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },
});
