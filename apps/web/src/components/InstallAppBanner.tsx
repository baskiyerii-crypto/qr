import { useEffect, useState, useCallback } from 'react';
import { Download, Share, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function isIos() {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
}

const DISMISS_KEY = 'pwa-install-dismissed';

export function usePwaInstall() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      return;
    }

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };

    window.addEventListener('beforeinstallprompt', onBip);
    window.addEventListener('appinstalled', onInstalled);

    if (isIos() && !isStandalone()) {
      setIosHint(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBip);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === 'accepted') setInstalled(true);
      setDeferred(null);
      return 'prompted' as const;
    }
    if (iosHint) return 'ios' as const;
    return 'unavailable' as const;
  }, [deferred, iosHint]);

  return {
    canInstall: !!deferred,
    iosHint,
    installed,
    promptInstall,
  };
}

/** Sticky banner under header when install is available / iOS hint. */
export function InstallAppBanner({ className }: { className?: string }) {
  const { canInstall, iosHint, installed, promptInstall } = usePwaInstall();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [showIosSteps, setShowIosSteps] = useState(false);

  if (installed || dismissed || (!canInstall && !iosHint)) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  const onClick = async () => {
    const result = await promptInstall();
    if (result === 'ios') setShowIosSteps(true);
  };

  return (
    <div
      className={cn(
        'border-b border-border/80 bg-primary/5 px-4 py-2.5 sm:px-5',
        className,
      )}
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3">
        <Download className="h-4 w-4 shrink-0 text-primary" />
        <p className="min-w-0 flex-1 text-sm text-foreground">
          {showIosSteps ? (
            <>
              Safari’de <Share className="inline h-3.5 w-3.5" /> Paylaş →{' '}
              <strong>Ana Ekrana Ekle</strong>
            </>
          ) : (
            <>Uygulamayı masaüstüne / ana ekrana ekleyin — daha hızlı erişim ve bildirimler.</>
          )}
        </p>
        <div className="flex items-center gap-2">
          {!showIosSteps && (
            <Button size="sm" onClick={onClick}>
              Masaüstüne ekle
            </Button>
          )}
          <button
            type="button"
            onClick={dismiss}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
            aria-label="Kapat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
