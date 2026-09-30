import * as React from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

export interface FormFieldProps {
  /** id of the control — also used to link the label and error text. */
  id: string;
  label: React.ReactNode;
  /** Validation message; rendered as a role=alert paragraph when present. */
  error?: string;
  /** Optional node rendered opposite the label (e.g. a "Forgot password?" link). */
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

/**
 * Label + control + error message with one consistent layout. Replaces the
 * Label/Input/error markup that was copy-pasted across every auth form.
 */
export function FormField({ id, label, error, action, className, children }: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {action}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-[13px] text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
