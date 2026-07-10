import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../lib/api';
import { Card, Button } from '../../components/ui';
import { FormInput, ScreenScroll, ScreenHeader, screen, EmptyState } from '../../components/screen';

export default function MarketerCompaniesScreen() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Array<{ id: string; name: string; employeeCount: number }>>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    companyName: '', email: '', password: '', firstName: '', lastName: '', phone: '',
  });

  const load = async () => {
    const dash = await api.get<{ directCompanies: typeof companies }>('/marketer/dashboard');
    setCompanies(dash.directCompanies);
  };

  useEffect(() => { load().catch(() => {}); }, []);

  const create = async () => {
    setLoading(true);
    try {
      await api.post('/marketer/companies', form);
      setShowForm(false);
      setForm({ companyName: '', email: '', password: '', firstName: '', lastName: '', phone: '' });
      await load();
    } catch { /* error */ } finally { setLoading(false); }
  };

  return (
    <ScreenScroll>
      <ScreenHeader
        title="Doğrudan Müşteriler"
        right={<Button title={showForm ? 'İptal' : 'Yeni'} icon={showForm ? 'close' : 'add'} onPress={() => setShowForm(!showForm)} variant="secondary" />}
      />

      {showForm && (
        <Card style={{ marginBottom: 16 }}>
          <FormInput placeholder="Şirket adı *" value={form.companyName} onChangeText={(v) => setForm({ ...form, companyName: v })} />
          <FormInput placeholder="Telefon *" value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} keyboardType="phone-pad" />
          <FormInput placeholder="Yönetici adı *" value={form.firstName} onChangeText={(v) => setForm({ ...form, firstName: v })} />
          <FormInput placeholder="Yönetici soyadı *" value={form.lastName} onChangeText={(v) => setForm({ ...form, lastName: v })} />
          <FormInput placeholder="E-posta *" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} keyboardType="email-address" autoCapitalize="none" />
          <FormInput placeholder="Şifre *" value={form.password} onChangeText={(v) => setForm({ ...form, password: v })} secureTextEntry />
          <Button title="Müşteri Oluştur" icon="checkmark" onPress={create} loading={loading} />
        </Card>
      )}

      <View style={{ gap: 8 }}>
        {companies.map((c) => (
          <TouchableOpacity key={c.id} onPress={() => router.push(`/(marketer)/companies/${c.id}`)} activeOpacity={0.85}>
            <Card>
              <Text style={{ fontSize: 15, fontWeight: '600' }}>{c.name}</Text>
              <Text style={screen.muted}>{c.employeeCount} personel</Text>
            </Card>
          </TouchableOpacity>
        ))}
        {!companies.length && <EmptyState icon="business-outline" title="Henüz müşteri yok" subtitle="Yeni müşteri ekleyerek başlayın." />}
      </View>
    </ScreenScroll>
  );
}
