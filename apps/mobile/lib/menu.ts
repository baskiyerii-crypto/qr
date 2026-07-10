import { Href } from 'expo-router';

import { UserRole } from '@qr/shared';

import { IconName } from '../components/Icon';

import { isCompanyAdmin, isCompanyStaff } from './routes';



export type MenuItem = {

  label: string;

  href: Href;

  icon: IconName;

  employeeOnly?: boolean;

  staffOnly?: boolean;

  adminOnly?: boolean;

};



export type MenuSection = {

  id: string;

  label: string;

  items: MenuItem[];

};



const EMPLOYEE_MAIN: MenuItem[] = [

  { label: 'Ana Sayfa', href: '/(tabs)', icon: 'home-outline' },

  { label: 'QR Giriş', href: '/(tabs)/qr', icon: 'qr-code-outline' },

  { label: 'Profil', href: '/(tabs)/profile', icon: 'person-outline' },

];



const EMPLOYEE_OPERATIONS: MenuItem[] = [

  { label: 'Görevler', href: '/(tabs)/tasks', icon: 'checkbox-outline' },

  { label: 'Duyurular', href: '/(tabs)/announcements', icon: 'megaphone-outline' },

  { label: 'Anketler', href: '/(tabs)/surveys', icon: 'clipboard-outline' },

  { label: 'İzinler', href: '/(tabs)/leaves', icon: 'calendar-outline' },

  { label: 'Talepler', href: '/(tabs)/requests', icon: 'mail-outline' },

  { label: 'Mesajlar', href: '/(tabs)/messages', icon: 'chatbubbles-outline' },

  { label: 'Bildirimler', href: '/(tabs)/notifications', icon: 'notifications-outline' },

  { label: 'Geri Bildirim', href: '/(tabs)/feedback', icon: 'chatbox-outline' },

];



const COMPANY_MAIN: MenuItem[] = [

  { label: 'Ana Sayfa', href: '/(tabs)', icon: 'home-outline' },

  { label: 'Yönetim Özeti', href: '/(tabs)/admin', icon: 'grid-outline' },

  { label: 'Şirket Modülleri', href: '/(company)', icon: 'business-outline' },

  { label: 'Profil', href: '/(tabs)/profile', icon: 'person-outline' },

];



const COMPANY_MODULES: MenuItem[] = [

  { label: 'Personel', href: '/(company)/employees', icon: 'people-outline' },

  { label: 'Kullanıcılar', href: '/(company)/users', icon: 'person-circle-outline', adminOnly: true },

  { label: 'Şubeler & QR', href: '/(company)/branches', icon: 'business-outline', adminOnly: true },

  { label: 'Vardiyalar', href: '/(company)/shifts', icon: 'time-outline' },

  { label: 'Devam Takibi', href: '/(company)/attendance', icon: 'location-outline' },

  { label: 'Giriş Onayları', href: '/(company)/attendance-approvals', icon: 'checkmark-circle-outline' },

  { label: 'Şube Geçişleri', href: '/(company)/branch-transfers', icon: 'swap-horizontal-outline' },

  { label: 'Zaman Çizelgeleri', href: '/(company)/timesheets', icon: 'grid-outline' },

  { label: 'İşe Alım', href: '/(company)/recruitment', icon: 'briefcase-outline' },

  { label: 'Talepler', href: '/(company)/requests', icon: 'mail-outline' },

  { label: 'Belgeler', href: '/(company)/documents', icon: 'document-text-outline', adminOnly: true },

  { label: 'Görevler', href: '/(company)/tasks', icon: 'checkbox-outline' },

  { label: 'Duyurular', href: '/(company)/announcements', icon: 'megaphone-outline' },

  { label: 'Anket Yönetimi', href: '/(company)/surveys', icon: 'clipboard-outline' },

  { label: 'İzinler', href: '/(company)/leaves', icon: 'calendar-outline' },

  { label: 'Geri Bildirim', href: '/(company)/feedback', icon: 'chatbox-outline', adminOnly: true },

  { label: 'Cihazlar', href: '/(company)/devices', icon: 'phone-portrait-outline', adminOnly: true },

  { label: 'Bordro', href: '/(company)/payroll', icon: 'wallet-outline', adminOnly: true },

  { label: 'Raporlar', href: '/(company)/reports', icon: 'bar-chart-outline', adminOnly: true },

  { label: 'Denetim Kaydı', href: '/(company)/audit-log', icon: 'document-text-outline', adminOnly: true },

  { label: 'Abonelik', href: '/(company)/billing', icon: 'card-outline', adminOnly: true },

  { label: 'Kurulum', href: '/(company)/onboarding', icon: 'rocket-outline', adminOnly: true },

  { label: 'Ayarlar', href: '/(company)/settings', icon: 'settings-outline', adminOnly: true },

];



