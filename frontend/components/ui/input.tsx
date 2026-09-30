import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded-[10px] border border-white/[0.1] bg-white/[0.04] px-3.5 py-2 text-[14px] text-zinc-100 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] placeholder:text-zinc-500 transition-[border-color,box-shadow,background-color] duration-200 hover:border-white/20 hover:bg-white/[0.06] focus:border-volt/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-volt/25 focus:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
