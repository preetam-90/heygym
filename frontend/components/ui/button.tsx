import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-[10px] text-sm font-semibold transition-all duration-200 cursor-pointer min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4FF4F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090B] disabled:pointer-events-none disabled:opacity-50';
    
    const variants = {
      default: 'bg-[#D4FF4F] text-black hover:brightness-110 hover:shadow-[0_8px_30px_rgba(212,255,79,0.25)]',
      destructive: 'bg-red-600 text-white hover:bg-red-500',
      outline: 'border border-white/15 bg-transparent text-zinc-100 hover:bg-white/10 hover:border-white/25',
      secondary: 'bg-white/10 text-white hover:bg-white/15',
      ghost: 'text-zinc-300 hover:bg-white/10 hover:text-white',
      link: 'text-[#D4FF4F] underline-offset-4 hover:underline',
    };

    const sizes = {
      default: 'h-11 px-4 py-2',
      sm: 'h-10 min-h-[44px] rounded-md px-4',
      lg: 'h-12 rounded-md px-8',
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