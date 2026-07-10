import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { api } from '../../lib/api';
import { ListCard, ScreenScroll, EmptyState } from '../../components/screen';

export default function AdminCompaniesScreen() {
  const router = useRouter();
  const [items, setItems] = useState<
    Array<{
      id: string;
      name: string;
      monthlySubscriptionFee: number;
      reseller: { companyName: string; code: string } | null;
      _count: { employees: number };
    }>
  >([]);

  useEffect(() => {
    api.get<typeof items>('/admin/companies').then(setItems).catch(() => {});
  }, []);

  return (
    <ScreenScroll title="Şirketler">
      {items.map((c) => (
        <ListCard
          key={c.id}
          title={c.name}
          subtitle={`${c._count.employees} personel · ${Number(c.monthlySubscriptionFee).toLocaleString('tr-TR')} ₺/ay`}
          meta={c.reseller ? `Bayi: ${c.reseller.companyName} (${c.reseller.code})` : undefined}
          onPress={() => router.push(`/(admin)/companies/${c.id}`)}
        />
      ))}
      {!items.length && <EmptyState title="Şirket yok" subtitle="Henüz kayıtlı şirket bulunmuyor." />}
    </ScreenScroll>
  );
}
