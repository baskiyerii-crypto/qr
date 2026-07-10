import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { api } from '../../lib/api';
import { useAuth } from '../../stores/auth';
import { Card, Button, Chip } from '../../components/ui';
import { screen, ScreenScroll, ScreenHeader, FormInput, EmptyState } from '../../components/screen';
import { theme } from '../../lib/theme';

type Leave = {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  status: string;
  employee?: { user: { firstName: string; lastName: string } };
};

const LEAVE_TYPES = ['ANNUAL', 'SICK', 'UNPAID', 'OTHER'] as const;
const TYPE_LABELS: Record<string, string> = {
  ANNUAL: 'Yıllık', SICK: 'Hastalık', UNPAID: 'Ücretsiz', OTHER: 'Diğer',
};
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Bekliyor', APPROVED: 'Onaylandı', REJECTED: 'Reddedildi',
};
const statusTone = (s: string) => (s === 'APPROVED' ? 'success' : s === 'REJECTED' ? 'error' : 'warning');

export default function LeavesScreen() {
  const { user } = useAuth();
  const isAdmin = user?.role !== 'EMPLOYEE';
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'ANNUAL', startDate: '', endDate: '', reason: '' });
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const path = isAdmin ? '/leaves?status=PENDING' : '/leaves/my';
      const data = await api.get<Leave[]>(path);
      setLeaves(data);
    } catch {
      setLeaves([]);
    }
  }, [isAdmin]);

  useEffect(() => { load(); }, [load]);

  const submitLeave = async () => {
    setError('');
    try {
      await api.post('/leaves', {
        type: form.type,
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        reason: form.reason || undefined,
      });
      setShowForm(false);
      setForm({ type: 'ANNUAL', startDate: '', endDate: '', reason: '' });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Talep gönderilemedi');
    }
  };

  const review = async (id: string, approve: boolean) => {
    await api.post(`/leaves/${id}/review`, { approve });
    await load();
  };

  return (
    <ScreenScroll refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}>
      <ScreenHeader
        title={isAdmin ? 'İzin Onayları' : 'İzinlerim'}
        subtitle={isAdmin ? 'Bekleyen izin talepleri' : 'İzin talepleriniz ve durumları'}
        right={!isAdmin && !showForm ? <Button title="Yeni" icon="add" onPress={() => setShowForm(true)} /> : undefined}
      />

      {!isAdmin && showForm && (
        <Card style={styles.form}>
          <Text style={styles.formTitle}>Yeni İzin Talebi</Text>
          <Text style={screen.label}>Tür</Text>
          <View style={styles.typeRow}>
            {LEAVE_TYPES.map((t) => (
              <Button key={t} title={TYPE_LABELS[t]} variant={form.type === t ? 'primary' : 'secondary'} onPress={() => setForm({ ...form, type: t })} />
            ))}
          </View>
          <Text style={screen.label}>Başlangıç (YYYY-MM-DD)</Text>
          <FormInput value={form.startDate} onChangeText={(v) => setForm({ ...form, startDate: v })} placeholder="2026-07-10" />
          <Text style={screen.label}>Bitiş (YYYY-MM-DD)</Text>
          <FormInput value={form.endDate} onChangeText={(v) => setForm({ ...form, endDate: v })} placeholder="2026-07-12" />
          <Text style={screen.label}>Açıklama</Text>
          <FormInput style={[screen.input, screen.textarea]} value={form.reason} onChangeText={(v) => setForm({ ...form, reason: v })} multiline />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.formActions}>
            <Button title="Gönder" icon="send" onPress={submitLeave} />
            <Button title="İptal" variant="ghost" onPress={() => setShowForm(false)} />
          </View>
        </Card>
      )}

      {leaves.length === 0 && (
        <EmptyState icon="calendar-outline" title={isAdmin ? 'Bekleyen izin yok' : 'İzin kaydı yok'} subtitle={isAdmin ? 'Onay bekleyen talep bulunmuyor.' : 'Henüz izin talebiniz yok.'} />
      )}

      <View style={{ gap: 12, marginTop: 4 }}>
        {leaves.map((l) => (
          <Card key={l.id}>
            <View style={styles.itemHeader}>
              {isAdmin && l.employee ? (
                <Text style={styles.name}>{l.employee.user.firstName} {l.employee.user.lastName}</Text>
              ) : (
                <Text style={styles.name}>{TYPE_LABELS[l.type] || l.type}</Text>
              )}
              <Chip label={STATUS_LABELS[l.status] || l.status} tone={statusTone(l.status)} dot />
            </View>
            {isAdmin && l.employee ? <Text style={styles.type}>{TYPE_LABELS[l.type] || l.type}</Text> : null}
            <Text style={styles.dates}>
              {new Date(l.startDate).toLocaleDateString('tr-TR')} – {new Date(l.endDate).toLocaleDateString('tr-TR')}
            </Text>
            {l.reason ? <Text style={styles.reason}>{l.reason}</Text> : null}
            {isAdmin && l.status === 'PENDING' && (
              <View style={styles.actions}>
                <Button title="Onayla" icon="checkmark" onPress={() => review(l.id, true)} />
                <Button title="Reddet" variant="secondary" onPress={() => review(l.id, false)} />
              </View>
            )}
          </Card>
        ))}
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  form: { marginBottom: 8 },
  formTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, color: theme.colors.text },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  formActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  error: { color: theme.colors.error, marginTop: 8 },
  itemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { fontWeight: '700', fontSize: 15, color: theme.colors.text },
  type: { fontWeight: '600', marginTop: 4, color: theme.colors.textMuted },
  dates: { color: theme.colors.textMuted, marginTop: 4 },
  reason: { marginTop: 6, fontStyle: 'italic', color: theme.colors.textMuted },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
});
