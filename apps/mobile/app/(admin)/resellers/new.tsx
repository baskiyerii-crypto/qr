import { useState } from 'react';

import { useRouter } from 'expo-router';

import { api } from '../../../lib/api';

import { Card, Button } from '../../../components/ui';

import { FormInput, ScreenScroll } from '../../../components/screen';



export default function AdminResellerNewScreen() {

  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({

    email: '', password: '', firstName: '', lastName: '', phone: '', companyName: '', code: '', commissionRate: '15',

  });



  const create = async () => {

    setLoading(true);

    try {

      const data = await api.post<{ id?: string }>('/admin/resellers', {

        ...form,

        code: form.code.toUpperCase(),

        commissionRate: parseFloat(form.commissionRate) / 100,

      });

      if (data?.id) router.replace(`/(admin)/resellers/${data.id}`);

      else router.back();

    } catch { /* error */ } finally { setLoading(false); }

  };



  return (

    <ScreenScroll>

      <Card>

        <FormInput placeholder="Bayi firma adı *" value={form.companyName} onChangeText={(v) => setForm({ ...form, companyName: v })} />

        <FormInput placeholder="Bayi kodu *" value={form.code} onChangeText={(v) => setForm({ ...form, code: v.toUpperCase() })} autoCapitalize="characters" />

        <FormInput placeholder="Ad *" value={form.firstName} onChangeText={(v) => setForm({ ...form, firstName: v })} />

        <FormInput placeholder="Soyad *" value={form.lastName} onChangeText={(v) => setForm({ ...form, lastName: v })} />

        <FormInput placeholder="E-posta *" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} keyboardType="email-address" autoCapitalize="none" />

        <FormInput placeholder="Şifre *" value={form.password} onChangeText={(v) => setForm({ ...form, password: v })} secureTextEntry />

        <FormInput placeholder="Telefon *" value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} />

        <FormInput placeholder="Komisyon %" value={form.commissionRate} onChangeText={(v) => setForm({ ...form, commissionRate: v })} keyboardType="numeric" />

        <Button title="Bayi Oluştur" onPress={create} loading={loading} />

      </Card>

    </ScreenScroll>

  );

}

