import { useEffect, useState } from 'react';

import { Text } from 'react-native';

import { useLocalSearchParams } from 'expo-router';

import { api } from '../../../lib/api';

import { Card, Button } from '../../../components/ui';

import { FormInput, ScreenScroll, screen } from '../../../components/screen';



export default function AdminCompanyDetailScreen() {

  const { id } = useLocalSearchParams<{ id: string }>();

  const [company, setCompany] = useState<{

    id: string; name: string; monthlySubscriptionFee: number; qrToken: string;

    reseller: { companyName: string; code: string } | null;

    subscription: { id: string; status: string; plan: { name: string; monthlyPrice: number } } | null;

    branches: Array<{ id: string; name: string }>;

    _count: { employees: number; branches: number };

    payments: Array<{ id: string; amount: number; status: string; plan: { name: string } | null }>;

  } | null>(null);

  const [fee, setFee] = useState('');

  const [msg, setMsg] = useState('');



  const load = () => {

    if (!id) return;

    api.get<NonNullable<typeof company>>(`/admin/companies/${id}`).then((c) => {

      setCompany(c);

      setFee(String(c.monthlySubscriptionFee));

    }).catch(() => {});

  };



  useEffect(() => { load(); }, [id]);



  const saveFee = async () => {

    if (!id) return;

    await api.patch(`/admin/companies/${id}`, { monthlySubscriptionFee: parseFloat(fee) });

    setMsg('Güncellendi');

    load();

  };



  const cancelSub = async () => {

    if (!company?.subscription) return;

    await api.patch(`/admin/subscriptions/${company.subscription.id}`, { status: 'CANCELLED' });

    setMsg('Abonelik iptal edildi');

    load();

  };



  if (!company) return <ScreenScroll><Text style={screen.empty}>Yükleniyor…</Text></ScreenScroll>;



  return (

    <ScreenScroll>

      {msg ? <Text style={screen.msg}>{msg}</Text> : null}

      <Text style={screen.title}>{company.name}</Text>

      <Card style={{ marginBottom: 12 }}>

        <Text style={screen.muted}>Personel: {company._count.employees} · Şube: {company._count.branches}</Text>

        <Text style={screen.muted}>QR: {company.qrToken.slice(0, 8)}…</Text>

        {company.reseller && <Text style={screen.muted}>Bayi: {company.reseller.companyName}</Text>}

        {company.subscription && (

          <Text style={screen.muted}>Abonelik: {company.subscription.plan.name} ({company.subscription.status})</Text>

        )}

      </Card>



      <Card>

        <Text style={{ fontWeight: '600', marginBottom: 8 }}>Aylık ücret</Text>

        <FormInput value={fee} onChangeText={setFee} keyboardType="numeric" />

        <Button title="Kaydet" onPress={saveFee} />

      </Card>



      {company.subscription && company.subscription.status !== 'CANCELLED' && (

        <Button title="Aboneliği İptal Et" onPress={cancelSub} variant="secondary" />

      )}



      <Text style={screen.section}>Şubeler</Text>

      {company.branches.map((b) => (

        <Card key={b.id} style={{ marginBottom: 6 }}><Text>{b.name}</Text></Card>

      ))}



      <Text style={screen.section}>Son Ödemeler</Text>

      {company.payments.slice(0, 10).map((p) => (

        <Card key={p.id} style={{ marginBottom: 6 }}>

          <Text>{p.plan?.name || 'Ödeme'} · {p.amount.toLocaleString('tr-TR')} ₺</Text>

          <Text style={screen.muted}>{p.status}</Text>

        </Card>

      ))}

    </ScreenScroll>

  );

}

