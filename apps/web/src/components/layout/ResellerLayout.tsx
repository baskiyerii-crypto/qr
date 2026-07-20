import { LayoutDashboard, Building2, MessageCircle } from 'lucide-react';
import { AppShell, type NavGroup } from './AppShell';
import { usePlatformConfig } from '@/hooks/usePlatformConfig';

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
  const { data: config } = usePlatformConfig();
  return (
    <AppShell
      variant="reseller"
      brandTitle={config?.brandSubtitleReseller || 'Bayi Paneli'}
      brandSubtitle={config?.brandTitle || 'QR Personel'}
      brandIconUrl={config?.brandIconUrl}
      groups={groups}
    >
      {children}
    </AppShell>
  );
}
