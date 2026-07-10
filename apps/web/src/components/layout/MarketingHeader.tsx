import { Link, useRouterState } from '@tanstack/react-router';
import { QrCode, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { cn } from '@/lib/utils';

const navLinks = [
  { label: 'Tüm Modüller', href: '/#moduller' },
  { label: 'Özellikler', href: '/#ozellikler' },
  { label: 'Nasıl Çalışır', href: '/#nasil-calisir' },
  { label: 'Bayi Ol', href: '/#bayi' },
  { label: 'Fiyatlandırma', href: '/#fiyat' },
];

export function MarketingHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const onLanding = pathname === '/';

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-sky-400 text-white shadow-sm">
            <QrCode className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">QR Personel</span>
        </Link>

        {onLanding && (
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Link to="/login">
            <Button
              variant="ghost"
              size="sm"
              className={cn(pathname === '/login' && 'bg-muted text-foreground')}
            >
              Giriş Yap
            </Button>
          </Link>
          <Link to="/register" className="hidden sm:block">
            <Button size="sm" className="cta-gradient btn-shine border-0 text-white">
              Ücretsiz Başla
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
