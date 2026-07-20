import {
  LayoutDashboard,
  Users,
  UserCircle,
  MapPin,
  Clock,
  Calendar,
  Wallet,
  CheckSquare,
  Megaphone,
  MessageSquare,
  Bell,
  MessageCircle,
  Settings,
  QrCode,
  Smartphone,
  ClipboardList,
  Briefcase,
  ArrowLeftRight,
  ClipboardCheck,
  FileText,
  BarChart3,
  ScrollText,
  ListChecks,
} from 'lucide-react';
import { UserRole } from '@qr/shared';
import { AppShell, type NavGroup } from './AppShell';
import { usePlatformConfig } from '@/hooks/usePlatformConfig';

const ADMIN = UserRole.COMPANY_ADMIN;
const HR = UserRole.HR_MANAGER;
const REGIONAL = UserRole.REGIONAL_MANAGER;
const BRANCH = UserRole.BRANCH_MANAGER;

const groups: NavGroup[] = [
  {
    items: [{ to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', exact: true }],
  },
  {
    label: 'Operasyon',
    items: [
      { to: '/employees', icon: UserCircle, label: 'Personel' },
      { to: '/attendance', icon: QrCode, label: 'Devam' },
      { to: '/attendance-approvals', icon: ClipboardCheck, label: 'Giriş Onayları' },
      { to: '/shifts', icon: Clock, label: 'Vardiyalar' },
      { to: '/timesheets', icon: ClipboardList, label: 'Puantaj' },
      { to: '/branch-transfers', icon: ArrowLeftRight, label: 'Şube Geçişleri' },
      { to: '/tasks', icon: CheckSquare, label: 'Görevler' },
    ],
  },
  {
    label: 'İnsan Kaynakları',
    items: [
      { to: '/leaves', icon: Calendar, label: 'İzinler' },
      { to: '/requests', icon: ClipboardCheck, label: 'Talepler' },
      { to: '/recruitment', icon: Briefcase, label: 'İşe Alım', roles: [ADMIN, HR, REGIONAL, BRANCH] },
      { to: '/documents', icon: FileText, label: 'Belgeler', roles: [ADMIN, HR] },
      { to: '/payroll', icon: Wallet, label: 'Maaş', roles: [ADMIN, HR] },
      { to: '/reports', icon: BarChart3, label: 'Raporlar', roles: [ADMIN, HR] },
    ],
  },
  {
    label: 'İletişim',
    items: [
      { to: '/announcements', icon: Megaphone, label: 'Duyurular' },
      { to: '/surveys', icon: ListChecks, label: 'Anketler' },
      { to: '/messages', icon: MessageSquare, label: 'Mesajlar' },
      { to: '/notifications', icon: Bell, label: 'Bildirimler' },
      { to: '/feedback', icon: MessageCircle, label: 'Geri Bildirim', roles: [ADMIN, HR] },
    ],
  },
  {
    label: 'Yönetim',
    items: [
      { to: '/branches', icon: MapPin, label: 'Şubeler & QR', roles: [ADMIN, HR] },
      { to: '/users', icon: Users, label: 'Kullanıcılar', roles: [ADMIN] },
      { to: '/devices', icon: Smartphone, label: 'Cihazlar', roles: [ADMIN, HR] },
      { to: '/audit-log', icon: ScrollText, label: 'Denetim Kaydı', roles: [ADMIN] },
      { to: '/settings', icon: Settings, label: 'Ayarlar', roles: [ADMIN] },
      { to: '/billing', icon: Wallet, label: 'Abonelik', roles: [ADMIN] },
    ],
  },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: config } = usePlatformConfig();
  return (
    <AppShell
      variant="company"
      brandTitle={config?.brandTitle || 'QR Personel'}
      brandSubtitle={config?.brandSubtitleCompany || 'Yönetim Paneli'}
      brandIconUrl={config?.brandIconUrl}
      groups={groups}
    >
      {children}
    </AppShell>
  );
}
