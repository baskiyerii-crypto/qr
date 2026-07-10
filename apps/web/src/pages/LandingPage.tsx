import { Link } from '@tanstack/react-router';
import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { MarketingHeader } from '@/components/layout/MarketingHeader';
import { MarketingFooter } from '@/components/layout/MarketingFooter';
import { cn } from '@/lib/utils';
import {
  QrCode,
  MapPin,
  Clock,
  Users,
  Megaphone,
  Shield,
  Smartphone,
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
  Wallet,
  Building2,
  TrendingUp,
  Zap,
  BarChart3,
  MessageSquare,
  Calendar,
  SmartphoneNfc,
  Layers,
  HandCoins,
  BadgePercent,
  Globe,
  Star,
  Lock,
  LayoutDashboard,
  Bell,
  Search,
  Plus,
  ArrowUpRight,
  ListChecks,
  Briefcase,
  FileText,
  MessageCircle,
  ClipboardCheck,
  ClipboardList,
  CheckSquare,
  ArrowLeftRight,
  Target,
  X,
  Flame,
  CircleDollarSign,
  ScrollText,
  type LucideIcon,
} from 'lucide-react';

const stats = [
  { value: '20+', label: 'Entegre modül' },
  { value: '15 dk', label: 'Canlıya alma' },
  { value: '0 ₺', label: 'Donanım maliyeti' },
  { value: '7/24', label: 'Web + mobil yönetim' },
];

/** Tüm müşteri modülleri — sidebar ile birebir */
const featureModules = [
  {
    id: 'operasyon',
    label: 'Operasyon',
    tagline: 'Sahadan panele anlık veri',
    items: [
      { icon: QrCode, title: 'QR giriş-çıkış', hook: 'Turnike yok, kart yok — telefon yeter.' },
      { icon: MapPin, title: 'Geofence doğrulama', hook: 'Kayıt yalnızca şube konumunda alınır.' },
      { icon: Clock, title: 'Vardiya & puantaj', hook: 'Geç kalma, fazla mesai otomatik hesaplanır.' },
      { icon: ClipboardList, title: 'Zaman çizelgeleri', hook: 'Günlük/haftalık puantaj tek ekranda.' },
      { icon: ArrowLeftRight, title: 'Şube geçişleri', hook: 'Personel şubeler arası onaylı geçiş.' },
      { icon: CheckSquare, title: 'Görev yönetimi', hook: 'Ata, takip et, mobilde tamamla.' },
      { icon: ClipboardCheck, title: 'Giriş onayları', hook: 'Şube dışı girişler yönetici onayına düşer.' },
    ],
  },
  {
    id: 'ik',
    label: 'İnsan Kaynakları',
    tagline: 'İK’nın tüm iş yükü tek yerde',
    items: [
      { icon: Calendar, title: 'İzin yönetimi', hook: 'Talep → onay → bakiyeye otomatik yansıma.' },
      { icon: ClipboardCheck, title: 'Talepler', hook: 'Mesai, avans, vardiya değişimi tek akışta.' },
      { icon: Briefcase, title: 'İşe alım', hook: 'Özel başvuru formu, public kariyer sayfası, Excel & PDF CV.' },
      { icon: FileText, title: 'Belge yönetimi', hook: 'Personel evrakları dijital arşivde.' },
      { icon: Wallet, title: 'Bordro & maaş', hook: 'Puantajdan bordroya, Excel & PDF export.' },
      { icon: BarChart3, title: 'Raporlar', hook: 'Devamsızlık, şube karşılaştırma, canlı KPI.' },
      { icon: FileSpreadsheet, title: 'Excel toplu yükleme', hook: 'Onlarca personeli tek seferde ekleyin.' },
    ],
  },
  {
    id: 'iletisim',
    label: 'İletişim & Anket',
    tagline: 'WhatsApp kaosuna son — her şey uygulama içinde',
    highlight: true,
    items: [
      { icon: Megaphone, title: 'Hedefli duyurular', hook: 'Tüm personel, departman veya seçili kişiler.' },
      { icon: ListChecks, title: 'Personel anketleri', hook: 'Web veya mobilde oluşturun; personel doldurur, sonuçları her yerden izleyin.' },
      { icon: MessageSquare, title: '1:1 mesajlaşma', hook: 'Yönetici ↔ personel güvenli kanal.' },
      { icon: Users, title: 'Grup sohbetleri', hook: 'Şube/bölge ekipleri için grup oluşturun.' },
      { icon: Bell, title: 'Anlık bildirimler', hook: 'Push ile anket, mesaj ve görev uyarıları.' },
      { icon: MessageCircle, title: 'Geri bildirim', hook: 'Personel yöneticiye doğrudan iletişim kurar.' },
    ],
  },
  {
    id: 'yonetim',
    label: 'Yönetim & Güvenlik',
    tagline: 'Kurumsal kontrol, KVKK uyumu',
    items: [
      { icon: Users, title: 'Rol & yetki', hook: 'Şirket, İK, bölge, şube müdürü, personel.' },
      { icon: MapPin, title: 'Şubeler & QR', hook: 'Çok şubeli yapı, her şubeye özel QR.' },
      { icon: SmartphoneNfc, title: 'Cihaz bağlama', hook: 'Onaylı telefonlardan giriş — hesap paylaşımı biter.' },
      { icon: Shield, title: 'KVKK uyumu', hook: 'Aydınlatma metni, açık rıza, veri izolasyonu.' },
      { icon: LayoutDashboard, title: 'Canlı dashboard', hook: 'Kim içeride, bekleyen onaylar, anlık özet.' },
      { icon: ScrollText, title: 'Denetim kaydı', hook: 'Kritik işlemler izlenebilir ve kayıt altında.' },
    ],
  },
] as const;

const painVsGain = [
  { pain: 'Excel puantaj + WhatsApp grupları', gain: 'Tek panel, tek mobil uygulama' },
  { pain: 'Turnike & kart okuyucu maliyeti', gain: 'QR kod — 0 ₺ donanım' },
  { pain: 'Anket için Google Form + takip yok', gain: 'Hedefli anket, anlık tamamlanma oranı' },
  { pain: 'Dağınık mesajlaşma, kayıt yok', gain: 'Yönetici–personel & grup mesajları' },
  { pain: 'Şube müdürü her şeyi görüyor', gain: 'Rol bazlı erişim, şube izolasyonu' },
  { pain: 'Bordro için manuel aktarım', gain: 'Puantajdan bordroya otomatik köprü' },
];

const features = [
  { icon: QrCode, title: 'QR ile giriş-çıkış', description: 'Turnike veya kart okuyucu gerekmez. Personel şube QR kodunu okutur, giriş-çıkış saniyeler içinde kayda geçer.' },
  { icon: MapPin, title: 'Geofence & konum doğrulama', description: 'Kayıt yalnızca tanımlı şube konumunda alınır. Uzaktan veya sahte giriş denemeleri otomatik engellenir.' },
  { icon: Clock, title: 'Puantaj & vardiya', description: 'Vardiyalı veya standart mesai. Geç kalma, erken çıkış, fazla mesai ve devamsızlık otomatik hesaplanır.' },
  { icon: FileSpreadsheet, title: 'Excel ile toplu personel', description: 'Onlarca personeli tek seferde Excel şablonuyla yükleyin. Ad, e-posta, şifre ve şube bilgileri dahil.' },
  { icon: Users, title: 'Rol & yetki yönetimi', description: 'Şirket, İK, bölge müdürü, şube müdürü ve personel rolleri. Şube müdürü yalnızca kendi şubesini görür.' },
  { icon: Wallet, title: 'Bordro & maaş', description: 'Aylık bordro hesaplama, Excel ve PDF dışa aktarım. Puantaj verisiyle tam entegre çalışır.' },
  { icon: Calendar, title: 'İzin yönetimi', description: 'Personel izin talebi oluşturur, yönetici onaylar veya reddeder. Bakiyeye ve puantaja otomatik yansır.' },
  { icon: Megaphone, title: 'Görev & duyuru', description: 'Görev atama, öncelik takibi, hedefli duyurular (tüm personel / departman / seçili) ve okundu bilgisi.' },
  { icon: ListChecks, title: 'Personel anketleri', description: 'Yönetici web veya mobilde anket yayınlar. Personel uygulamadan doldurur; tamamlanma oranı her iki panelde anlık görünür.' },
  { icon: MessageSquare, title: 'Mesaj & grup sohbeti', description: 'Yönetici–personel 1:1 mesaj, şube/bölge grup sohbetleri. WhatsApp gruplarına veda — kayıt altında iletişim.' },
  { icon: SmartphoneNfc, title: 'Cihaz bağlama', description: 'İsteğe bağlı cihaz kilidi ile giriş yalnızca onaylı telefonlardan yapılır. Hesap paylaşımı biter.' },
  { icon: Shield, title: 'KVKK uyumlu', description: 'Aydınlatma metni, açık rıza kaydı ve kişisel veri erişimi. Yasal gereklilikler baştan düşünüldü.' },
  { icon: BarChart3, title: 'Canlı dashboard & raporlar', description: 'Kim içeride, bugünkü girişler, bekleyen izinler, şube karşılaştırma ve devamsızlık uyarıları tek ekranda.' },
];

