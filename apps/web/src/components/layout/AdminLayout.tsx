import {
  LayoutDashboard,
  MessageCircle,
  FileCheck,
  Building2,
  Store,
  CreditCard,
  Receipt,
  Percent,
  Settings,
  Plug,
  UserCog,
  ScrollText,
  Package,
  Network,
} from 'lucide-react';
import { AppShell, type NavGroup } from './AppShell';
import { usePlatformConfig } from '@/hooks/usePlatformConfig';

const groups: NavGroup[] = [
  {
    items: [
      { to: '/admin', icon: LayoutDashboard, label: 'Genel Bakış', exact: true },
      { to: '/admin/hierarchy', icon: Network, label: 'Hiyerarşi' },
    ],
  },
  {
    label: 'İşletme',
    items: [
      { to: '/admin/companies', icon: Building2, label: 'Şirketler' },
      { to: '/admin/marketers', icon: Store, label: 'Pazarlamacılar' },
      { to: '/admin/resellers', icon: Store, label: 'Bayiler' },
      { to: '/admin/applications', icon: FileCheck, label: 'Bayi Başvuruları' },
    ],
  },
  {
    label: 'Gelir',
    items: [
      { to: '/admin/plans', icon: Package, label: 'Abonelik Planları' },
      { to: '/admin/subscriptions', icon: CreditCard, label: 'Abonelikler' },
      { to: '/admin/payments', icon: Receipt, label: 'Ödemeler' },
      { to: '/admin/commissions', icon: Percent, label: 'Komisyon' },
    ],
  },
  {
    label: 'Sistem',
    items: [
      { to: '/admin/settings', icon: Settings, label: 'Platform Ayarları', exact: true },
      { to: '/admin/settings/integrations', icon: Plug, label: 'Entegrasyonlar' },
      { to: '/admin/whatsapp', icon: MessageCircle, label: 'WhatsApp' },
      { to: '/admin/feedback', icon: MessageCircle, label: 'Bayi Geri Bildirimleri' },
      { to: '/admin/users', icon: UserCog, label: 'Kullanıcılar' },
      { to: '/admin/logs', icon: ScrollText, label: 'Sistem Kayıtları' },
    ],
  },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: config } = usePlatformConfig();
  return (
    <AppShell
      variant="admin"
      brandTitle={config?.brandTitle || 'Platform Admin'}
      brandSubtitle={config?.brandSubtitleAdmin || 'Süper Yönetici'}
      brandIconUrl={config?.brandIconUrl}
      groups={groups}
    >
      {children}
    </AppShell>
  );
}