const COMPANY_COMMUNICATION: MenuItem[] = [

  { label: 'Mesajlar', href: '/(tabs)/messages', icon: 'chatbubbles-outline' },

  { label: 'Bildirimler', href: '/(tabs)/notifications', icon: 'notifications-outline' },

];



const MARKETER_MAIN: MenuItem[] = [

  { label: 'Panel', href: '/(marketer)', icon: 'home-outline' },

  { label: 'Bayiler', href: '/(marketer)/resellers', icon: 'storefront-outline' },

  { label: 'Müşteriler', href: '/(marketer)/companies', icon: 'business-outline' },

  { label: 'Performans', href: '/(marketer)/performance', icon: 'stats-chart-outline' },

  { label: 'Komisyon', href: '/(marketer)/payments', icon: 'cash-outline' },

  { label: 'Geri Bildirim', href: '/(marketer)/feedback', icon: 'chatbox-outline' },

];



const RESELLER_MAIN: MenuItem[] = [

  { label: 'Panel', href: '/(reseller)', icon: 'home-outline' },

  { label: 'Müşteriler', href: '/(reseller)/companies', icon: 'business-outline' },

  { label: 'Performans', href: '/(reseller)/performance', icon: 'stats-chart-outline' },

  { label: 'Geri Bildirim', href: '/(reseller)/feedback', icon: 'chatbox-outline' },

];



const SUPER_ADMIN_MAIN: MenuItem[] = [

  { label: 'Panel', href: '/(admin)', icon: 'home-outline' },

  { label: 'Genel Bakış', href: '/(admin)/overview', icon: 'stats-chart-outline' },

  { label: 'Hiyerarşi', href: '/(admin)/hierarchy', icon: 'git-network-outline' },

  { label: 'Şirketler', href: '/(admin)/companies', icon: 'business-outline' },

  { label: 'Pazarlamacılar', href: '/(admin)/marketers', icon: 'megaphone-outline' },

  { label: 'Bayiler', href: '/(admin)/resellers', icon: 'storefront-outline' },

  { label: 'Bayi Başvuruları', href: '/(admin)/applications', icon: 'document-attach-outline' },

  { label: 'Abonelik Planları', href: '/(admin)/plans', icon: 'cube-outline' },

  { label: 'Abonelikler', href: '/(admin)/subscriptions', icon: 'card-outline' },

  { label: 'Ödemeler', href: '/(admin)/payments', icon: 'receipt-outline' },

  { label: 'Komisyon', href: '/(admin)/commissions', icon: 'cash-outline' },

  { label: 'Platform Ayarları', href: '/(admin)/settings', icon: 'settings-outline' },

  { label: 'Entegrasyonlar', href: '/(admin)/integrations', icon: 'link-outline' },

  { label: 'WhatsApp', href: '/(admin)/whatsapp', icon: 'logo-whatsapp' },

  { label: 'Kullanıcılar', href: '/(admin)/users', icon: 'person-circle-outline' },

  { label: 'Sistem Kayıtları', href: '/(admin)/logs', icon: 'reader-outline' },

  { label: 'Geri Bildirimler', href: '/(admin)/feedback', icon: 'chatbubble-ellipses-outline' },

];



function filterItems(items: MenuItem[], role?: string): MenuItem[] {

  const employee = role === UserRole.EMPLOYEE;

  const staff = isCompanyStaff(role);

  const admin = isCompanyAdmin(role);



  return items.filter((item) => {

    if (item.employeeOnly && !employee) return false;

    if (item.staffOnly && !staff) return false;

    if (item.adminOnly && !admin) return false;

    return true;

  });

}



export function getMenuSections(role?: string): MenuSection[] {

  if (role === UserRole.SUPER_ADMIN) {

    return [{ id: 'platform', label: 'Platform Yönetimi', items: SUPER_ADMIN_MAIN }];

  }



  if (role === UserRole.MARKETER) {

    return [{ id: 'marketer', label: 'Pazarlama', items: MARKETER_MAIN }];

  }



  if (role === UserRole.RESELLER) {

    return [{ id: 'reseller', label: 'Bayi Paneli', items: RESELLER_MAIN }];

  }



  if (role === UserRole.EMPLOYEE) {

    return [

      { id: 'main', label: 'Genel', items: EMPLOYEE_MAIN },

      { id: 'ops', label: 'Operasyon', items: EMPLOYEE_OPERATIONS },

    ];

  }



  if (isCompanyStaff(role)) {

    return [

      { id: 'main', label: 'Genel', items: COMPANY_MAIN },

      { id: 'company', label: 'Şirket Yönetimi', items: filterItems(COMPANY_MODULES, role) },

      { id: 'comm', label: 'İletişim', items: COMPANY_COMMUNICATION },

    ];

  }



  return [{ id: 'main', label: 'Genel', items: EMPLOYEE_MAIN }];

}