const steps = [
  { title: 'Şirketinizi kaydedin', description: 'Ücretsiz kayıt formunu doldurun. 15 dakikada yönetim paneliniz kullanıma hazır olur.' },
  { title: 'Şube ve QR oluşturun', description: 'Şube adresini girin, geofence yarıçapını ayarlayın, QR kodunuzu yazdırın veya ekrana yansıtın.' },
  { title: 'Personeli ekleyin', description: 'Tek tek veya Excel ile toplu yükleyin. Her personele şifre atayın — mobil uygulamadan giriş yaparlar.' },
  { title: 'Devam takibi başlasın', description: 'Personel QR okutur, puantaj otomatik oluşur. Siz web veya mobil yönetim panelinden raporlayın ve yönetin.' },
];

const audiences = [
  { icon: Building2, title: 'İşletmeler & İK ekipleri', points: ['Turnike ve kart maliyeti yok', 'Çok şubeli yapı desteği', 'Excel puantaj & bordro'] },
  { icon: Layers, title: 'Çok şubeli zincirler', points: ['Bölge & şube müdürü yetkileri', 'Şube karşılaştırma raporları', 'Şube geçiş & onay akışı'] },
  { icon: Globe, title: 'Bayiler & serbest çalışanlar', points: ['Müşterilerinize ek hizmet', 'Düzenli aylık komisyon', 'Kolay devreye alma'] },
];

const resellerBenefits = [
  'Şirketlere aylık abonelik satın — her müşteriden düzenli, tekrarlayan gelir',
  'Komisyon oranınızı ve kazancınızı panelden anlık takip edin',
  'Müşteri sayısı, ciro ve abonelik durumunu tek ekranda görün',
  'Bayi kodunuzla gelen kayıtlar otomatik hesabınıza bağlanır',
  'Ek yazılım geliştirme maliyeti yok — hazır, markalı platform',
];

const faqs = [
  { q: 'Anketleri kim oluşturur, personel nereden doldurur?', a: 'Şirket yöneticisi, İK veya şube müdürü web veya mobil panelden anket yayınlar. Katılım oranı, katılan ve katılmayan personel listesi panelde görünür. Personel mobil uygulamadan doldurur; sonuçlar Excel/PDF olarak da indirilebilir.' },
  { q: 'İşe alım ve başvuru formları nasıl çalışır?', a: 'Kendi başvuru form şablonlarınızı oluşturun (metin, seçenek, CV yükleme). Public kariyer sayfanızdan veya ilan linkinden adaylar başvurur. Başvuruları toplu Excel veya aday bazında PDF CV olarak indirin; kanban ile mülakat sürecini yönetin.' },
  { q: 'Mesajlaşma nasıl çalışır?', a: 'Yöneticiler personele 1:1 mesaj veya grup sohbeti başlatabilir. Personel yalnızca kendisine açılan konuşmalara yanıt verir — personel arası mesajlaşma yoktur. Web ve mobilde aynı thread görünür.' },
  { q: 'Mobilde hangi özellikler var?', a: 'QR giriş, izin, görev, duyuru, anket doldurma, mesajlaşma, bildirimler ve bordro özeti dahil — web panelindeki tüm şirket modülleri mobilde de mevcuttur.' },
  { q: 'Donanım almam gerekiyor mu?', a: 'Hayır. Yalnızca şube girişine asacağınız veya ekranda göstereceğiniz bir QR kod yeterli. Personel kendi telefonunu kullanır.' },
  { q: 'Vardiya sistemi zorunlu mu?', a: 'Hayır. Vardiya kullanmayan firmalar standart mesai saatleri ve çalışma günlerini tanımlayabilir.' },
  { q: 'Bayi olarak nasıl para kazanırım?', a: 'Bayi hesabı açtırıp müşteri şirketleri sisteme kaydedersiniz. Her aktif abonelikten her ay komisyon alırsınız — tek seferlik değil, tekrarlayan gelir.' },
  { q: 'Veriler güvende mi?', a: 'Her şirketin verisi izole (çok kiracılı) tutulur. KVKK aydınlatma metni, açık rıza kaydı ve cihaz doğrulama desteklenir.' },
  { q: 'Mobil uygulama hangi platformlarda var?', a: 'iOS ve Android. Hem personel hem yöneticiler aynı uygulamayı kullanır: personel QR ve talepler; yöneticiler “Yönetim” sekmesinden bordro, anket, mesaj ve tüm şirket modüllerine erişir.' },
  { q: 'Yanlış şubeye giriş yapılırsa ne olur?', a: 'Sistem en yakın şubeyi konumdan otomatik seçer. Atanmamış bir şubeye giriş, yönetici onayı veya tanımlı şube geçişi gerektirir.' },
];

/** Landing card tints — matches hero CTA / text-gradient palette */
const marketingAccents = [
  {
    card: 'border-violet-200/80 bg-gradient-to-br from-violet-50/90 via-card to-card dark:border-violet-500/30 dark:from-violet-950/40',
    icon: 'bg-gradient-to-br from-violet-500/20 to-fuchsia-500/15 text-violet-700 dark:from-violet-500/30 dark:to-fuchsia-500/20 dark:text-violet-300',
    badge: 'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/20',
  },
  {
    card: 'border-sky-200/80 bg-gradient-to-br from-sky-50/90 via-card to-card dark:border-sky-500/30 dark:from-sky-950/40',
    icon: 'bg-gradient-to-br from-sky-500/20 to-cyan-500/15 text-sky-700 dark:from-sky-500/30 dark:to-cyan-500/20 dark:text-sky-300',
    badge: 'bg-gradient-to-br from-sky-600 to-cyan-600 text-white shadow-md shadow-sky-500/20',
  },
  {
    card: 'border-indigo-200/80 bg-gradient-to-br from-indigo-50/90 via-card to-card dark:border-indigo-500/30 dark:from-indigo-950/40',
    icon: 'bg-gradient-to-br from-indigo-500/20 to-violet-500/15 text-indigo-700 dark:from-indigo-500/30 dark:to-violet-500/20 dark:text-indigo-300',
    badge: 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20',
  },
  {
    card: 'border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 via-card to-card dark:border-emerald-500/30 dark:from-emerald-950/40',
    icon: 'bg-gradient-to-br from-emerald-500/20 to-teal-500/15 text-emerald-700 dark:from-emerald-500/30 dark:to-teal-500/20 dark:text-emerald-300',
    badge: 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/20',
  },
  {
    card: 'border-fuchsia-200/80 bg-gradient-to-br from-fuchsia-50/90 via-card to-card dark:border-fuchsia-500/30 dark:from-fuchsia-950/40',
    icon: 'bg-gradient-to-br from-fuchsia-500/20 to-pink-500/15 text-fuchsia-700 dark:from-fuchsia-500/30 dark:to-pink-500/20 dark:text-fuchsia-300',
    badge: 'bg-gradient-to-br from-fuchsia-600 to-pink-600 text-white shadow-md shadow-fuchsia-500/20',
  },
  {
    card: 'border-amber-200/80 bg-gradient-to-br from-amber-50/90 via-card to-card dark:border-amber-500/30 dark:from-amber-950/40',
    icon: 'bg-gradient-to-br from-amber-500/20 to-orange-500/15 text-amber-800 dark:from-amber-500/30 dark:to-orange-500/20 dark:text-amber-300',
    badge: 'bg-gradient-to-br from-amber-600 to-orange-600 text-white shadow-md shadow-amber-500/20',
  },
] as const;

/* --- Product mockups (pure CSS, mirrors the real monochrome UI) --- */

