import { useAuth } from '../../stores/auth';
import { HubMenu, ScreenScroll, ScreenHeader } from '../../components/screen';
import { IconName } from '../../components/Icon';

type HubEntry = { title: string; subtitle?: string; href: `/(admin)/${string}`; icon: IconName };

const ADMIN_HUB: HubEntry[] = [
  { title: 'Genel Bakış', subtitle: 'Platform KPI özeti', href: '/(admin)/overview', icon: 'stats-chart-outline' },
  { title: 'Hiyerarşi', subtitle: 'Pazarlamacı → Bayi → Şirket', href: '/(admin)/hierarchy', icon: 'git-network-outline' },
  { title: 'Şirketler', href: '/(admin)/companies', icon: 'business-outline' },
  { title: 'Pazarlamacılar', href: '/(admin)/marketers', icon: 'megaphone-outline' },
  { title: 'Bayiler', href: '/(admin)/resellers', icon: 'storefront-outline' },
  { title: 'Bayi Başvuruları', href: '/(admin)/applications', icon: 'document-attach-outline' },
  { title: 'Abonelik Planları', href: '/(admin)/plans', icon: 'cube-outline' },
  { title: 'Abonelikler', href: '/(admin)/subscriptions', icon: 'card-outline' },
  { title: 'Ödemeler', href: '/(admin)/payments', icon: 'receipt-outline' },
  { title: 'Komisyon', href: '/(admin)/commissions', icon: 'cash-outline' },
  { title: 'Platform Ayarları', href: '/(admin)/settings', icon: 'settings-outline' },
  { title: 'Entegrasyonlar', href: '/(admin)/integrations', icon: 'link-outline' },
  { title: 'WhatsApp', href: '/(admin)/whatsapp', icon: 'logo-whatsapp' },
  { title: 'Kullanıcılar', href: '/(admin)/users', icon: 'person-circle-outline' },
  { title: 'Sistem Kayıtları', href: '/(admin)/logs', icon: 'reader-outline' },
  { title: 'Geri Bildirimler', href: '/(admin)/feedback', icon: 'chatbubble-ellipses-outline' },
];

export default function AdminHubScreen() {
  const { user } = useAuth();
  return (
    <ScreenScroll>
      <ScreenHeader title="Platform Admin" subtitle={`Merhaba, ${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()} />
      <HubMenu items={ADMIN_HUB} />
    </ScreenScroll>
  );
}
