import { LayoutDashboard, Building2, MessageCircle } from 'lucide-react';
import { AppShell, type NavGroup } from './AppShell';

const groups: NavGroup[] = [
  {
    items: [
      { to: '/reseller', icon: LayoutDashboard, label: 'Panel', exact: true },
      { to: '/reseller/companies', icon: Building2, label: 'Müşterilerim' },
      { to: '/reseller/feedback', icon: MessageCircle, label: 'Platform Geri Bildirim' },
    ],
  },
];

export function ResellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell variant="reseller" brandTitle="Bayi Paneli" brandSubtitle="QR Personel" groups={groups}>
      {children}
    </AppShell>
  );
}