const navItems = [
  { icon: LayoutDashboard, label: 'Kontrol Paneli' },
  { icon: Users, label: 'Personel' },
  { icon: QrCode, label: 'Devam' },
  { icon: ListChecks, label: 'Anketler' },
  { icon: MessageSquare, label: 'Mesajlar' },
  { icon: Clock, label: 'Puantaj' },
  { icon: Wallet, label: 'Bordro' },
];

const dashStats = [
  { v: '142', k: 'Personel', d: '+6' },
  { v: '128', k: 'İçeride', d: '90%' },
  { v: '%94', k: 'Devam', d: '+2.1' },
  { v: '3', k: 'Bekleyen', d: 'izin' },
];

const roster = [
  { n: 'Ayşe Yıldız', dept: 'Satış · Merkez', t: '08:42', ok: true },
  { n: 'Mehmet Kaya', dept: 'Depo · Ataşehir', t: '08:55', ok: true },
  { n: 'Zeynep Demir', dept: 'Muhasebe', t: 'İzinli', ok: false },
  { n: 'Emre Şahin', dept: 'Üretim · Hadımköy', t: '09:03', ok: true },
];

function AreaChart() {
  return (
    <svg viewBox="0 0 320 96" className="h-24 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="mock-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1c1917" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#1c1917" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[24, 48, 72].map((y) => (
        <line key={y} x1="0" y1={y} x2="320" y2={y} stroke="#e7e5e4" strokeWidth="1" />
      ))}
      <path
        d="M0 70 C 30 62, 42 40, 64 44 S 108 64, 128 50 S 172 20, 192 30 S 236 58, 256 40 S 300 14, 320 22"
        fill="none"
        stroke="#1c1917"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M0 70 C 30 62, 42 40, 64 44 S 108 64, 128 50 S 172 20, 192 30 S 236 58, 256 40 S 300 14, 320 22 L320 96 L0 96 Z"
        fill="url(#mock-area)"
      />
      <circle cx="192" cy="30" r="3.5" fill="#1c1917" />
      <circle cx="192" cy="30" r="6" fill="#1c1917" fillOpacity="0.12" />
    </svg>
  );
}

