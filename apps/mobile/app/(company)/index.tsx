import { useAuth } from '../../stores/auth';
import { HubMenu, ScreenScroll, ScreenHeader } from '../../components/screen';
import { IconName } from '../../components/Icon';
import { isCompanyAdmin } from '../../lib/routes';

const ADMIN_ONLY = 'admin';
const ALL_STAFF = 'staff';

type HubEntry = { title: string; href: `/(company)/${string}`; icon: IconName; scope: string };

const COMPANY_HUB: HubEntry[] = [
  { title: 'Kullanıcılar', href: '/(company)/users', icon: 'person-circle-outline', scope: ADMIN_ONLY },
  { title: 'Personel', href: '/(company)/employees', icon: 'people-outline', scope: ALL_STAFF },
  { title: 'Şubeler & QR', href: '/(company)/branches', icon: 'business-outline', scope: ADMIN_ONLY },
  { title: 'Vardiyalar', href: '/(company)/shifts', icon: 'time-outline', scope: ALL_STAFF },
  { title: 'Devam Takibi', href: '/(company)/attendance', icon: 'location-outline', scope: ALL_STAFF },
  { title: 'Giriş Onayları', href: '/(company)/attendance-approvals', icon: 'checkmark-circle-outline', scope: ALL_STAFF },
  { title: 'Şube Geçişleri', href: '/(company)/branch-transfers', icon: 'swap-horizontal-outline', scope: ALL_STAFF },
  { title: 'Zaman Çizelgeleri', href: '/(company)/timesheets', icon: 'grid-outline', scope: ALL_STAFF },
  { title: 'İşe Alım', href: '/(company)/recruitment', icon: 'briefcase-outline', scope: ALL_STAFF },
  { title: 'Talepler', href: '/(company)/requests', icon: 'mail-outline', scope: ALL_STAFF },
  { title: 'Belgeler', href: '/(company)/documents', icon: 'document-text-outline', scope: ADMIN_ONLY },
  { title: 'Raporlar', href: '/(company)/reports', icon: 'bar-chart-outline', scope: ADMIN_ONLY },
  { title: 'Denetim Kaydı', href: '/(company)/audit-log', icon: 'document-text-outline', scope: ADMIN_ONLY },
  { title: 'Bordro', href: '/(company)/payroll', icon: 'wallet-outline', scope: ADMIN_ONLY },
  { title: 'Görevler', href: '/(company)/tasks', icon: 'checkbox-outline', scope: ALL_STAFF },
  { title: 'Duyurular', href: '/(company)/announcements', icon: 'megaphone-outline', scope: ALL_STAFF },
  { title: 'Anketler', href: '/(company)/surveys', icon: 'clipboard-outline', scope: ALL_STAFF },
  { title: 'Geri Bildirim', href: '/(company)/feedback', icon: 'chatbox-outline', scope: ADMIN_ONLY },
  { title: 'İzinler', href: '/(company)/leaves', icon: 'calendar-outline', scope: ALL_STAFF },
  { title: 'Cihazlar', href: '/(company)/devices', icon: 'phone-portrait-outline', scope: ADMIN_ONLY },
  { title: 'Ayarlar', href: '/(company)/settings', icon: 'settings-outline', scope: ADMIN_ONLY },
  { title: 'Abonelik', href: '/(company)/billing', icon: 'card-outline', scope: ADMIN_ONLY },
  { title: 'Kurulum', href: '/(company)/onboarding', icon: 'rocket-outline', scope: ADMIN_ONLY },
];

export default function CompanyHubScreen() {
  const { user } = useAuth();
  const admin = isCompanyAdmin(user?.role);
  const items = COMPANY_HUB.filter((i) => admin || i.scope === ALL_STAFF).map(
    ({ title, href, icon }) => ({ title, href, icon }),
  );
  return (
    <ScreenScroll>
      <ScreenHeader title="Şirket Yönetimi" subtitle={`${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim()} />
      <HubMenu items={items} />
    </ScreenScroll>
  );
}
