import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-[10px] text-sm font-semibold tracking-[-0.01em] cursor-pointer min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0B] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]';

    const variants = {
      default:
        'bg-volt text-volt-ink shadow-[0_1px_0_rgba(212,255,79,0.3)_inset,0_8px_24px_rgba(212,255,79,0.18)] transition-[background-color,box-shadow,transform] duration-200 hover:bg-volt-bright hover:shadow-[0_1px_0_rgba(212,255,79,0.3)_inset,0_12px_32px_rgba(212,255,79,0.25)]',
      destructive:
        'bg-red-600 text-white shadow-[0_8px_20px_rgba(239,68,68,0.2)] transition-[background-color,box-shadow,transform] duration-200 hover:bg-red-500',
      outline:
        'border border-white/[0.12] bg-white/[0.03] text-zinc-100 backdrop-blur transition-[background-color,border-color,transform] duration-200 hover:bg-white/[0.07] hover:border-white/20',
      secondary:
        'bg-white/[0.07] text-white border border-white/[0.08] transition-[background-color,border-color,transform] duration-200 hover:bg-white/[0.11]',
      ghost:
        'text-zinc-300 transition-[background-color,color] duration-150 hover:bg-white/[0.07] hover:text-white',
      link: 'text-volt underline-offset-4 hover:underline min-h-0',
    };

    const sizes = {
      default: 'h-11 px-5 py-2',
      sm: 'h-10 min-h-[44px] rounded-[8px] px-4 text-[13px]',
      lg: 'h-[52px] rounded-[12px] px-8 text-[15px]',
      icon: 'h-11 w-11 min-h-[44px] min-w-[44px]',
    };

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
