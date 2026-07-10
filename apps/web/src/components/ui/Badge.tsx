import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
  dot?: boolean;
  className?: string;
}

const variants = {
  default: 'bg-muted text-muted-foreground ring-border',
  primary: 'bg-primary/10 text-foreground ring-primary/15',
  success: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400',
  warning: 'bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:text-amber-400',
  error: 'bg-rose-500/10 text-rose-600 ring-rose-500/20 dark:text-rose-400',
  info: 'bg-sky-500/10 text-sky-600 ring-sky-500/20 dark:text-sky-400',
};

const dotColors = {
  default: 'bg-slate-400',
  primary: 'bg-primary',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error: 'bg-rose-500',
  info: 'bg-sky-500',
};

export function Badge({ children, variant = 'default', dot, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        variants[variant],
        className,
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  );
}
