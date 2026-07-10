import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { api } from '../../lib/api';
import { Card, Button } from '../../components/ui';
import { ScreenScroll, screen } from '../../components/screen';

type LineItem = {
  employee: { user: { firstName: string; lastName: string } };
  netPay: number;
};

export default function CompanyPayrollScreen() {
  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;
  const [items, setItems] = useState<LineItem[]>([]);
  const [status, setStatus] = useState('');

  const calculate = async () => {
    const r = await api.post<{ payrollRun: { status: string }; lineItems: LineItem[] }>(
      `/payroll/calculate?year=${year}&month=${month}`,
    );
    setItems(r.lineItems);
    setStatus(r.payrollRun.status);
  };

  useEffect(() => { calculate().catch(() => {}); }, []);

  return (
    <ScreenScroll>
      <Text style={screen.title}>Bordro</Text>
      <Text style={screen.muted}>{month}/{year} · {status || '—'}</Text>
      <Button title="Yeniden Hesapla" onPress={calculate} />
      {items.map((item, i) => (
        <Card key={i} style={screen.row}>
          <Text style={{ fontWeight: '600' }}>
            {item.employee.user.firstName} {item.employee.user.lastName}
          </Text>
          <Text style={screen.muted}>{item.netPay.toLocaleString('tr-TR')} ₺ net</Text>
        </Card>
      ))}
      {!items.length && <Text style={screen.empty}>Hesaplama sonucu yok</Text>}
    </ScreenScroll>
  );
}
