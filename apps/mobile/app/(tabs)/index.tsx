import { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Card, Button, StatCard, Chip } from '../../components/ui';
import { screen, ScreenScroll } from '../../components/screen';
import { Icon, IconName } from '../../components/Icon';
import { theme } from '../../lib/theme';
import { useAuth } from '../../stores/auth';
import { useDashboard, useMyAnnouncements, usePayrollSummary } from '../../lib/queries';
import { queryKeys } from '../../lib/query-keys';

type QuickAction = { label: string; href: string; icon: IconName };

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const isEmployee = user?.role === 'EMPLOYEE';
  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;

  const { data: dashboard, isFetching: dashFetching, refetch: refetchDash } = useDashboard();
  const { data: summary, refetch: refetchPayroll } = usePayrollSummary(year, month, isEmployee);
  const { data: announcements, refetch: refetchAnn } = useMyAnnouncements(isEmployee);

  const unreadAnn = (announcements ?? []).filter((a) => !a.readAt || (a.announcement.requiresAck && !a.acknowledgedAt)).length;

  const refreshing = dashFetching;
  const onRefresh = useCallback(async () => {
    await Promise.all([
      isEmployee ? refetchPayroll() : refetchDash(),
      isEmployee ? refetchAnn() : Promise.resolve(),
      qc.invalidateQueries({ queryKey: queryKeys.notifications }),
    ]);
  }, [isEmployee, refetchPayroll, refetchDash, refetchAnn, qc]);

  const formatHours = (m: number) => `${Math.floor(m / 60)}s ${m % 60}dk`;

  const employeeActions: QuickAction[] = [
    { label: 'QR Giriş', href: '/(tabs)/qr', icon: 'qr-code-outline' },
    { label: 'Görevler', href: '/(tabs)/tasks', icon: 'checkbox-outline' },
    { label: 'İzinler', href: '/(tabs)/leaves', icon: 'calendar-outline' },
    { label: 'Mesajlar', href: '/(tabs)/messages', icon: 'chatbubbles-outline' },
  ];

  const managerActions: QuickAction[] = [
    { label: 'Yönetim', href: '/(tabs)/admin', icon: 'grid-outline' },
    { label: 'Personel', href: '/(company)/employees', icon: 'people-outline' },
    { label: 'Devam', href: '/(company)/attendance', icon: 'location-outline' },
    { label: 'İşe Alım', href: '/(company)/recruitment', icon: 'briefcase-outline' },
  ];

  const quickActions = isEmployee ? employeeActions : managerActions;

  const content = (
    <ScreenScroll refreshing={refreshing} onRefresh={onRefresh}>
      <LinearGradient colors={[...theme.colors.gradientHero]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <Text style={styles.heroGreeting}>Merhaba,</Text>
        <Text style={styles.heroName}>{user?.firstName}</Text>
        <Text style={styles.heroDate}>
          {new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>
        {unreadAnn > 0 && (
          <TouchableOpacity style={styles.heroBadge} onPress={() => router.push('/(tabs)/announcements')} activeOpacity={0.85}>
            <Icon name="megaphone-outline" size={15} color={theme.colors.primary} />
            <Text style={styles.heroBadgeText}>{unreadAnn} yeni duyuru</Text>
          </TouchableOpacity>
        )}
      </LinearGradient>

      <Text style={styles.sectionTitle}>Hızlı Erişim</Text>
      <View style={styles.quickGrid}>
        {quickActions.map((action) => (
          <TouchableOpacity key={action.href} style={styles.quickItem} onPress={() => router.push(action.href as never)} activeOpacity={0.75}>
            <View style={styles.quickIcon}>
              <Icon name={action.icon} size={22} color={theme.colors.primary} />
            </View>
            <Text style={styles.quickLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {!isEmployee && dashboard && (
        <>
          <Text style={styles.sectionTitle}>Canlı Özet</Text>
          <View style={styles.statsRow}>
            <StatCard label="Personel" value={dashboard.totalEmployees} icon="people-outline" />
            <StatCard label="İçeride" value={dashboard.checkedInNow} icon="log-in-outline" tone="success" />
          </View>
          <View style={styles.statsRow}>
            <StatCard label="Bekleyen izin" value={dashboard.pendingLeaves} icon="time-outline" tone="warning" />
            <StatCard label="Cihaz onayı" value={dashboard.pendingDevices} icon="phone-portrait-outline" tone="info" />
          </View>
          {(dashboard.pendingLeaves > 0 || dashboard.pendingDevices > 0) && (
            <Card style={styles.alertCard}>
              <View style={styles.alertRow}>
                <Icon name="alert-circle-outline" size={20} color={theme.colors.warning} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertTitle}>Onay bekleyen işlemler</Text>
                  <Text style={screen.muted}>İzin ve cihaz taleplerini kontrol edin.</Text>
                </View>
              </View>
              <Button title="Yönetim Paneline Git" icon="arrow-forward-outline" onPress={() => router.push('/(tabs)/admin')} />
            </Card>
          )}
        </>
      )}

      {isEmployee && summary && (
        <>
          <Text style={styles.sectionTitle}>Bu Ay</Text>
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Çalışma Özeti</Text>
              <Chip label={new Date().toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' })} tone="primary" />
            </View>
            <View style={styles.row}>
              <Stat label="Çalışılan" value={formatHours(summary.summary.totalWorkedMinutes)} />
              <Stat label="Fazla mesai" value={formatHours(summary.summary.totalOvertimeMinutes)} color={theme.colors.success} />
            </View>
            <View style={[styles.row, { marginTop: 16 }]}>
              <Stat label="Eksik" value={formatHours(summary.summary.totalMissingMinutes)} color={theme.colors.warning} />
              <Stat label="Devamsız" value={`${summary.summary.absentDays} gün`} />
            </View>
          </Card>

          <Card style={styles.payCard}>
            <Text style={styles.payLabel}>Tahmini Net Maaş</Text>
            <Text style={styles.netPay}>{summary.payroll.estimatedNet.toLocaleString('tr-TR')} ₺</Text>
            <Text style={screen.muted}>
              Brüt {summary.payroll.baseSalary.toLocaleString('tr-TR')} ₺ + fazla mesai - kesinti
            </Text>
          </Card>
        </>
      )}
    </ScreenScroll>
  );

  return content;
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: theme.radius['2xl'], padding: 24, marginBottom: 28, ...theme.shadow.lg },
  heroGreeting: { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  heroName: { fontSize: 28, fontWeight: '700', color: '#fff', letterSpacing: -0.5, marginTop: 2 },
  heroDate: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 6, textTransform: 'capitalize' },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: 16, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 7, borderRadius: theme.radius.full },
  heroBadgeText: { color: theme.colors.primary, fontSize: 13, fontWeight: '600' },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: theme.colors.textMuted, marginBottom: 12 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  quickItem: { width: '48%', backgroundColor: theme.colors.surface, borderRadius: theme.radius.xl, padding: 16, borderWidth: 1, borderColor: theme.colors.borderLight, ...theme.shadow.sm },
  quickIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: theme.colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  quickLabel: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
  card: { marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: theme.colors.text },
  row: { flexDirection: 'row', gap: 16 },
  statBox: { flex: 1 },
  statLabel: { fontSize: 12, color: theme.colors.textMuted, fontWeight: '500' },
  statValue: { fontSize: 18, fontWeight: '700', marginTop: 4, color: theme.colors.text },
  payCard: { marginBottom: 12, backgroundColor: theme.colors.primarySoft, borderColor: theme.colors.primaryLight },
  payLabel: { fontSize: 13, fontWeight: '600', color: theme.colors.primary, marginBottom: 4 },
  netPay: { fontSize: 32, fontWeight: '700', color: theme.colors.primaryDark, letterSpacing: -0.5 },
  alertCard: { marginTop: 4, marginBottom: 12, gap: 14 },
  alertRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  alertTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.text, marginBottom: 2 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
});
