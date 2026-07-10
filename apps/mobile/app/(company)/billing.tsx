import { useEffect, useState } from 'react';
import { Text, Linking } from 'react-native';
import { api } from '../../lib/api';
import { Card, Button } from '../../components/ui';
import { ScreenScroll, screen } from '../../components/screen';

export default function CompanyBillingScreen() {
  const [sub, setSub] = useState<{
    status: string;
    plan: { id: string; name: string; monthlyPrice: number };
    nextBillingAt: string | null;
  } | null>(null);
  const [plans, setPlans] = useState<Array<{ id: string; name: string; monthlyPrice: number }>>([]);

  useEffect(() => {
    api.get<typeof sub>('/billing/subscription').then(setSub).catch(() => {});
    api.get<typeof plans>('/billing/plans').then(setPlans).catch(() => {});
  }, []);

  const checkout = async (planId: string) => {
    const r = await api.post<{ paymentPageUrl?: string }>('/billing/checkout', { planId });
    if (r.paymentPageUrl) Linking.openURL(r.paymentPageUrl);
  };

  return (
    <ScreenScroll>
      <Text style={screen.title}>Abonelik</Text>
      {sub ? (
        <Card>
          <Text style={{ fontWeight: '600' }}>{sub.plan.name}</Text>
          <Text style={screen.muted}>{sub.plan.monthlyPrice.toLocaleString('tr-TR')} ₺/ay · {sub.status}</Text>
          {sub.nextBillingAt && (
            <Text style={screen.muted}>Sonraki fatura: {new Date(sub.nextBillingAt).toLocaleDateString('tr-TR')}</Text>
          )}
        </Card>
      ) : (
        <Text style={screen.muted}>Aktif abonelik yok</Text>
      )}
      {plans.map((p) => (
        <Card key={p.id} style={screen.row}>
          <Text style={{ fontWeight: '600' }}>{p.name}</Text>
          <Text style={screen.muted}>{p.monthlyPrice.toLocaleString('tr-TR')} ₺/ay</Text>
          <Button title="iyzico ile Öde" onPress={() => checkout(p.id)} />
        </Card>
      ))}
    </ScreenScroll>
  );
}
