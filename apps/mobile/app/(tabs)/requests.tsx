import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { api } from '../../lib/api';
import { Card, Button, Chip } from '../../components/ui';
import { screen, ScreenScroll, ScreenHeader, FormInput } from '../../components/screen';
import { theme } from '../../lib/theme';

type Kind = 'overtime' | 'advance' | 'shift-swap';

interface MyRequests {
  shiftSwaps: Array<{ id: string; date: string; status: string; reason: string | null }>;
  overtime: Array<{ id: string; date: string; minutes: number; status: string }>;
  advances: Array<{ id: string; type: string; amount: string; status: string }>;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Bekliyor', APPROVED: 'Onaylandı', REJECTED: 'Reddedildi', CANCELLED: 'İptal',
};
const statusTone = (s: string) => (s === 'APPROVED' ? 'success' : s === 'REJECTED' ? 'error' : s === 'CANCELLED' ? 'default' : 'warning');

export default function RequestsScreen() {
  const [data, setData] = useState<MyRequests | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [kind, setKind] = useState<Kind>('overtime');
  const [form, setForm] = useState({ date: '', minutes: '', amount: '', reason: '' });
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    try {
      setData(await api.get<MyRequests>('/requests/my'));
    } catch {
      setData(null);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    setError('');
    setMsg('');
    try {
      if (kind === 'overtime') {
        await api.post('/requests/overtime', { date: new Date(form.date).toISOString(), minutes: parseInt(form.minutes, 10), reason: form.reason || undefined });
      } else if (kind === 'advance') {
        await api.post('/requests/advance', { type: 'ADVANCE', amount: parseFloat(form.amount), reason: form.reason || undefined });
      } else {
        await api.post('/requests/shift-swap', { date: new Date(form.date).toISOString(), reason: form.reason || undefined });
      }
      setForm({ date: '', minutes: '', amount: '', reason: '' });
      setMsg('Talebiniz gönderildi');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Talep gönderilemedi');
    }
  };

  return (
    <ScreenScroll refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }}>
      <ScreenHeader title="Taleplerim" subtitle="Fazla mesai, avans ve vardiya takası" />

      <Card style={styles.form}>
        <Text style={styles.formTitle}>Yeni Talep</Text>
        <View style={styles.typeRow}>
          <Button title="Fazla Mesai" variant={kind === 'overtime' ? 'primary' : 'secondary'} onPress={() => setKind('overtime')} />
          <Button title="Avans" variant={kind === 'advance' ? 'primary' : 'secondary'} onPress={() => setKind('advance')} />
          <Button title="Vardiya Takası" variant={kind === 'shift-swap' ? 'primary' : 'secondary'} onPress={() => setKind('shift-swap')} />
        </View>

        {kind !== 'advance' && (
          <>
            <Text style={screen.label}>Tarih (YYYY-MM-DD)</Text>
            <FormInput value={form.date} onChangeText={(v) => setForm({ ...form, date: v })} placeholder="2026-07-10" />
          </>
        )}
        {kind === 'overtime' && (
          <>
            <Text style={screen.label}>Dakika</Text>
            <FormInput value={form.minutes} onChangeText={(v) => setForm({ ...form, minutes: v })} keyboardType="numeric" placeholder="120" />
          </>
        )}
        {kind === 'advance' && (
          <>
            <Text style={screen.label}>Tutar (₺)</Text>
            <FormInput value={form.amount} onChangeText={(v) => setForm({ ...form, amount: v })} keyboardType="numeric" placeholder="1000" />
          </>
        )}
        <Text style={screen.label}>Açıklama</Text>
        <FormInput style={[screen.input, screen.textarea]} value={form.reason} onChangeText={(v) => setForm({ ...form, reason: v })} multiline />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {msg ? <Text style={screen.msg}>{msg}</Text> : null}
        <View style={{ marginTop: 12 }}>
          <Button title="Gönder" icon="send" onPress={submit} />
        </View>
      </Card>

      <Text style={screen.section}>Fazla Mesai</Text>
      <View style={{ gap: 8 }}>
        {data?.overtime.map((r) => (
          <Card key={r.id} style={styles.item}>
            <Text style={styles.itemText}>{new Date(r.date).toLocaleDateString('tr-TR')} · {r.minutes} dk</Text>
            <Chip label={STATUS_LABELS[r.status] || r.status} tone={statusTone(r.status)} />
          </Card>
        ))}
      </View>

      <Text style={screen.section}>Avans / Masraf</Text>
      <View style={{ gap: 8 }}>
        {data?.advances.map((r) => (
          <Card key={r.id} style={styles.item}>
            <Text style={styles.itemText}>{r.type === 'ADVANCE' ? 'Avans' : 'Masraf'} · {r.amount} ₺</Text>
            <Chip label={STATUS_LABELS[r.status] || r.status} tone={statusTone(r.status)} />
          </Card>
        ))}
      </View>

      <Text style={screen.section}>Vardiya Takası</Text>
      <View style={{ gap: 8 }}>
        {data?.shiftSwaps.map((r) => (
          <Card key={r.id} style={styles.item}>
            <Text style={styles.itemText}>{new Date(r.date).toLocaleDateString('tr-TR')}</Text>
            <Chip label={STATUS_LABELS[r.status] || r.status} tone={statusTone(r.status)} />
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
  error: { color: theme.colors.error, marginTop: 8 },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  itemText: { color: theme.colors.text, fontWeight: '600' },
});
