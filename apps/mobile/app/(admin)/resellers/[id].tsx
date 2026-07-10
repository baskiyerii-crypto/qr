import { useEffect, useState } from 'react';

import { Text } from 'react-native';

import { useLocalSearchParams } from 'expo-router';

import { api } from '../../../lib/api';

import { Card, Button } from '../../../components/ui';

import { FormInput, ScreenScroll, screen } from '../../../components/screen';



export default function AdminResellerDetailScreen() {

  const { id } = useLocalSearchParams<{ id: string }>();

  const [data, setData] = useState<{

    companyName: string; code: string; commissionRate: number; isActive: boolean;

    iyzicoOnboardingStatus: string; iyzicoSubMerchantKey: string | null;

    user: { email: string; firstName: string; lastName: string };

    _count: { companies: number };

  } | null>(null);

  const [rate, setRate] = useState('');

  const [msg, setMsg] = useState('');



  const load = () => {

    if (!id) return;

    api.get<NonNullable<typeof data>>(`/admin/resellers/${id}`).then((d) => {

      setData(d);

      setRate(String((d.commissionRate * 100).toFixed(0)));

    }).catch(() => {});

  };



  useEffect(() => { load(); }, [id]);



  const save = async () => {

    if (!id) return;

    await api.patch(`/admin/resellers/${id}`, { commissionRate: parseFloat(rate) / 100 });

    setMsg('Güncellendi');

    load();

  };



  if (!data) return <ScreenScroll><Text style={screen.empty}>Yükleniyor…</Text></ScreenScroll>;



  return (

    <ScreenScroll>

      {msg ? <Text style={screen.msg}>{msg}</Text> : null}

      <Text style={screen.title}>{data.companyName}</Text>

      <Card style={{ marginBottom: 12 }}>

        <Text style={screen.muted}>{data.user.firstName} {data.user.lastName}</Text>

        <Text style={screen.muted}>{data.user.email} · {data.code}</Text>

        <Text style={screen.muted}>{data._count.companies} müşteri</Text>

        <Text style={screen.muted}>iyzico: {data.iyzicoOnboardingStatus}</Text>

        {data.iyzicoSubMerchantKey && <Text style={screen.muted}>Alt üye: {data.iyzicoSubMerchantKey.slice(0, 12)}…</Text>}

      </Card>

      <Card>

        <FormInput placeholder="Komisyon %" value={rate} onChangeText={setRate} keyboardType="numeric" />

        <Button title="Komisyonu Kaydet" onPress={save} />

      </Card>

    </ScreenScroll>

  );

}

