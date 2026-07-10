import { Link } from '@tanstack/react-router';
import { QrCode } from 'lucide-react';

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-card px-4 py-12 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-sky-400 text-white">
              <QrCode className="h-4 w-4" />
            </div>
            <span className="font-semibold text-foreground">QR Personel</span>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Personel devamı, puantaj ve iletişim platformu. İşletmeler için, bayiler için gelir fırsatı.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Platform</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><a href="/#ozellikler" className="transition hover:text-foreground">Özellikler</a></li>
            <li><a href="/#nasil-calisir" className="transition hover:text-foreground">Nasıl çalışır</a></li>
            <li><a href="/#fiyat" className="transition hover:text-foreground">Fiyatlandırma</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">İş ortaklığı</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/bayi-basvuru" className="transition hover:text-foreground">Bayi başvurusu</Link></li>
            <li><Link to="/register" className="transition hover:text-foreground">Şirket kaydı</Link></li>
            <li><Link to="/login" className="transition hover:text-foreground">Yönetim girişi</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Güven</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>KVKK uyumlu</li>
            <li>Geofence doğrulama</li>
            <li>Çok kiracılı izolasyon</li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-6xl border-t border-border pt-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} QR Personel · Tüm hakları saklıdır
      </div>
    </footer>
  );
}
