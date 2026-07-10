import { useEffect, useState } from 'react';

import { Text } from 'react-native';

import { api } from '../../lib/api';

import { Card, Button } from '../../components/ui';

import { FormInput, ScreenScroll, screen } from '../../components/screen';



export default function AdminPlansScreen() {

  const [plans, setPlans] = useState<Array<{

    id: string; name: string; monthlyPrice: number; platformShareRate: number; resellerShareRate: number; isActive: boolean;

  }>>([]);

  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({ name: '', monthlyPrice: '', platformShareRate: '70', resellerShareRate: '20' });



  const load = () => api.get<typeof plans>('/admin/subscription-plans').then(setPlans).catch(() => {});

  useEffect(() => { load(); }, []);



  const create = async () => {

    await api.post('/admin/subscription-plans', {

      name: form.name,

      monthlyPrice: parseFloat(form.monthlyPrice),

      platformShareRate: parseFloat(form.platformShareRate) / 100,

      resellerShareRate: parseFloat(form.resellerShareRate) / 100,

    });

    setShowForm(false);

    load();

  };



  return (

    <ScreenScroll>

      <Button title={showForm ? 'İptal' : '+ Yeni Plan'} onPress={() => setShowForm(!showForm)} variant="secondary" />

      {showForm && (

        <Card style={{ marginTop: 12, marginBottom: 12 }}>

          <FormInput placeholder="Plan adı" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />

          <FormInput placeholder="Aylık fiyat" value={form.monthlyPrice} onChangeText={(v) => setForm({ ...form, monthlyPrice: v })} keyboardType="numeric" />

          <FormInput placeholder="Platform payı %" value={form.platformShareRate} onChangeText={(v) => setForm({ ...form, platformShareRate: v })} keyboardType="numeric" />

          <FormInput placeholder="Bayi payı %" value={form.resellerShareRate} onChangeText={(v) => setForm({ ...form, resellerShareRate: v })} keyboardType="numeric" />

          <Button title="Oluştur" onPress={create} />

        </Card>

      )}

      {plans.map((p) => (

        <Card key={p.id} style={{ marginBottom: 8 }}>

          <Text style={{ fontWeight: '600' }}>{p.name}</Text>

          <Text style={screen.muted}>{p.monthlyPrice.toLocaleString('tr-TR')} ₺/ay</Text>

          <Text style={screen.muted}>Platform %{(p.platformShareRate * 100).toFixed(0)} · Bayi %{(p.resellerShareRate * 100).toFixed(0)}</Text>

          <Text style={screen.muted}>{p.isActive ? 'Aktif' : 'Pasif'}</Text>

        </Card>

      ))}

    </ScreenScroll>

  );

}

