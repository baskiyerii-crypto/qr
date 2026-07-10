import { useEffect, useState } from 'react';

import { Text } from 'react-native';

import { api } from '../../lib/api';

import { Card } from '../../components/ui';

import { ScreenScroll, screen } from '../../components/screen';



export default function AdminPaymentsScreen() {

  const [items, setItems] = useState<Array<{

    id: string; amount: number; status: string; iyzicoPaymentId: string | null; createdAt: string;

    company: { name: string }; reseller: { companyName: string } | null; plan: { name: string } | null;

  }>>([]);



  useEffect(() => {

    api.get<typeof items>('/admin/payments').then(setItems).catch(() => {});

  }, []);



  return (

    <ScreenScroll>

      {items.map((p) => (

        <Card key={p.id} style={{ marginBottom: 8 }}>

          <Text style={{ fontWeight: '600' }}>{p.company.name}</Text>

          <Text style={screen.muted}>{p.amount.toLocaleString('tr-TR')} ₺ · {p.status}</Text>

          <Text style={screen.muted}>{p.plan?.name || '—'} · {p.reseller?.companyName || 'Doğrudan'}</Text>

          {p.iyzicoPaymentId && <Text style={screen.muted}>iyzico: {p.iyzicoPaymentId.slice(0, 12)}…</Text>}

        </Card>

      ))}

      {!items.length && <Text style={screen.empty}>Ödeme yok</Text>}

    </ScreenScroll>

  );

}

