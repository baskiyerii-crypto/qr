import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { api } from '../../lib/api';
import { Card, Button } from '../../components/ui';
import { FormInput, ScreenScroll, ScreenHeader, screen, EmptyState } from '../../components/screen';
import { theme } from '../../lib/theme';

export default function MarketerResellersScreen() {
  const [items, setItems] = useState<Array<{
    id: string; companyName: string; code: string; commissionRate: number;
    _count: { companies: number }; user: { email: string };
  }>>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    companyName: '', email: '', password: '', firstName: '', lastName: '', phone: '', code: '', commissionRate: '15',
  });

  const load = () => api.get<typeof items>('/marketer/resellers').then(setItems).catch(() => {});
  useEffect(() => { load(); }, []);

  const create = async () => {
    setLoading(true);
    try {
      await api.post('/marketer/resellers', {
        ...form,
        code: form.code.toUpperCase(),
        commissionRate: parseFloat(form.commissionRate) / 100,
      });
      setShowForm(false);
      setForm({ companyName: '', email: '', password: '', firstName: '', lastName: '', phone: '', code: '', commissionRate: '15' });
      await load();
    } catch { /* error */ } finally { setLoading(false); }
  };

  return (
    <ScreenScroll>
      <ScreenHeader
        title="Bayilerim"
        right={<Button title={showForm ? 'İptal' : 'Yeni'} icon={showForm ? 'close' : 'add'} onPress={() => setShowForm(!showForm)} variant="secondary" />}
      />

      {showForm && (
        <Card style={styles.form}>
          <FormInput placeholder="Bayi firma adı *" value={form.companyName} onChangeText={(v) => setForm({ ...form, companyName: v })} />
          <FormInput placeholder="Bayi kodu *" value={form.code} onChangeText={(v) => setForm({ ...form, code: v.toUpperCase() })} autoCapitalize="characters" />
          <FormInput placeholder="Ad *" value={form.firstName} onChangeText={(v) => setForm({ ...form, firstName: v })} />
          <FormInput placeholder="Soyad *" value={form.lastName} onChangeText={(v) => setForm({ ...form, lastName: v })} />
          <FormInput placeholder="Telefon *" value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} keyboardType="phone-pad" />
          <FormInput placeholder="Komisyon %" value={form.commissionRate} onChangeText={(v) => setForm({ ...form, commissionRate: v })} keyboardType="numeric" />
          <FormInput placeholder="E-posta *" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} keyboardType="email-address" autoCapitalize="none" />
          <FormInput placeholder="Şifre *" value={form.password} onChangeText={(v) => setForm({ ...form, password: v })} secureTextEntry />
          <Button title="Bayi Oluştur" icon="checkmark" onPress={create} loading={loading} />
        </Card>
      )}

      <View style={{ gap: 8 }}>
        {items.map((r) => (
          <Card key={r.id}>
            <Text style={styles.name}>{r.companyName}</Text>
            <Text style={screen.muted}>{r.user.email} · {r.code}</Text>
            <Text style={screen.muted}>%{(r.commissionRate * 100).toFixed(0)} komisyon · {r._count.companies} müşteri</Text>
          </Card>
        ))}
        {!items.length && <EmptyState icon="storefront-outline" title="Henüz bayi yok" subtitle="Yeni bayi ekleyerek ağınızı büyütün." />}
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  form: { marginBottom: 16 },
  name: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
});