function BrowserMockup() {
  return (
    <div className="overflow-hidden rounded-xl border border-stone-200/80 bg-[#fafaf9] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.45)] ring-1 ring-black/5">
      {/* Chrome */}
      <div className="flex items-center gap-3 border-b border-stone-200 bg-stone-100/80 px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#ec6a5e]" />
          <span className="h-3 w-3 rounded-full bg-[#f4bf50]" />
          <span className="h-3 w-3 rounded-full bg-[#61c454]" />
        </div>
        <div className="mx-auto flex items-center gap-1.5 rounded-lg bg-white px-3 py-1 text-[11px] text-stone-500 shadow-sm ring-1 ring-stone-200/70">
          <Lock className="h-3 w-3 text-emerald-500" />
          panel.qrpersonel.com/dashboard
        </div>
        <div className="h-5 w-5 rounded-full bg-stone-900" />
      </div>

      <div className="flex">
        {/* Sidebar — always visible in marketing mockup */}
        <div className="w-36 shrink-0 border-r border-stone-200 bg-white/60 p-2.5 sm:w-44 sm:p-3">
          <div className="mb-4 flex items-center gap-2 px-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-sky-400 text-white">
              <QrCode className="h-4 w-4" />
            </div>
            <span className="text-[13px] font-semibold tracking-tight text-stone-900">QR Personel</span>
          </div>
          <div className="space-y-0.5">
            {navItems.map((item, i) => (
              <div
                key={item.label}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[11px] font-medium ${
                  i === 0 ? 'bg-stone-900 text-white' : 'text-stone-500'
                }`}
              >
                <item.icon className={`h-3.5 w-3.5 ${i === 0 ? 'text-white' : 'text-stone-400'}`} />
                {item.label}
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-stone-200 bg-white p-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-900 text-[9px] font-semibold text-white">SA</div>
            <div className="min-w-0">
              <div className="truncate text-[10px] font-semibold text-stone-800">Serkan A.</div>
              <div className="truncate text-[9px] text-stone-400">Yönetici</div>
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="flex-1 p-4">
          {/* Topbar */}
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-[15px] font-semibold tracking-tight text-stone-900">Kontrol Paneli</div>
              <div className="text-[10px] text-stone-400">9 Temmuz Çarşamba · Merkez</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-400"><Search className="h-3.5 w-3.5" /></div>
              <div className="relative flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-400">
                <Bell className="h-3.5 w-3.5" />
                <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-fuchsia-500" />
              </div>
              <div className="flex items-center gap-1.5 rounded-lg bg-stone-900 px-2.5 py-[7px] text-[11px] font-medium text-white">
                <Plus className="h-3.5 w-3.5" /> Personel
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-3 grid grid-cols-4 gap-2.5">
            {dashStats.map((s) => (
              <div key={s.k} className="rounded-xl border border-stone-200 bg-white p-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-[9px] text-stone-400">{s.k}</div>
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-1 py-0.5 text-[8px] font-semibold text-emerald-600">
                    <ArrowUpRight className="h-2.5 w-2.5" />{s.d}
                  </span>
                </div>
                <div className="mt-1 text-lg font-bold tracking-tight text-stone-900">{s.v}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-5 gap-2.5">
            {/* Chart */}
            <div className="col-span-3 rounded-xl border border-stone-200 bg-white p-3">
              <div className="mb-1 flex items-center justify-between">
                <div className="text-[11px] font-semibold text-stone-800">Haftalık giriş-çıkış</div>
                <div className="flex items-center gap-1 text-[9px] text-stone-400"><span className="h-1.5 w-1.5 rounded-full bg-stone-900" /> Bu hafta</div>
              </div>
              <AreaChart />
              <div className="mt-1 flex justify-between text-[8px] text-stone-400">
                {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((d) => <span key={d}>{d}</span>)}
              </div>
            </div>

            {/* Roster */}
            <div className="col-span-2 rounded-xl border border-stone-200 bg-white p-3">
              <div className="mb-2 text-[11px] font-semibold text-stone-800">Bugün içeride</div>
              <div className="space-y-2">
                {roster.map((r) => (
                  <div key={r.n} className="flex items-center gap-2">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-stone-200 text-[8px] font-semibold text-stone-600">
                      {r.n.split(' ').map((p) => p[0]).join('')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[9.5px] font-medium text-stone-800">{r.n}</div>
                      <div className="truncate text-[8px] text-stone-400">{r.dept}</div>
                    </div>
                    <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-semibold ${r.ok ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                      {r.t}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const phoneTabs = [QrCode, ListChecks, MessageSquare, Bell];

/** Realistic QR modules — crisp at small sizes */
function MiniQrPattern() {
  const g = [
    '111111100101011111111',
    '100000100110010000001',
    '101110100101011101101',
    '101110100110010101101',
    '101110100101011101101',
    '100000100100010000001',
    '111111101011011111111',
    '000000001110100000000',
    '110101110001011011010',
    '010011001101100110100',
    '101100100011010011011',
    '010110110100101101100',
    '110001011011010110011',
    '000101100001101000101',
    '111111101100011111111',
    '100000100011010000001',
    '101110100110101101101',
    '101110100101100101101',
    '101110100011010101101',
    '100000100101011000001',
    '111111101011011111111',
  ];
  return (
    <svg viewBox="0 0 21 21" className="h-full w-full" aria-hidden shapeRendering="crispEdges">
      {g.map((row, y) =>
        row.split('').map((on, x) =>
          on === '1' ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="#18181b" /> : null,
        ),
      )}
    </svg>
  );
}

function PhoneMockup({ size = 'default' }: { size?: 'default' | 'hero' }) {
  const shell = size === 'hero' ? 'w-[162px] sm:w-[172px] lg:w-[182px]' : 'w-[148px] sm:w-[158px]';

  return (
    <div className={`relative ${shell}`}>
      <div className="pointer-events-none absolute -bottom-2 left-1/2 z-0 h-3 w-[75%] -translate-x-1/2 rounded-[50%] bg-black/30 blur-md" />

      <div className="absolute -left-[2.5px] top-[25%] z-20 h-6 w-[2.5px] rounded-l-sm bg-gradient-to-r from-stone-400 to-stone-600" />
      <div className="absolute -left-[2.5px] top-[35%] z-20 h-9 w-[2.5px] rounded-l-sm bg-gradient-to-r from-stone-400 to-stone-600" />
      <div className="absolute -right-[2.5px] top-[31%] z-20 h-11 w-[2.5px] rounded-r-sm bg-gradient-to-l from-stone-400 to-stone-600" />

      <div className="relative z-10 rounded-[2rem] bg-gradient-to-b from-[#b0aaa4] via-[#52525b] to-[#0a0a0a] p-[2px] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)]">
        <div className="pointer-events-none absolute inset-px rounded-[1.95rem] bg-gradient-to-br from-white/20 to-transparent" />
        <div className="aspect-[9/19.5] overflow-hidden rounded-[1.9rem] bg-stone-800 p-[5px]">
          <div className="relative flex h-full flex-col overflow-hidden rounded-[1.55rem] bg-[#fafaf9]">
            <div className="pointer-events-none absolute inset-0 z-30 bg-gradient-to-br from-white/40 via-transparent to-transparent" />
            <div className="absolute left-1/2 top-1.5 z-40 h-[16px] w-[44px] -translate-x-1/2 rounded-full bg-stone-900" />

            {/* Status */}
            <div className="relative z-10 flex shrink-0 items-center justify-between px-3.5 pb-0.5 pt-2 text-[7px] font-semibold text-stone-900">
              <span>9:41</span>
              <div className="flex items-end gap-px">
                {[2, 3, 4].map((h) => (
                  <span key={h} className="w-px rounded-sm bg-stone-800" style={{ height: h }} />
                ))}
                <span className="ml-1 h-[6px] w-[12px] rounded-[2px] border border-stone-800/80 p-px">
                  <span className="block h-full w-[65%] rounded-[1px] bg-stone-800" />
                </span>
              </div>
            </div>

            <div className="relative z-10 shrink-0 px-3 pb-1.5 pt-0.5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[9px] font-bold text-stone-900">Merhaba, Ayşe</div>
                  <div className="text-[6.5px] text-stone-500">Merkez Şube · Satış</div>
                </div>
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-stone-900 text-[6px] font-bold text-white">AY</div>
              </div>
            </div>

            <div className="relative z-10 mx-2.5 flex min-h-0 flex-1 flex-col rounded-xl bg-white p-2 shadow-sm ring-1 ring-stone-200/80">
              <div className="flex items-center justify-center gap-1 pb-1.5">
                <QrCode className="h-2.5 w-2.5 text-stone-700" />
                <p className="text-[7px] font-semibold text-stone-800">Giriş için okutun</p>
              </div>

              <div className="relative mx-auto w-full flex-1 rounded-lg bg-stone-50 p-1.5 ring-1 ring-stone-100">
                <div className="relative aspect-square w-full">
                  <MiniQrPattern />
                  <div className="pointer-events-none absolute inset-x-1 top-0 h-px animate-[scan_2.8s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-emerald-500/70 to-transparent" />
                </div>
              </div>

              <div className="mt-1.5 flex justify-center">
                <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-px text-[6px] font-medium text-emerald-700 ring-1 ring-emerald-200/80">
                  <MapPin className="h-1.5 w-1.5" /> Konum doğrulandı
                </span>
              </div>
            </div>

            <div className="relative z-10 shrink-0 grid grid-cols-2 gap-1 px-2.5 py-1.5">
              {[['08:42', 'Bugün giriş'], ['%96', 'Devam']].map(([v, k]) => (
                <div key={k} className="rounded-md bg-white px-1.5 py-1 shadow-sm ring-1 ring-stone-200/70">
                  <div className="text-[9px] font-bold leading-none text-stone-900">{v}</div>
                  <div className="mt-px text-[5.5px] text-stone-500">{k}</div>
                </div>
              ))}
            </div>

            <div className="relative z-10 shrink-0 border-t border-stone-200/80 bg-white px-2.5 pb-1 pt-1">
              <div className="flex justify-around">
                {phoneTabs.map((Icon, i) => (
                  <div key={i} className={`flex h-4 w-4 items-center justify-center rounded-md ${i === 0 ? 'bg-stone-900 text-white' : 'text-stone-400'}`}>
                    <Icon className="h-2 w-2" />
                  </div>
                ))}
              </div>
              <div className="mx-auto mt-1 h-[2.5px] w-10 rounded-full bg-stone-200" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PhoneShell({
  children,
  size = 'default',
  tabs,
  activeTab = 0,
  header,
}: {
  children: ReactNode;
  size?: 'default' | 'hero' | 'compact';
  tabs?: readonly LucideIcon[];
  activeTab?: number;
  header?: React.ReactNode;
}) {
  const shell =
    size === 'hero'
      ? 'w-[162px] sm:w-[172px] lg:w-[182px]'
      : size === 'compact'
        ? 'w-[130px] sm:w-[148px]'
        : 'w-[148px] sm:w-[158px]';

  return (
    <div className={`relative ${shell}`}>
      <div className="pointer-events-none absolute -bottom-2 left-1/2 z-0 h-3 w-[75%] -translate-x-1/2 rounded-[50%] bg-black/30 blur-md" />
      <div className="absolute -left-[2.5px] top-[25%] z-20 h-6 w-[2.5px] rounded-l-sm bg-gradient-to-r from-stone-400 to-stone-600" />
      <div className="absolute -left-[2.5px] top-[35%] z-20 h-9 w-[2.5px] rounded-l-sm bg-gradient-to-r from-stone-400 to-stone-600" />
      <div className="absolute -right-[2.5px] top-[31%] z-20 h-11 w-[2.5px] rounded-r-sm bg-gradient-to-l from-stone-400 to-stone-600" />
      <div className="relative z-10 rounded-[2rem] bg-gradient-to-b from-[#b0aaa4] via-[#52525b] to-[#0a0a0a] p-[2px] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)]">
        <div className="pointer-events-none absolute inset-px rounded-[1.95rem] bg-gradient-to-br from-white/20 to-transparent" />
        <div className="aspect-[9/19.5] overflow-hidden rounded-[1.9rem] bg-stone-800 p-[5px]">
          <div className="relative flex h-full flex-col overflow-hidden rounded-[1.55rem] bg-[#fafaf9]">
            <div className="pointer-events-none absolute inset-0 z-30 bg-gradient-to-br from-white/40 via-transparent to-transparent" />
            <div className="absolute left-1/2 top-1.5 z-40 h-[16px] w-[44px] -translate-x-1/2 rounded-full bg-stone-900" />
            <div className="relative z-10 flex shrink-0 items-center justify-between px-3.5 pb-0.5 pt-2 text-[7px] font-semibold text-stone-900">
              <span>9:41</span>
              <div className="flex items-end gap-px">
                {[2, 3, 4].map((h) => (
                  <span key={h} className="w-px rounded-sm bg-stone-800" style={{ height: h }} />
                ))}
                <span className="ml-1 h-[6px] w-[12px] rounded-[2px] border border-stone-800/80 p-px">
                  <span className="block h-full w-[65%] rounded-[1px] bg-stone-800" />
                </span>
              </div>
            </div>
            {header}
            <div className="relative z-10 min-h-0 flex-1 overflow-hidden">{children}</div>
            {tabs && (
              <div className="relative z-10 shrink-0 border-t border-stone-200/80 bg-white px-2.5 pb-1 pt-1">
                <div className="flex justify-around">
                  {tabs.map((Icon, i) => (
                    <div
                      key={i}
                      className={`flex h-4 w-4 items-center justify-center rounded-md ${i === activeTab ? 'bg-stone-900 text-white' : 'text-stone-400'}`}
                    >
                      <Icon className="h-2 w-2" />
                    </div>
                  ))}
                </div>
                <div className="mx-auto mt-1 h-[2.5px] w-10 rounded-full bg-stone-200" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const managerTabs = [LayoutDashboard, ListChecks, MessageSquare, Bell] as const;

function PhoneSurveyFillMockup() {
  return (
    <PhoneShell
      size="compact"
      tabs={phoneTabs}
      activeTab={1}
      header={
        <div className="relative z-10 shrink-0 border-b border-stone-200/80 px-3 py-1.5">
          <div className="text-[8px] font-bold text-stone-900">Memnuniyet Anketi</div>
          <div className="text-[6px] text-stone-500">Soru 1 / 3 · Zorunlu</div>
        </div>
      }
    >
      <div className="h-full overflow-hidden px-2.5 py-2">
        <p className="text-[7px] font-semibold leading-snug text-stone-800">İş ortamından memnun musunuz?</p>
        <div className="mt-2 space-y-1">
          {[
            { label: 'Çok memnun', on: true },
            { label: 'Memnun', on: false },
            { label: 'Kararsız', on: false },
          ].map((o) => (
            <div
              key={o.label}
              className={cn(
                'flex items-center gap-1.5 rounded-lg border px-2 py-1.5',
                o.on ? 'border-violet-400 bg-violet-50 ring-1 ring-violet-300/60' : 'border-stone-200 bg-white',
              )}
            >
              <div className={cn('h-2 w-2 shrink-0 rounded-full border', o.on ? 'border-violet-600 bg-violet-600' : 'border-stone-300')} />
              <span className="text-[6.5px] font-medium text-stone-700">{o.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 rounded-lg bg-stone-900 px-2 py-1.5 text-center text-[6.5px] font-semibold text-white">Gönder</div>
      </div>
    </PhoneShell>
  );
}

function PhoneSurveyAdminMockup() {
  return (
    <PhoneShell
      size="compact"
      tabs={managerTabs}
      activeTab={1}
      header={
        <div className="relative z-10 flex shrink-0 items-center justify-between border-b border-stone-200/80 px-3 py-1.5">
          <div>
            <div className="text-[8px] font-bold text-stone-900">Anketler</div>
            <div className="text-[6px] text-stone-500">Yönetim · Merkez</div>
          </div>
          <div className="rounded-md bg-violet-600 px-1.5 py-0.5 text-[6px] font-bold text-white">+ Yeni</div>
        </div>
      }
    >
      <div className="h-full space-y-1.5 overflow-hidden p-2">
        {[
          { title: 'Memnuniyet 2026', pct: 78, active: true },
          { title: 'Eğitim geri bildirimi', pct: 45, active: false },
        ].map((s) => (
          <div
            key={s.title}
            className={cn(
              'rounded-lg border p-2',
              s.active ? 'border-violet-300 bg-violet-50/80' : 'border-stone-200 bg-white',
            )}
          >
            <div className="text-[6.5px] font-semibold text-stone-800">{s.title}</div>
            <div className="mt-1 flex items-center gap-1">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-stone-200">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" style={{ width: `${s.pct}%` }} />
              </div>
              <span className="text-[6px] font-bold text-violet-700">%{s.pct}</span>
            </div>
          </div>
        ))}
      </div>
    </PhoneShell>
  );
}

function PhoneMessagesMockup() {
  return (
    <PhoneShell
      size="compact"
      tabs={phoneTabs}
      activeTab={2}
      header={
        <div className="relative z-10 shrink-0 border-b border-stone-200/80 px-3 py-1.5">
          <div className="flex items-center gap-1">
            <Users className="h-2.5 w-2.5 text-indigo-600" />
            <div className="text-[8px] font-bold text-stone-900">Merkez Şube Ekibi</div>
          </div>
          <div className="text-[6px] text-stone-500">5 üye · 3 yeni mesaj</div>
        </div>
      }
    >
      <div className="flex h-full flex-col justify-end gap-1 overflow-hidden p-2 pb-1">
        <div className="max-w-[88%] rounded-lg bg-white px-2 py-1.5 shadow-sm ring-1 ring-stone-200/80">
          <div className="text-[5.5px] font-semibold text-stone-400">İK · Ayşe</div>
          <div className="text-[6.5px] text-stone-800">Yarınki toplantı 10:00</div>
        </div>
        <div className="ml-auto max-w-[88%] rounded-lg bg-stone-900 px-2 py-1.5">
          <div className="text-[6.5px] text-white">Anketleri bugün doldurun</div>
        </div>
        <div className="max-w-[88%] rounded-lg bg-white px-2 py-1.5 shadow-sm ring-1 ring-stone-200/80">
          <div className="text-[5.5px] font-semibold text-stone-400">Mehmet K.</div>
          <div className="text-[6.5px] text-stone-800">Tamam, doldurdum ✓</div>
        </div>
        <div className="mt-1 flex items-center gap-1 rounded-full border border-stone-200 bg-white px-2 py-1">
          <div className="h-1 flex-1 rounded-full bg-stone-100" />
          <div className="flex h-3 w-3 items-center justify-center rounded-full bg-indigo-600">
            <ArrowRight className="h-2 w-2 text-white" />
          </div>
        </div>
      </div>
    </PhoneShell>
  );
}

function PhoneMessagesInboxMockup() {
  return (
    <PhoneShell
      size="compact"
      tabs={managerTabs}
      activeTab={2}
      header={
        <div className="relative z-10 flex shrink-0 items-center justify-between border-b border-stone-200/80 px-3 py-1.5">
          <div className="text-[8px] font-bold text-stone-900">Mesajlar</div>
          <div className="flex gap-0.5">
            <div className="rounded bg-indigo-600 px-1 py-0.5 text-[5px] font-bold text-white">DM</div>
            <div className="rounded border border-stone-300 px-1 py-0.5 text-[5px] font-semibold text-stone-600">Grup</div>
          </div>
        </div>
      }
    >
      <div className="h-full space-y-1 overflow-hidden p-2">
        {[
          { name: 'Merkez Şube Ekibi', preview: 'Anketleri bugün...', unread: 3, group: true },
          { name: 'Mehmet Kaya', preview: 'İzin talebim onaylandı', unread: 0, group: false },
          { name: 'Ayşe Yıldız', preview: 'Teşekkürler', unread: 1, group: false },
        ].map((c) => (
          <div key={c.name} className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white p-1.5">
            <div className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[5px] font-bold text-white', c.group ? 'bg-indigo-600' : 'bg-stone-700')}>
              {c.group ? <Users className="h-2.5 w-2.5" /> : c.name[0]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[6.5px] font-semibold text-stone-800">{c.name}</div>
              <div className="truncate text-[5.5px] text-stone-400">{c.preview}</div>
            </div>
            {c.unread > 0 && (
              <span className="flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-indigo-600 px-0.5 text-[5px] font-bold text-white">
                {c.unread}
              </span>
            )}
          </div>
        ))}
      </div>
    </PhoneShell>
  );
}

function DualPhoneMockups({
  left,
  right,
  leftLabel,
  rightLabel,
}: {
  left: ReactNode;
  right: ReactNode;
  leftLabel: string;
  rightLabel: string;
}) {
  return (
    <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6">
      <div className="flex flex-col items-center gap-2">
        <div className="animate-float [animation-duration:5s]">{left}</div>
        <span className="rounded-full bg-violet-100 px-3 py-1 text-[11px] font-semibold text-violet-800 dark:bg-violet-950/50 dark:text-violet-300">
          {leftLabel}
        </span>
      </div>
      <div className="hidden text-2xl text-muted-foreground sm:block">+</div>
      <div className="flex flex-col items-center gap-2">
        <div className="animate-float [animation-duration:5.5s] [animation-delay:0.4s]">{right}</div>
        <span className="rounded-full bg-indigo-100 px-3 py-1 text-[11px] font-semibold text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300">
          {rightLabel}
        </span>
      </div>
    </div>
  );
}

function PhoneJobApplyMockup() {
  return (
    <PhoneShell
      size="compact"
      header={
        <div className="relative z-10 shrink-0 border-b border-stone-200/80 px-3 py-1.5">
          <div className="text-[8px] font-bold text-stone-900">Satış Temsilcisi</div>
          <div className="text-[6px] text-stone-500">ABC Şirketi · Başvuru</div>
        </div>
      }
    >
      <div className="space-y-1.5 overflow-hidden p-2">
        {['Ad *', 'Telefon *', 'Deneyim (yıl)'].map((l) => (
          <div key={l} className="rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-[6.5px] text-stone-400">{l}</div>
        ))}
        <div className="rounded-lg border border-dashed border-emerald-400 bg-emerald-50/80 px-2 py-2 text-center text-[6px] font-semibold text-emerald-700">
          CV Yükle (PDF)
        </div>
        <div className="rounded-lg bg-stone-900 py-1.5 text-center text-[6.5px] font-semibold text-white">Başvur</div>
      </div>
    </PhoneShell>
  );
}

function PhoneRecruitmentAdminMockup() {
  return (
    <PhoneShell
      size="compact"
      tabs={managerTabs}
      activeTab={0}
      header={
        <div className="relative z-10 shrink-0 border-b border-stone-200/80 px-3 py-1.5">
          <div className="text-[8px] font-bold text-stone-900">Adaylar · Kanban</div>
          <div className="text-[6px] text-stone-500">12 başvuru</div>
        </div>
      }
    >
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex flex-1 gap-1 p-1.5">
          {[
            { col: 'Yeni', names: ['Ali K.'] },
            { col: 'Mülakat', names: ['Zeynep Y.', 'Can D.'] },
          ].map((c) => (
            <div key={c.col} className="min-w-0 flex-1 rounded-lg bg-stone-100/80 p-1">
              <div className="mb-1 text-[5.5px] font-bold text-stone-600">{c.col}</div>
              {c.names.map((n) => (
                <div key={n} className="mb-1 rounded border border-stone-200 bg-white p-1 text-[5.5px] font-medium text-stone-800">{n}</div>
              ))}
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-1 border-t border-stone-200 px-2 py-1">
          <div className="rounded bg-emerald-600 px-1.5 py-0.5 text-[5px] font-bold text-white">Excel</div>
          <div className="rounded border border-stone-300 px-1.5 py-0.5 text-[5px] font-semibold text-stone-600">PDF CV</div>
        </div>
      </div>
    </PhoneShell>
  );
}

function RecruitmentSpotlight() {
  return (
    <div className={cn('overflow-hidden rounded-3xl border p-6 sm:p-8', marketingAccents[3].card)}>
      <div className="mb-4 flex items-center gap-3">
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl', marketingAccents[3].icon)}>
          <Briefcase className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-300">İK · Kariyer</p>
          <h3 className="text-xl font-bold text-foreground">Özel başvuru formları & işe alım</h3>
        </div>
      </div>
      <p className="text-muted-foreground">
        Kendi form şablonlarınızı oluşturun, <strong className="text-foreground">public kariyer sayfanızı</strong> paylaşın.
        Başvuruları <strong className="text-foreground">toplu Excel</strong> veya <strong className="text-foreground">bireysel PDF CV</strong> olarak indirin — kanban ile mülakattan işe alıma kadar takip edin.
      </p>
      <ul className="mt-5 space-y-2">
        {['Sürükle-bırak form şablonu editörü', 'CV yükleme + otomatik PDF özgeçmiş', 'WhatsApp ile aday durum bildirimi', 'Tek tıkla adayı personele dönüştürme'].map((t) => (
          <li key={t} className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />{t}
          </li>
        ))}
      </ul>
      <DualPhoneMockups
        left={<PhoneJobApplyMockup />}
        right={<PhoneRecruitmentAdminMockup />}
        leftLabel="Aday · başvuru formu"
        rightLabel="İK · kanban & export"
      />
    </div>
  );
}

/** İletişim & anket spotlight — conversion hook */
function CommunicationSpotlight() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className={cn('overflow-hidden rounded-3xl border p-6 sm:p-8', marketingAccents[0].card)}>
        <div className="mb-4 flex items-center gap-3">
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl', marketingAccents[0].icon)}>
            <ListChecks className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-300">Yeni</p>
            <h3 className="text-xl font-bold text-foreground">Hedefli personel anketleri</h3>
          </div>
        </div>
        <p className="text-muted-foreground">
          Memnuniyet ölçümü, eğitim geri bildirimi, saha anketi — tüm personel, departman veya seçili ekip.
          Personel uygulamadan doldurur; siz <strong className="text-foreground">web veya mobil panelden</strong> tamamlanma oranını ve cevap dağılımını anında görürsünüz.
        </p>
        <ul className="mt-5 space-y-2">
          {['Çoktan seçmeli + kısa metin soruları', 'Departman / kişi bazlı hedefleme', 'Tek seferlik cevap — manipülasyon yok', 'Push bildirimi ile anında ulaşım'].map((t) => (
            <li key={t} className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />{t}
            </li>
          ))}
        </ul>
        <DualPhoneMockups
          left={<PhoneSurveyFillMockup />}
          right={<PhoneSurveyAdminMockup />}
          leftLabel="Personel · anket doldurur"
          rightLabel="Yönetici · mobil panel"
        />
      </div>

      <div className={cn('overflow-hidden rounded-3xl border p-6 sm:p-8', marketingAccents[2].card)}>
        <div className="mb-4 flex items-center gap-3">
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl', marketingAccents[2].icon)}>
            <MessageSquare className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">Güvenli kanal</p>
            <h3 className="text-xl font-bold text-foreground">Mesaj & grup sohbeti</h3>
          </div>
        </div>
        <p className="text-muted-foreground">
          WhatsApp gruplarına, kayıt dışı mesajlara son. Yönetici–personel <strong className="text-foreground">1:1 mesaj</strong>,
          şube ve bölge ekipleri için <strong className="text-foreground">grup sohbetleri</strong> — web ve mobilde senkron.
        </p>
        <ul className="mt-5 space-y-2">
          {['Bölge/şube müdürü kendi ekibine mesaj', 'Personel arası mesaj kapalı — güvenli', 'Push ile anlık bildirim', 'Konuşma geçmişi kayıt altında'].map((t) => (
            <li key={t} className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />{t}
            </li>
          ))}
        </ul>
        <DualPhoneMockups
          left={<PhoneMessagesInboxMockup />}
          right={<PhoneMessagesMockup />}
          leftLabel="Gelen kutusu"
          rightLabel="Grup sohbeti"
        />
      </div>
    </div>
  );
}

function StickyCtaBar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 px-4 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] backdrop-blur-md sm:hidden">
      <div className="mx-auto flex max-w-lg items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">15 dk’da başlayın</p>
          <p className="truncate text-xs text-muted-foreground">Kredi kartı gerekmez</p>
        </div>
        <Link to="/register" className="shrink-0">
          <Button size="sm" className="cta-gradient border-0 text-white">Ücretsiz Başla</Button>
        </Link>
      </div>
    </div>
  );
}

function ModuleShowcase() {
  const [active, setActive] = useState(0);
  const mod = featureModules[active];
  const accent = marketingAccents[active % marketingAccents.length];

  return (
    <section id="moduller" className="scroll-mt-20 border-b border-border bg-gradient-to-b from-muted/50 to-background px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-violet-50 px-4 py-1.5 text-sm font-semibold text-violet-700 dark:border-violet-500/30 dark:bg-violet-950/40 dark:text-violet-300">
            <Target className="h-4 w-4" />
            Tam platform — parça parça yazılım almayın
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
            Müşterinizin kullandığı <span className="text-gradient">tüm modüller</span> dahil
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Devam takibinden anket ve mesajlaşmaya, işe alımdan bordroya — ayrı ayrı araç satın almak yerine
            tek abonelikle hepsini kullanın.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {featureModules.map((m, i) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-semibold transition-all',
                active === i
                  ? 'cta-gradient text-white shadow-md'
                  : 'border border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground',
                'highlight' in m && m.highlight && active !== i && 'ring-1 ring-violet-300/50 dark:ring-violet-500/30',
              )}
            >
              {m.label}
              {'highlight' in m && m.highlight && <span className="ml-1.5 text-[10px] opacity-80">★</span>}
            </button>
          ))}
        </div>

        <div className={cn('mt-8 rounded-3xl border p-6 sm:p-10', accent.card)}>
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-2xl font-bold text-foreground">{mod.label}</h3>
              <p className="text-muted-foreground">{mod.tagline}</p>
            </div>
            <Link to="/register">
              <Button className="cta-gradient btn-shine w-full border-0 text-white sm:w-auto">
                Hemen dene <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {mod.items.map(({ icon: Icon, title, hook }) => (
              <div key={title} className="flex gap-3 rounded-2xl border border-border/60 bg-card/80 p-4 backdrop-blur">
                <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', accent.icon)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{hook}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 space-y-6">
          <CommunicationSpotlight />
          <RecruitmentSpotlight />
        </div>
      </div>
    </section>
  );
}

function PainVsGainSection() {
  return (
    <section className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-gradient">Neden şimdi?</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Eski yöntem vs QR Personel</h2>
          <p className="mt-3 text-muted-foreground">Her gün ertelediğiniz maliyet, kayıp verim ve İK yükü</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {painVsGain.map(({ pain, gain }, i) => {
            const accent = marketingAccents[i % marketingAccents.length];
            return (
              <div key={pain} className={cn('rounded-2xl border p-5', accent.card)}>
                <div className="flex items-start gap-2 text-sm text-red-600/90 dark:text-red-400">
                  <X className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="line-through decoration-red-400/50">{pain}</span>
                </div>
                <div className="mt-3 flex items-start gap-2 text-sm font-semibold text-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  {gain}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 to-card p-8 text-center dark:border-emerald-500/30 dark:from-emerald-950/30">
          <CircleDollarSign className="h-10 w-10 text-emerald-600" />
          <p className="max-w-xl text-lg font-semibold text-foreground">
            Turnike + ayrı anket aracı + WhatsApp yönetimi = ayda binlerce lira ve saatlerce kayıp zaman.
          </p>
          <p className="text-muted-foreground">QR Personel ile hepsi tek fiyat — 15 dakikada kurulur.</p>
          <Link to="/register">
            <Button size="lg" className="cta-gradient btn-shine border-0 text-white">
              Ücretsiz başla — risk yok
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

/** Browser + phone composed for hero */
function HeroMockupStack() {
  return (
    <div className="relative mx-auto w-full max-w-[340px] overflow-visible pl-[14%] sm:max-w-[400px] md:mx-0 md:max-w-[540px] md:pl-0">
      <BrowserMockup />
      <div className="pointer-events-none absolute -bottom-1 left-0 z-20 md:-bottom-2">
        <div className="-translate-x-[34%] rotate-[-4deg] md:-translate-x-[36%]">
          <div className="animate-float drop-shadow-[0_24px_36px_rgba(0,0,0,0.5)] [animation-duration:5.5s]">
            <PhoneMockup size="hero" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <MarketingHeader />

      {/* Hero */}
      <section className="relative overflow-visible bg-stone-950 px-4 py-16 text-white sm:px-6 sm:py-20 lg:py-28">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <img
            src="/marketing/hero-bg.png"
            alt=""
            className="h-full w-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-stone-950/40 via-stone-950/70 to-stone-950" />
          <div className="absolute inset-0 bg-dots opacity-40" />
        </div>

        <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-5 overflow-visible md:grid-cols-2 md:items-center md:gap-14">
          {/* Badge */}
          <p className="order-1 md:col-start-1 md:row-start-1 inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-medium leading-snug text-stone-200 backdrop-blur sm:text-sm">
            <Flame className="h-3.5 w-3.5 shrink-0 text-orange-300 sm:h-4 sm:w-4" />
            Devam + bordro + anket + mesajlaşma — 20+ modül, tek abonelik
          </p>

          {/* Headline */}
          <h1 className="order-2 md:col-start-1 md:row-start-2 text-balance text-[2.125rem] font-bold leading-[1.06] tracking-tight sm:text-4xl lg:text-5xl xl:text-[3.5rem]">
            İK’nın ihtiyacı olan{' '}
            <span className="text-gradient">her şey</span>
            {' '}tek platformda
          </h1>

          {/* Mockups — mobile: between headline & description */}
          <div className="order-3 flex justify-center overflow-visible py-1 md:col-start-2 md:row-start-1 md:row-span-5 md:justify-end md:py-0 animate-fade-in-up [animation-delay:120ms]">
            <HeroMockupStack />
          </div>

          {/* Description */}
          <p className="order-4 md:col-start-1 md:row-start-3 max-w-xl text-base leading-relaxed text-stone-300 sm:text-lg">
            QR giriş, puantaj, izin, bordro, <strong className="text-white">hedefli anketler</strong>,{' '}
            <strong className="text-white">yönetici–personel mesajlaşması</strong> ve grup sohbetleri.
            Excel tablolarına ve WhatsApp kaosuna veda — <strong className="text-white">web ve mobilde tam yönetim</strong>, personel de aynı uygulamada.
          </p>

          {/* CTAs */}
          <div className="order-5 md:col-start-1 md:row-start-4 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-3">
            <Link to="/register" className="w-full sm:w-auto">
              <Button size="lg" className="cta-gradient btn-shine w-full border-0 text-white sm:w-auto">
                Ücretsiz Başla
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/bayi-basvuru" className="w-full sm:w-auto">
              <Button size="lg" variant="secondary" className="w-full border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white/20 sm:w-auto">
                Bayi Ol, Kazan
              </Button>
            </Link>
          </div>

          {/* Trust */}
          <p className="order-6 md:col-start-1 md:row-start-5 flex flex-col gap-1.5 text-xs text-stone-400 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-1 sm:text-sm">
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 sm:h-4 sm:w-4" /> Kredi kartı gerekmez</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 sm:h-4 sm:w-4" /> ~15 dakika kurulum</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 sm:h-4 sm:w-4" /> İstediğiniz zaman iptal</span>
          </p>
        </div>

        {/* Stat strip */}
        <div className="relative mx-auto mt-16 grid max-w-5xl grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center backdrop-blur">
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="mt-1 text-sm text-stone-400">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust marquee */}
      <section className="border-b border-border bg-card py-6">
        <div className="mx-auto max-w-6xl overflow-hidden px-6">
          <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Restoranlardan mağaza zincirlerine, ofislerden sahalara
          </p>
          <div className="flex items-center justify-center gap-x-8 gap-y-3 text-sm font-medium text-muted-foreground flex-wrap">
            {['Perakende', 'Restoran & Kafe', 'Üretim', 'Lojistik', 'Sağlık', 'Güvenlik', 'Eğitim', 'Hizmet'].map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-primary/40" />{s}</span>
            ))}
          </div>
        </div>
      </section>

      <ModuleShowcase />

      {/* Features grid — hızlı özet */}
      <section id="ozellikler" className="scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-gradient">Öne çıkanlar</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
              En çok tercih edilen özellikler
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Yukarıdaki 20+ modülün özeti — hepsi tek abonelikte, ek ücret yok.
            </p>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:mt-14 sm:gap-5 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description }, i) => {
              const accent = marketingAccents[i % marketingAccents.length];
              return (
                <div
                  key={title}
                  className={cn(
                    'group rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover sm:p-6',
                    accent.card,
                  )}
                >
                  <div
                    className={cn(
                      'mb-3 flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 sm:mb-4 sm:h-11 sm:w-11',
                      accent.icon,
                    )}
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <h3 className="text-sm font-semibold leading-snug text-foreground sm:text-base">{title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground sm:mt-2 sm:text-sm">{description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <PainVsGainSection />

      {/* How it works — with real photo */}
      <section id="nasil-calisir" className="scroll-mt-20 border-y border-border bg-muted/40 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-gradient">Nasıl çalışır</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground">4 adımda canlıya alın</h2>
              <p className="mt-4 text-muted-foreground">
                Teknik bilgi gerekmez. Kayıt olduktan sonra sihirbaz adımlarıyla şubenizi ve personelinizi
                dakikalar içinde sisteme taşıyın.
              </p>
              <ol className="mt-8 grid grid-cols-2 gap-3 sm:gap-4">
                {steps.map((step, i) => {
                  const accent = marketingAccents[i % marketingAccents.length];
                  return (
                    <li
                      key={step.title}
                      className={cn(
                        'flex flex-col gap-2.5 rounded-2xl border p-4 shadow-card sm:flex-row sm:gap-4 sm:p-5',
                        accent.card,
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold sm:h-9 sm:w-9 sm:text-sm',
                          accent.badge,
                        )}
                      >
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold leading-snug text-foreground sm:text-base">{step.title}</h3>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">{step.description}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
            <div className="space-y-4">
              <div className="overflow-hidden rounded-3xl border border-border shadow-elevated">
                <img src="/marketing/scan.png" alt="Personel şube QR kodunu okutuyor" className="h-full w-full object-cover" />
              </div>
              <div className={cn('flex items-center gap-3 rounded-2xl border p-4', marketingAccents[1].card)}>
                <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', marketingAccents[1].icon)}>
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Tek uygulama — iki deneyim</p>
                  <p className="text-sm text-muted-foreground">
                    Personel: QR, izin, görev, anket. Yönetici: mobilde “Yönetim” hub’ı ile bordro, personel, anket ve mesaj — web ile aynı özellikler.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product showcase */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-gradient">Ürün</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground lg:text-4xl">Web + mobil — tam parite</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Yöneticiler masaüstü panelden veya telefondan yönetir; personel sahadan QR okutur.
              Anket, mesaj, bordro, rapor — <strong className="text-foreground">web’de ne varsa mobilde de var.</strong>
            </p>
          </div>
          <div className="mt-14 grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-3xl border border-violet-200/60 bg-gradient-to-br from-violet-50/50 via-muted/40 to-card p-6 shadow-card dark:border-violet-500/25 dark:from-violet-950/30 sm:p-10">
              <BrowserMockup />
            </div>
            <div className="space-y-4">
              {[
                { icon: BarChart3, t: 'Canlı dashboard', d: 'Anlık giriş/çıkış, kim içeride, bekleyen onaylar ve şube karşılaştırması.' },
                { icon: FileSpreadsheet, t: 'Excel & PDF', d: 'Puantaj, bordro ve raporları tek tıkla dışa aktarın.' },
                { icon: Shield, t: 'Rol bazlı erişim', d: 'Herkes yalnızca yetkili olduğu veriyi görür. Şube bazlı izolasyon.' },
              ].map(({ icon: Icon, t, d }, i) => {
                const accent = marketingAccents[i];
                return (
                  <div key={t} className={cn('flex gap-4 rounded-2xl border p-4', accent.card)}>
                    <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl', accent.icon)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{t}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{d}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Audiences */}
      <section className="border-y border-border bg-muted/40 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Kimler için?</h2>
            <p className="mt-3 text-lg text-muted-foreground">Farklı ihtiyaçlara, aynı güçlü altyapı</p>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-6 md:grid-cols-3">
            {audiences.map(({ icon: Icon, title, points }, i) => {
              const accent = marketingAccents[i * 2 % marketingAccents.length];
              return (
                <div
                  key={title}
                  className={cn(
                    'rounded-2xl border p-4 shadow-card sm:p-6',
                    accent.card,
                    i === 2 && 'col-span-2 md:col-span-1',
                  )}
                >
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl sm:h-12 sm:w-12', accent.icon)}>
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <h3 className="mt-3 text-sm font-semibold leading-snug text-foreground sm:mt-4 sm:text-base">{title}</h3>
                  <ul className="mt-3 space-y-1.5 sm:mt-4 sm:space-y-2">
                    {points.map((p) => (
                      <li key={p} className="flex items-start gap-1.5 text-xs text-muted-foreground sm:gap-2 sm:text-sm">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500 sm:h-4 sm:w-4" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Reseller / earn money */}
      <section id="bayi" className="relative scroll-mt-20 overflow-hidden bg-stone-950 px-4 py-20 text-white sm:px-6">
        <div className="pointer-events-none absolute inset-0 bg-aurora opacity-40" />
        <div className="relative mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm font-medium text-fuchsia-200 backdrop-blur">
                <HandCoins className="h-4 w-4" />
                Gelir fırsatı
              </p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight lg:text-4xl">
                Bu sistemle para kazanın — <span className="text-gradient">bayi olun</span>
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-stone-300">
                Bilgisayar ve mobil cihaz kullanan, pazarlama veya satış yapabilen herkes bayi olabilir.
                Müşterilerinize QR Personel’i satın — her aktif abonelikten{' '}
                <strong className="text-white">aylık komisyon</strong> kazanın.
                Tek seferlik satış değil, <strong className="text-white">tekrarlayan gelir</strong>.
              </p>
              <div className="mt-6 overflow-hidden rounded-3xl border border-white/10">
                <img src="/marketing/reseller.png" alt="Bayi olarak gelir elde eden bir girişimci" className="h-56 w-full object-cover" />
              </div>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/bayi-basvuru">
                  <Button size="lg" className="cta-gradient btn-shine border-0 text-white">
                    Bayi Başvurusu Yap
                    <TrendingUp className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="secondary" className="border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white/20">
                    Bayi Girişi
                  </Button>
                </Link>
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur lg:p-8">
              <div className="mb-6 flex items-center gap-3">
                <BadgePercent className="h-8 w-8 text-fuchsia-300" />
                <h3 className="text-xl font-semibold">Bayi avantajları</h3>
              </div>
              <ul className="space-y-4">
                {resellerBenefits.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-sm text-stone-200">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                    {b}
                  </li>
                ))}
              </ul>
              <div className="mt-8 grid grid-cols-3 gap-3 text-center">
                {[['20', 'müşteri'], ['×', 'aylık abonelik'], ['%', 'komisyon']].map(([v, k]) => (
                  <div key={k} className="rounded-2xl bg-white/5 p-4">
                    <p className="text-2xl font-bold text-white">{v}</p>
                    <p className="mt-1 text-[11px] text-stone-400">{k}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 rounded-xl bg-white/5 p-4 text-sm text-stone-300">
                <strong className="text-white">Sonuç:</strong> müşteri sayısı arttıkça geliriniz her ay büyür.
                Düzenli, pasif ve ölçeklenebilir.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="fiyat" className="scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">Fiyatlandırma</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Şeffaf ve ölçeklenebilir</h2>
            <p className="mt-3 text-muted-foreground">Gizli ücret yok. Personel sayısına göre büyüyen paketler.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { name: 'Başlangıç', price: '299', desc: 'Küçük ekipler için', features: ['50 personele kadar', '1 şube', 'QR & puantaj', 'Anket & mesajlaşma', 'Web + mobil (tam)'] },
              { name: 'Profesyonel', price: '599', desc: 'Büyüyen işletmeler', features: ['200 personele kadar', '5 şube', 'Bordro & raporlar', 'Grup sohbeti & hedefli duyuru', 'Tüm 20+ modül'], highlight: true },
              { name: 'Kurumsal', price: 'Özel', desc: 'Çok şubeli yapılar', features: ['Sınırsız personel', 'Sınırsız şube', 'Özel SLA & eğitim', 'Bayi & entegrasyon', 'Denetim kaydı & KVKK'] },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-3xl border p-6 ${
                  plan.highlight
                    ? 'border-primary/30 bg-card shadow-elevated ring-1 ring-primary/20'
                    : 'border-border bg-card shadow-card'
                }`}
              >
                {plan.highlight && (
                  <span className="cta-gradient absolute -top-3 left-6 inline-block rounded-full px-3 py-1 text-xs font-semibold text-white">
                    En popüler
                  </span>
                )}
                <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.desc}</p>
                <p className="mt-4">
                  <span className="text-4xl font-bold tracking-tight text-foreground">
                    {plan.price === 'Özel' ? plan.price : `₺${plan.price}`}
                  </span>
                  {plan.price !== 'Özel' && <span className="text-muted-foreground">/ay</span>}
                </p>
                <ul className="mt-6 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="mt-6 block">
                  <Button
                    className={`w-full ${plan.highlight ? 'cta-gradient btn-shine border-0 text-white' : ''}`}
                    variant={plan.highlight ? 'primary' : 'secondary'}
                  >
                    {plan.price === 'Özel' ? 'İletişime geç' : 'Ücretsiz dene'}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="border-y border-border bg-muted/40 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 flex justify-center gap-1 text-amber-400">
            {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-5 w-5 fill-current" />)}
          </div>
          <p className="text-balance text-xl font-medium leading-relaxed text-foreground sm:text-2xl">
            “Turnike ve kart sisteminden kurtulduk. 3 şubemizin puantajı artık dakikalar içinde hazır,
            bordroyu Excel’e aktarıp muhasebeye gönderiyoruz.”
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">MK</div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">Mehmet K.</p>
              <p className="text-xs text-muted-foreground">Operasyon Müdürü · Perakende zinciri</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold tracking-tight text-foreground">Sık sorulan sorular</h2>
          <div className="mt-10 space-y-3">
            {faqs.map((faq) => (
              <details key={faq.q} className="group rounded-2xl border border-border bg-card p-5 open:shadow-card">
                <summary className="flex cursor-pointer items-center justify-between gap-4 font-semibold text-foreground marker:content-none">
                  {faq.q}
                  <span className="text-xl text-muted-foreground transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden bg-stone-950 px-4 py-20 text-white sm:px-6">
        <div className="pointer-events-none absolute inset-0 bg-aurora opacity-40" />
        <div className="relative mx-auto flex max-w-4xl flex-col items-center text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-stone-200 backdrop-blur">
            <Zap className="h-4 w-4 text-fuchsia-300" /> Bugün başlayın
          </div>
          <h2 className="text-balance text-3xl font-bold tracking-tight lg:text-4xl">
            Excel’e veda edin — <span className="text-gradient">yarın puantaj alın</span>
          </h2>
          <p className="mt-4 max-w-lg text-stone-300">
            20+ modül, anket, mesajlaşma, mobil uygulama — hepsi dahil.
            Kurulum 15 dakika. Kredi kartı gerekmez. İstediğiniz zaman iptal.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/register">
              <Button size="lg" className="cta-gradient btn-shine border-0 text-white">
                Ücretsiz Başla
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="secondary" className="border-white/20 bg-white/10 text-white backdrop-blur hover:bg-white/20">
                Giriş Yap
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
      <StickyCtaBar />
    </div>
  );
}
