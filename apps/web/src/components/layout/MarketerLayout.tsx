import { LayoutDashboard, Building2, Store, TrendingUp, Receipt, MessageCircle } from 'lucide-react';
import { AppShell, type NavGroup } from './AppShell';

const groups: NavGroup[] = [
  {
    items: [
      { to: '/marketer', icon: LayoutDashboard, label: 'Panel', exact: true },
      { to: '/marketer/resellers', icon: Store, label: 'Bayilerim' },
      { to: '/marketer/companies', icon: Building2, label: 'Doğrudan Müşteriler' },
      { to: '/marketer/performance', icon: TrendingUp, label: 'Performans' },
      { to: '/marketer/payments', icon: Receipt, label: 'Komisyonlar' },
      { to: '/marketer/feedback', icon: MessageCircle, label: 'Platform Geri Bildirim' },
    ],
  },
];

export function MarketerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell variant="marketer" brandTitle="Pazarlamacı Paneli" brandSubtitle="QR Personel" groups={groups}>
      {children}
    </AppShell>
  );
}
