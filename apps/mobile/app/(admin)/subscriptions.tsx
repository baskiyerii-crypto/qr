import { useEffect, useState } from 'react';

import { Text } from 'react-native';

import { api } from '../../lib/api';

import { Card, Button } from '../../components/ui';

import { ScreenScroll, screen } from '../../components/screen';



export default function AdminSubscriptionsScreen() {

  const [items, setItems] = useState<Array<{

    id: string; status: string; company: { name: string }; plan: { name: string; monthlyPrice: number };

  }>>([]);



  const load = () => api.get<typeof items>('/admin/subscriptions').then(setItems).catch(() => {});

  useEffect(() => { load(); }, []);



  const setStatus = async (id: string, status: string) => {

    await api.patch(`/admin/subscriptions/${id}`, { status });

    load();

  };



  return (

    <ScreenScroll>

      {items.map((s) => (

        <Card key={s.id} style={{ marginBottom: 8 }}>

          <Text style={{ fontWeight: '600' }}>{s.company.name}</Text>

          <Text style={screen.muted}>{s.plan.name} · {s.plan.monthlyPrice.toLocaleString('tr-TR')} ₺</Text>

          <Text style={screen.muted}>Durum: {s.status}</Text>

          {s.status === 'ACTIVE' && (

            <Button title="İptal Et" onPress={() => setStatus(s.id, 'CANCELLED')} variant="secondary" />

          )}

        </Card>

      ))}

      {!items.length && <Text style={screen.empty}>Abonelik yok</Text>}

    </ScreenScroll>

  );

}

