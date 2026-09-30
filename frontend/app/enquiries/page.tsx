'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, friendlyError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { Enquiry } from '@/types';
import { EnquiryStatusBadge } from '@/components/status-badge';
import { EmptyState, ErrorState, LoadingSkeleton, Pagination } from '@/components/ui-states';
import { Button } from '@/components/ui/button';

export default function EnquiriesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<Enquiry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .listMyEnquiries(page, 12)
      .then((r) => {
        setItems(r.enquiries);
        setTotalPages(r.meta.totalPages);
        setTotal(r.meta.total);
      })
      .catch((e) => setError(friendlyError(e)))
      .finally(() => setLoading(false));
  }, [user, authLoading, page]);

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 pb-20 pt-28">
        <LoadingSkeleton lines={4} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 pb-20 pt-28">
        <EmptyState title="Log in to see enquiries" action={<Link href="/login"><Button>Log in</Button></Link>} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 pb-20 pt-28">
        <ErrorState message={error} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pb-20 pt-28">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-50">My enquiries</h1>
      {items.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No enquiries yet"
            hint="Ask a gym about pricing, timings, or a trial visit."
            action={<Link href="/gyms"><Button>Find a gym</Button></Link>}
          />
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((e) => (
            <article key={e.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-center justify-between gap-3">
                <Link href={`/gyms/${e.gym?.slug ?? e.gymId}`} className="text-[15px] font-semibold text-zinc-100 hover:underline">
                  {e.gym?.name ?? 'Gym'}
                </Link>
                <EnquiryStatusBadge status={e.status} />
              </div>
              <p className="mt-2 text-[13.5px] text-zinc-400">{e.message}</p>
              {e.response && (
                <p className="mt-2 rounded-xl bg-emerald-500/[0.07] px-3 py-2 text-[13.5px] text-emerald-200">
                  Owner: {e.response}
                </p>
              )}
              <p className="mt-2 text-[12px] text-zinc-600">{new Date(e.createdAt).toLocaleString()}</p>
            </article>
          ))}
          <Pagination page={page} totalPages={totalPages} total={total} onPage={setPage} />
        </div>
      )}
    </div>
  );
}
