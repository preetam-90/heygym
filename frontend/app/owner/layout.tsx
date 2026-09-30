'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/owner', label: 'Overview' },
  { href: '/owner/gyms', label: 'My gyms' },
  { href: '/owner/enquiries', label: 'Enquiries' },
  { href: '/owner/profile', label: 'Profile' },
];

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-28">
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={cn(
              'rounded-full border px-4 py-2 text-[13.5px] font-medium transition-colors',
              pathname === n.href
                ? 'border-lime-300 bg-lime-300/10 text-lime-200'
                : 'border-white/10 bg-white/5 text-zinc-300 hover:border-white/20',
            )}
          >
            {n.label}
          </Link>
        ))}
        <Link href="/gym-owner/dashboard" className="ml-auto text-[13px] text-zinc-500 hover:text-zinc-300">
          Legacy single-gym editor →
        </Link>
      </div>
      {children}
    </div>
  );
}
