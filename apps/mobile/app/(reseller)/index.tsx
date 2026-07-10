import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../lib/api';
import { useAuth } from '../../stores/auth';
import { Card, StatCard, IconBubble } from '../../components/ui';
import { ScreenScroll, ScreenHeader, EmptyState } from '../../components/screen';
import { screen } from '../../components/screen';
import { Icon } from '../../components/Icon';
import { theme } from '../../lib/theme';

export default function ResellerDashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<{
    reseller: { companyName: string; code: string; commissionRate: number; iyzicoOnboardingStatus?: string };
    stats: { totalCompanies: number; totalEmployees: number; monthlyCommission: number };
    companies: Array<{ id: string; name: string; employeeCount: number; commission: number }>;
  } | null>(null);
  const [payments, setPayments] = useState<{
    totalCommission: number;
    monthlyCommission: number;
    payments: Array<{ id: string; resellerAmount: number; paidAt: string; company: { name: string }; plan: { name: string } | null }>;
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [dash, pay] = await Promise.all([
        api.get<NonNullable<typeof data>>('/reseller/dashboard'),
        api.get<NonNullable<typeof payments>>('/reseller/payments'),
      ]);
      setData(dash);
      setPayments(pay);
    } catch { /* network */ }
  };

  useEffect(() => { load(); }, []);

  const iyzicoStatus = data?.reseller.iyzicoOnboardingStatus;
  const showIyzicoBanner = iyzicoStatus && iyzicoStatus !== 'REGISTERED';

  return (
    <ScreenScroll refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}>
      <ScreenHeader title={`Merhaba, ${user?.firstName ?? ''}`} subtitle={`${data?.reseller.companyName ?? ''} · ${data?.reseller.code ?? ''}`} />

      {showIyzicoBanner && (
        <Card style={styles.banner}>
          <Text style={styles.bannerText}>iyzico alt üye kaydı: {iyzicoStatus} — ödeme dağıtımı için IBAN bilgisi gerekebilir.</Text>
        </Card>
      )}

      <View style={styles.statsRow}>
        <StatCard label="Müşteri" value={data?.stats.totalCompanies ?? 0} icon="business-outline" />
        <StatCard label="Personel" value={data?.stats.totalEmployees ?? 0} icon="people-outline" />
        <StatCard label="Bu ay ₺" value={(payments?.monthlyCommission ?? 0).toLocaleString('tr-TR')} icon="cash-outline" tone="success" />
      </View>

      <TouchableOpacity onPress={() => router.push('/(reseller)/companies')} activeOpacity={0.85}>
        <Card style={styles.cta}>
          <IconBubble name="add-circle-outline" size={44} />
          <View style={{ flex: 1 }}>
            <Text style={styles.ctaTitle}>Yeni Müşteri Ekle</Text>
            <Text style={styles.ctaSub}>Şirket oluştur ve QR paylaş</Text>
          </View>
          <Icon name="chevron-forward" size={20} color={theme.colors.textSubtle} />
        </Card>
      </TouchableOpacity>

      <Text style={screen.section}>Son Müşteriler</Text>
      <View style={{ gap: 8 }}>
        {data?.companies.slice(0, 5).map((c) => (
          <TouchableOpacity key={c.id} onPress={() => router.push(`/(reseller)/companies/${c.id}`)} activeOpacity={0.85}>
            <Card>
              <Text style={styles.companyName}>{c.name}</Text>
              <Text style={styles.companyMeta}>{c.employeeCount} personel · +{c.commission.toLocaleString('tr-TR')} ₺</Text>
            </Card>
          </TouchableOpacity>
        ))}
        {!data?.companies.length && <EmptyState icon="business-outline" title="Müşteri yok" subtitle="İlk müşterinizi ekleyin." />}
      </View>

      {payments?.payments && payments.payments.length > 0 && (
        <>
          <Text style={screen.section}>Son Ödemeler (iyzico)</Text>
          <View style={{ gap: 8 }}>
            {payments.payments.slice(0, 8).map((p) => (
              <Card key={p.id}>
                <Text style={styles.companyName}>{p.company.name}</Text>
                <Text style={styles.companyMeta}>+{p.resellerAmount.toLocaleString('tr-TR')} ₺ · {new Date(p.paidAt).toLocaleDateString('tr-TR')}</Text>
              </Card>
            ))}
          </View>
        </>
      )}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  banner: { backgroundColor: theme.colors.warningBg, marginBottom: 12, borderColor: theme.colors.warning },
  bannerText: { fontSize: 13, color: '#92400E' },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary, marginBottom: 20 },
  ctaTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.primary },
  ctaSub: { fontSize: 13, color: theme.colors.textMuted, marginTop: 2 },
  companyName: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
  companyMeta: { fontSize: 13, color: theme.colors.textMuted, marginTop: 4 },
});
