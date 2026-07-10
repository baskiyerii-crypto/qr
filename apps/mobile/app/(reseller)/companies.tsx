import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../lib/api';
import { Card, Button } from '../../components/ui';
import { ScreenScroll, ScreenHeader, FormInput, EmptyState } from '../../components/screen';
import { Icon } from '../../components/Icon';
import { theme } from '../../lib/theme';

export default function ResellerCompaniesScreen() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Array<{ id: string; name: string; employeeCount: number }>>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ companyName: '', email: '', password: '', firstName: '', lastName: '', phone: '' });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const dash = await api.get<{ companies: typeof companies }>('/reseller/dashboard');
    setCompanies(dash.companies);
  };

  useEffect(() => { load().catch(() => {}); }, []);

  const create = async () => {
    setLoading(true);
    try {
      await api.post('/reseller/companies', form);
      setShowForm(false);
      setForm({ companyName: '', email: '', password: '', firstName: '', lastName: '', phone: '' });
      await load();
    } catch { /* error */ } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenScroll>
      <ScreenHeader
        title="Müşterilerim"
        subtitle="Bayilik altındaki şirketler"
        right={<Button title={showForm ? 'İptal' : 'Yeni'} icon={showForm ? 'close' : 'add'} onPress={() => setShowForm(!showForm)} variant="secondary" />}
      />

      {showForm && (
        <Card style={styles.form}>
          <FormInput placeholder="Şirket adı *" value={form.companyName} onChangeText={(v) => setForm({ ...form, companyName: v })} />
          <FormInput placeholder="İletişim telefonu *" value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} keyboardType="phone-pad" />
          <FormInput placeholder="Yönetici adı *" value={form.firstName} onChangeText={(v) => setForm({ ...form, firstName: v })} />
          <FormInput placeholder="Yönetici soyadı *" value={form.lastName} onChangeText={(v) => setForm({ ...form, lastName: v })} />
          <FormInput placeholder="E-posta *" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} keyboardType="email-address" autoCapitalize="none" />
          <FormInput placeholder="Geçici şifre *" value={form.password} onChangeText={(v) => setForm({ ...form, password: v })} secureTextEntry />
          <Button title="Müşteri Oluştur" icon="add" onPress={create} loading={loading} />
        </Card>
      )}

      <View style={{ gap: 8 }}>
        {companies.map((c) => (
          <TouchableOpacity key={c.id} onPress={() => router.push(`/(reseller)/companies/${c.id}`)} activeOpacity={0.85}>
            <Card>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{c.name}</Text>
                  <Text style={styles.meta}>{c.employeeCount} personel</Text>
                </View>
                <Icon name="chevron-forward" size={18} color={theme.colors.textSubtle} />
              </View>
            </Card>
          </TouchableOpacity>
        ))}
        {!companies.length && <EmptyState icon="business-outline" title="Müşteri yok" subtitle="İlk müşterinizi ekleyin." />}
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  form: { marginBottom: 16, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { fontSize: 15, fontWeight: '600', color: theme.colors.text },
  meta: { fontSize: 13, color: theme.colors.textMuted, marginTop: 4 },
});
