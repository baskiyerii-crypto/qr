import { useEffect, useState } from 'react';

import { View, Text, TouchableOpacity } from 'react-native';

import { useRouter } from 'expo-router';

import { api } from '../../lib/api';

import { Card, Button } from '../../components/ui';

import { ScreenScroll, screen } from '../../components/screen';



export default function AdminMarketersScreen() {

  const router = useRouter();

  const [items, setItems] = useState<Array<{

    id: string; companyName: string; code: string; commissionRate: number; isActive: boolean;

    user: { email: string }; _count: { resellers: number; companies: number };

  }>>([]);



  useEffect(() => {

    api.get<typeof items>('/admin/marketers').then(setItems).catch(() => {});

  }, []);



  return (

    <ScreenScroll>

      <View style={screen.header}>

        <Text style={screen.title}>Pazarlamacılar</Text>

        <Button title="+ Yeni" onPress={() => router.push('/(admin)/marketers/new')} variant="secondary" />

      </View>

      {items.map((m) => (

        <TouchableOpacity key={m.id} onPress={() => router.push(`/(admin)/marketers/${m.id}`)}>

          <Card style={{ marginBottom: 8 }}>

            <Text style={{ fontWeight: '600' }}>{m.companyName} · {m.code}</Text>

            <Text style={screen.muted}>{m.user.email}</Text>

            <Text style={screen.muted}>

              {m._count.resellers} bayi · {m._count.companies} müşteri · %{(m.commissionRate * 100).toFixed(0)}

            </Text>

          </Card>

        </TouchableOpacity>

      ))}

      {!items.length && <Text style={screen.empty}>Pazarlamacı yok</Text>}

    </ScreenScroll>

  );

}

