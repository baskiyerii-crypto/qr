import { useState } from 'react';

import { Text } from 'react-native';

import { useRouter } from 'expo-router';

import { api } from '../../../lib/api';

import { Card, Button } from '../../../components/ui';

import { FormInput, ScreenScroll } from '../../../components/screen';



export default function AdminMarketerNewScreen() {

  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({

    email: '', password: '', firstName: '', lastName: '', phone: '', companyName: '', code: '', commissionRate: '20',

  });



  const create = async () => {

    setLoading(true);

    try {

      const data = await api.post<{ marketer?: { id: string }; id?: string }>('/admin/marketers', {

        ...form,

        code: form.code.toUpperCase(),

        commissionRate: parseFloat(form.commissionRate) / 100,

      });

      const mid = data?.marketer?.id ?? data?.id;

      if (mid) router.replace(`/(admin)/marketers/${mid}`);

      else router.back();

    } catch { /* error */ } finally { setLoading(false); }

  };



  return (

    <ScreenScroll>

      <Card>

        <FormInput placeholder="Firma adı *" value={form.companyName} onChangeText={(v) => setForm({ ...form, companyName: v })} />

        <FormInput placeholder="Kod *" value={form.code} onChangeText={(v) => setForm({ ...form, code: v.toUpperCase() })} autoCapitalize="characters" />

        <FormInput placeholder="Ad *" value={form.firstName} onChangeText={(v) => setForm({ ...form, firstName: v })} />

        <FormInput placeholder="Soyad *" value={form.lastName} onChangeText={(v) => setForm({ ...form, lastName: v })} />

        <FormInput placeholder="Telefon *" value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} />

        <FormInput placeholder="Komisyon %" value={form.commissionRate} onChangeText={(v) => setForm({ ...form, commissionRate: v })} keyboardType="numeric" />

        <FormInput placeholder="E-posta *" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} keyboardType="email-address" autoCapitalize="none" />

        <FormInput placeholder="Şifre *" value={form.password} onChangeText={(v) => setForm({ ...form, password: v })} secureTextEntry />

        <Button title="Oluştur" onPress={create} loading={loading} />

      </Card>

      <Text style={{ marginTop: 8, color: '#888', fontSize: 12 }}>Yeni pazarlamacı hesabı oluşturulur.</Text>

    </ScreenScroll>

  );

}

