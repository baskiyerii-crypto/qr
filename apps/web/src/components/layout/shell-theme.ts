export type ShellVariant = 'company' | 'admin' | 'reseller' | 'marketer';

/** Zemin nötr; tok tatlı gradient yalnızca aktif/hover menü butonlarında */
export const shellThemes: Record<
  ShellVariant,
  {
    sidebar: string;
    sidebarBorder: string;
    brand: string;
    activeNav: string;
    hoverNav: string;
    activeIcon: string;
    hoverIcon: string;
    idleIcon: string;
    topAccent: string;
    pageIcon: string;
  }
> = {
  company: {
    sidebar: 'bg-card dark:bg-[#1c1c1a]',
    sidebarBorder: 'border-border',
    brand: 'bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-sm shadow-violet-500/20',
    activeNav:
      'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-md shadow-violet-500/30',
    hoverNav:
      'hover:bg-gradient-to-r hover:from-violet-500/15 hover:to-indigo-500/15 hover:text-violet-800 dark:hover:text-violet-200',
    activeIcon: 'bg-white/20 text-white',
    hoverIcon: 'group-hover:bg-violet-500/15 group-hover:text-violet-600 dark:group-hover:text-violet-300',
    idleIcon: 'bg-muted text-muted-foreground',
    topAccent: 'from-violet-500/40 via-indigo-400/25 to-transparent',
    pageIcon:
      'bg-gradient-to-br from-violet-500/20 to-indigo-500/15 text-violet-700 ring-1 ring-violet-400/20 dark:text-violet-200',
  },
  admin: {
    sidebar: 'bg-card dark:bg-[#1c1c1a]',
    sidebarBorder: 'border-border',
    brand: 'bg-gradient-to-br from-teal-500 to-cyan-500 text-white shadow-sm shadow-teal-500/20',
    activeNav:
      'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md shadow-teal-500/30',
    hoverNav:
      'hover:bg-gradient-to-r hover:from-teal-500/15 hover:to-cyan-500/15 hover:text-teal-800 dark:hover:text-teal-200',
    activeIcon: 'bg-white/20 text-white',
    hoverIcon: 'group-hover:bg-teal-500/15 group-hover:text-teal-600 dark:group-hover:text-teal-300',
    idleIcon: 'bg-muted text-muted-foreground',
    topAccent: 'from-teal-500/40 via-cyan-400/25 to-transparent',
    pageIcon:
      'bg-gradient-to-br from-teal-500/20 to-cyan-500/15 text-teal-700 ring-1 ring-teal-400/20 dark:text-teal-200',
  },
  reseller: {
    sidebar: 'bg-card dark:bg-[#1c1c1a]',
    sidebarBorder: 'border-border',
    brand: 'bg-gradient-to-br from-emerald-500 to-green-500 text-white shadow-sm shadow-emerald-500/20',
    activeNav:
      'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-md shadow-emerald-500/30',
    hoverNav:
      'hover:bg-gradient-to-r hover:from-emerald-500/15 hover:to-green-500/15 hover:text-emerald-800 dark:hover:text-emerald-200',
    activeIcon: 'bg-white/20 text-white',
    hoverIcon: 'group-hover:bg-emerald-500/15 group-hover:text-emerald-600 dark:group-hover:text-emerald-300',
    idleIcon: 'bg-muted text-muted-foreground',
    topAccent: 'from-emerald-500/40 via-green-400/25 to-transparent',
    pageIcon:
      'bg-gradient-to-br from-emerald-500/20 to-green-500/15 text-emerald-700 ring-1 ring-emerald-400/20 dark:text-emerald-200',
  },
  marketer: {
    sidebar: 'bg-card dark:bg-[#1c1c1a]',
    sidebarBorder: 'border-border',
    brand: 'bg-gradient-to-br from-blue-500 to-sky-500 text-white shadow-sm shadow-blue-500/20',
    activeNav:
      'bg-gradient-to-r from-blue-500 to-sky-500 text-white shadow-md shadow-blue-500/30',
    hoverNav:
      'hover:bg-gradient-to-r hover:from-blue-500/15 hover:to-sky-500/15 hover:text-blue-800 dark:hover:text-blue-200',
    activeIcon: 'bg-white/20 text-white',
    hoverIcon: 'group-hover:bg-blue-500/15 group-hover:text-blue-600 dark:group-hover:text-blue-300',
    idleIcon: 'bg-muted text-muted-foreground',
    topAccent: 'from-blue-500/40 via-sky-400/25 to-transparent',
    pageIcon:
      'bg-gradient-to-br from-blue-500/20 to-sky-500/15 text-blue-700 ring-1 ring-blue-400/20 dark:text-blue-200',
  },
};
