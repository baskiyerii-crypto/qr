import { cn } from '@/lib/utils';
import { useShellVariant } from '@/components/layout/AppShell';
import { shellThemes } from '@/components/layout/shell-theme';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, icon, actions, className }: PageHeaderProps) {
  const variant = useShellVariant();
  const pageIcon = shellThemes[variant].pageIcon;

  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-4', className)}>
      <div className="flex items-start gap-3">
        {icon && (
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl sm:h-11 sm:w-11', pageIcon)}>
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
