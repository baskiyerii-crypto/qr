import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { api } from '../../../lib/api';
import { Card, StatCard } from '../../../components/ui';
import { BackLink, ScreenScroll, ScreenHeader, screen, EmptyState } from '../../../components/screen';
import { theme } from '../../../lib/theme';

export default function MarketerCompanyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<{
    name: string; monthlySubscriptionFee: number;
    reseller?: { companyName: string; code: string } | null;
    branches: Array<{ name: string }>;
    employees: Array<{ user: { firstName: string; lastName: string; publicId: string }; position: string | null }>;
    performance: { activeEmployees: number; checkInRate30d: number; taskCompletionRate: number };
  } | null>(null);
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.get<NonNullable<typeof data>>(`/marketer/companies/${id}`).then(setData).catch(() => {});
    api.get<{ qrImageDataUrl: string }>(`/marketer/companies/${id}/qr`).then((r) => setQr(r.qrImageDataUrl)).catch(() => {});
  }, [id]);

  const subtitleParts = [
    data?.reseller ? `Bayi: ${data.reseller.companyName} (${data.reseller.code})` : null,
    data?.monthlySubscriptionFee != null ? `${Number(data.monthlySubscriptionFee).toLocaleString('tr-TR')} ₺/ay abonelik` : null,
  ].filter(Boolean);

  return (
    <ScreenScroll>
      <BackLink label="Müşteriler" />
      <ScreenHeader title={data?.name ?? 'Müşteri'} subtitle={subtitleParts.join(' · ') || undefined} />

      {qr && (
        <Card style={styles.qrCard}>
          <Text style={styles.qrTitle}>Kayıt QR Kodu</Text>
          <Image source={{ uri: qr }} style={styles.qr} resizeMode="contain" />
        </Card>
      )}

      {data?.performance && (
        <View style={styles.statsRow}>
          <StatCard label="Aktif" value={data.performance.activeEmployees} icon="people-outline" />
          <StatCard label="Giriş" value={`${data.performance.checkInRate30d}%`} icon="log-in-outline" tone="success" />
          <StatCard label="Görev" value={`${data.performance.taskCompletionRate}%`} icon="checkmark-done-outline" tone="info" />
        </View>
      )}

      {!!data?.branches.length && (
        <>
          <Text style={screen.section}>Şubeler</Text>
          <View style={{ gap: 8 }}>
            {data.branches.map((b, i) => (
              <Card key={i}><Text style={styles.empName}>{b.name}</Text></Card>
            ))}
          </View>
        </>
      )}

      <Text style={screen.section}>Personel</Text>
      <View style={{ gap: 8 }}>
        {data?.employees.map((e, i) => (
          <Card key={i}>
            <Text style={styles.empName}>{e.user.firstName} {e.user.lastName}</Text>
            <Text style={screen.muted}>{e.user.publicId} · {e.position || '—'}</Text>
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
});
