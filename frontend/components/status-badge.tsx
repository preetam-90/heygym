import { GYM_STATUS_LABEL, type GymStatus } from '@/types';
import { cn } from '@/lib/utils';

const DOT: Record<GymStatus, string> = {
  DRAFT: 'bg-zinc-400',
  PENDING_APPROVAL: 'bg-amber-400',
  APPROVED: 'bg-emerald-400',
  SUSPENDED: 'bg-red-400',
};

export function GymStatusBadge({ status, className }: { status: GymStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/55 px-2.5 py-1 text-[11px] font-medium tracking-wide text-zinc-200 backdrop-blur-md',
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', DOT[status])} aria-hidden="true" />
      {GYM_STATUS_LABEL[status]}
    </span>
  );
}

const ENQUIRY_TONE: Record<string, string> = {
  NEW: 'bg-sky-400',
  READ: 'bg-amber-400',
  RESPONDED: 'bg-emerald-400',
  CLOSED: 'bg-zinc-500',
};

export function EnquiryStatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-zinc-200">
      <span className={cn('h-1.5 w-1.5 rounded-full', ENQUIRY_TONE[status] ?? 'bg-zinc-400')} aria-hidden="true" />
      {status}
    </span>
  );
}
