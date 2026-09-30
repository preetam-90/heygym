'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, friendlyError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { Enquiry, Gym } from '@/types';
import { EmptyState, LoadingSkeleton } from '@/components/ui-states';
import { GymStatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';

export default function OwnerOverviewPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) {
      setLoading(false);
      return;
    }
    Promise.all([api.getMyGyms(), api.listOwnerEnquiries({ pageSize: 5 }).then((r) => r.enquiries)])
      .then(([g, e]) => {
        setGyms(g);
        setEnquiries(e);
      })
      .catch((e) => setError(friendlyError(e)))
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  if (authLoading || loading) {
    return <LoadingSkeleton lines={4} />;
  }

  if (!user) {
    return <EmptyState title="Log in as a gym owner" action={<Link href="/login"><Button>Log in</Button></Link>} />;
  }

  if (error) {
    return <p className="text-[14px] text-red-300">{error}</p>;
  }

  const pending = gyms.filter((g) => g.status === 'PENDING_APPROVAL').length;
  const unread = enquiries.filter((e) => e.status === 'NEW').length;

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-zinc-50">Welcome back, {user.name.split(' ')[0]}</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Your gyms', value: gyms.length, href: '/owner/gyms' },
          { label: 'Pending approval', value: pending, href: '/owner/gyms' },
          { label: 'Total enquiries', value: enquiries.length, href: '/owner/enquiries' },
          { label: 'Unread enquiries', value: unread, href: '/owner/enquiries' },
        ].map((c) => (
          <Link key={c.label} href={c.href} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition-colors hover:border-white/20">
            <p className="text-[13px] text-zinc-500">{c.label}</p>
            <p className="tabular mt-1 text-3xl font-bold text-zinc-50">{c.value}</p>
          </Link>
        ))}
      </div>

      <h2 className="mt-8 text-[18px] font-semibold text-zinc-100">Your gyms</h2>
      {gyms.length === 0 ? (
        <div className="mt-3">
          <EmptyState
            title="No gyms yet"
            hint="Create your gym profile, add facilities, plans, photos and hours, then submit for approval."
            action={<Link href="/owner/gyms/new"><Button>List your gym</Button></Link>}
          />
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {gyms.slice(0, 5).map((g) => (
            <Link key={g.id} href={`/owner/gyms/${g.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 hover:border-white/20">
              <div>
                <p className="text-[15px] font-semibold text-zinc-100">{g.name}</p>
                <p className="text-[13px] text-zinc-500">{g.city}</p>
              </div>
              <GymStatusBadge status={g.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
