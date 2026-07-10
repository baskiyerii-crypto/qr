import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary:
        'bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500 text-white shadow-sm shadow-violet-500/20 hover:shadow-md hover:brightness-[1.03] active:brightness-[0.98]',
      secondary:
        'bg-card text-foreground border border-border shadow-xs hover:bg-muted active:bg-muted',
      outline:
        'bg-transparent text-foreground border border-border hover:bg-muted active:bg-muted',
      ghost: 'text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted',
      danger: 'bg-danger text-white shadow-xs hover:bg-danger-600 active:brightness-95',
    };
    const sizes = {
      sm: 'h-8 px-3 text-[13px] gap-1.5',
      md: 'h-10 px-4 text-sm gap-2',
      lg: 'h-12 px-6 text-base gap-2',
      icon: 'h-10 w-10',
    };
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';
