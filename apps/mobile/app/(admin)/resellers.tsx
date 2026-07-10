import { useEffect, useState } from 'react';

import { View, Text, TouchableOpacity } from 'react-native';

import { useRouter } from 'expo-router';

import { api } from '../../lib/api';

import { Card, Button } from '../../components/ui';

import { ScreenScroll, screen } from '../../components/screen';



export default function AdminResellersScreen() {

  const router = useRouter();

  const [items, setItems] = useState<Array<{

    id: string; companyName: string; code: string; commissionRate: number;

    iyzicoOnboardingStatus: string; _count: { companies: number };

    user: { email: string };

  }>>([]);



  useEffect(() => {

    api.get<typeof items>('/admin/resellers').then(setItems).catch(() => {});

  }, []);



  return (

    <ScreenScroll>

      <View style={screen.header}>

        <Text style={screen.title}>Bayiler</Text>

        <Button title="+ Yeni" onPress={() => router.push('/(admin)/resellers/new')} variant="secondary" />

      </View>

      {items.map((r) => (

        <TouchableOpacity key={r.id} onPress={() => router.push(`/(admin)/resellers/${r.id}`)}>

          <Card style={{ marginBottom: 8 }}>

            <Text style={{ fontWeight: '600' }}>{r.companyName} · {r.code}</Text>

            <Text style={screen.muted}>{r.user.email}</Text>

            <Text style={screen.muted}>

              {r._count.companies} müşteri · iyzico: {r.iyzicoOnboardingStatus} · %{(r.commissionRate * 100).toFixed(0)}

            </Text>

          </Card>

        </TouchableOpacity>

      ))}

      {!items.length && <Text style={screen.empty}>Bayi yok</Text>}

    </ScreenScroll>

  );

}

