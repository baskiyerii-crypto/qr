import { createContext, useContext, useEffect, useState } from 'react';
import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { LogOut, QrCode, Menu, X, ChevronDown, PanelLeftClose, PanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth';
import { useSidebarStore } from '@/stores/sidebar';
import { Avatar } from '@/components/ui/Avatar';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { InstallAppBanner } from '@/components/InstallAppBanner';
import { shellThemes, type ShellVariant } from './shell-theme';

export type { ShellVariant };

const ShellVariantContext = createContext<ShellVariant>('company');

export function useShellVariant() {
  return useContext(ShellVariantContext);
}

export type NavItem = {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  exact?: boolean;
  roles?: readonly string[];
};

export type NavGroup = {
  label?: string;
  items: NavItem[];
};

interface AppShellProps {
  variant?: ShellVariant;
  brandTitle: string;
  brandSubtitle: string;
  groups: NavGroup[];
  children: React.ReactNode;
}

function itemIsActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.to;
  return pathname === item.to || pathname.startsWith(item.to + '/');
}

const EXPANDED_W = 'w-[252px]';
const COLLAPSED_W = 'w-[72px]';

export function AppShell({
  variant = 'company',
  brandTitle,
  brandSubtitle,
  groups,
  children,
}: AppShellProps) {
  const theme = shellThemes[variant];
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { collapsed, toggle, init } = useSidebarStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    logout();
    navigate({ to: '/login' });
  };

  const visibleGroups = groups
    .map((g) => ({
      ...g,
      items: g.items.filter((it) => !it.roles || (user?.role ? it.roles.includes(user.role) : false)),
    }))
    .filter((g) => g.items.length > 0);

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Kullanıcı';

  const renderSidebar = (isMobile: boolean) => {
    const isCollapsed = !isMobile && collapsed;

    return (
      <div className={cn('relative flex h-full flex-col overflow-hidden', theme.sidebar)}>
        {/* Brand */}
        <div
          className={cn(
            'relative flex shrink-0 border-b px-3 py-3.5',
            theme.sidebarBorder,
            isCollapsed ? 'flex-col items-center gap-2' : 'items-center gap-2.5',
          )}
        >
          <div
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white',
              theme.brand,
            )}
          >
            <QrCode className="h-[18px] w-[18px]" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold tracking-tight text-foreground">{brandTitle}</p>
              <p className="truncate text-[11px] text-muted-foreground">{brandSubtitle}</p>
            </div>
          )}
          {isMobile ? (
            <button
              onClick={() => setMobileOpen(false)}
              className={cn(
                'rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted',
                !isCollapsed && 'ml-auto',
              )}
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={toggle}
              title={isCollapsed ? 'Menüyü genişlet' : 'Menüyü daralt'}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted"
            >
              {isCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="relative flex-1 space-y-3 overflow-y-auto px-2.5 py-3">
          {visibleGroups.map((group, gi) => (
            <div key={gi}>
              {group.label && !isCollapsed && (
                <p className="mb-1.5 px-2.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                  {group.label}
                </p>
              )}
              {group.label && isCollapsed && <div className="mx-auto mb-1.5 h-px w-6 bg-border/80" />}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = itemIsActive(pathname, item);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      title={isCollapsed ? item.label : undefined}
                      className={cn(
                        'group flex items-center rounded-xl text-[13px] font-medium transition-all duration-150',
                        isCollapsed ? 'justify-center p-1.5' : 'gap-2.5 px-2 py-1.5',
                        active
                          ? theme.activeNav
                          : cn('text-muted-foreground', theme.hoverNav),
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-150',
                          active ? theme.activeIcon : cn(theme.idleIcon, theme.hoverIcon),
                        )}
                      >
                        <item.icon className="h-[16px] w-[16px]" />
                      </span>
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className={cn('relative shrink-0 space-y-1.5 border-t p-2.5', theme.sidebarBorder)}>
          {!isCollapsed && (
            <div className="flex items-center gap-2.5 rounded-xl bg-muted/50 px-2.5 py-2 ring-1 ring-border/80">
              <Avatar name={fullName} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-foreground">{fullName}</p>
                <p className="truncate text-[10px] text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            title="Çıkış Yap"
            className={cn(
              'flex w-full items-center rounded-xl text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
              isCollapsed ? 'justify-center p-2' : 'gap-2.5 px-2 py-1.5',
            )}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
              <LogOut className="h-4 w-4" />
            </span>
            {!isCollapsed && 'Çıkış Yap'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <ShellVariantContext.Provider value={variant}>
      <div className="min-h-screen bg-background">
        <aside
          className={cn(
            'fixed left-0 top-0 z-40 hidden h-screen border-r shadow-sm transition-[width] duration-300 ease-in-out lg:block',
            theme.sidebarBorder,
            collapsed ? COLLAPSED_W : EXPANDED_W,
          )}
        >
          {renderSidebar(false)}
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-fade-in"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute left-0 top-0 h-full w-[272px] shadow-lg animate-fade-in-up">
              {renderSidebar(true)}
            </div>
          </div>
        )}

        <div
          className={cn(
            'transition-[padding] duration-300 ease-in-out',
            collapsed ? 'lg:pl-[72px]' : 'lg:pl-[252px]',
          )}
        >
          <header className="sticky top-0 z-30 border-b border-border/80 bg-background/80 backdrop-blur-md">
            <div className={cn('h-px w-full bg-gradient-to-r', theme.topAccent)} />
            <div className="flex h-14 items-center gap-2 px-4 sm:px-5">
              <button
                onClick={() => setMobileOpen(true)}
                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted lg:hidden"
              >
                <Menu className="h-[18px] w-[18px]" />
              </button>

              <button
                onClick={toggle}
                className="hidden rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted lg:inline-flex"
                title={collapsed ? 'Menüyü genişlet' : 'Menüyü daralt'}
              >
                {collapsed ? <PanelLeft className="h-[18px] w-[18px]" /> : <PanelLeftClose className="h-[18px] w-[18px]" />}
              </button>

              <div className="ml-auto flex items-center gap-1.5">
                <ThemeToggle />
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen((v) => !v)}
                    className="flex items-center gap-2 rounded-xl border border-border/80 bg-card/80 py-1 pl-1 pr-2.5 transition-colors hover:bg-muted/50"
                  >
                    <Avatar name={fullName} size="sm" />
                    <div className="hidden text-left sm:block">
                      <p className="text-[13px] font-medium leading-tight text-foreground">{fullName}</p>
                      <p className="text-[11px] leading-tight text-muted-foreground">{user?.email}</p>
                    </div>
                    <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
                  </button>
                  {menuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                      <div className="absolute right-0 z-20 mt-1.5 w-52 origin-top-right rounded-xl border border-border bg-card p-1 shadow-overlay animate-scale-in">
                        <div className="border-b border-border px-3 py-2">
                          <p className="text-[13px] font-medium text-foreground">{fullName}</p>
                          <p className="truncate text-[11px] text-muted-foreground">{user?.email}</p>
                        </div>
                        <button
                          onClick={handleLogout}
                          className="mt-0.5 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-rose-500/8 hover:text-rose-600"
                        >
                          <LogOut className="h-3.5 w-3.5" /> Çıkış Yap
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <InstallAppBanner />
          </header>

          <main className="mx-auto max-w-7xl p-4 sm:p-5 lg:p-7">{children}</main>
        </div>
      </div>
    </ShellVariantContext.Provider>
  );
}
