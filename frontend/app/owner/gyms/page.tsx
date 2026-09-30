'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { api, friendlyError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { Gym } from '@/types';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/ui-states';
import { GymStatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';

export default function OwnerGymsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setGyms(await api.getMyGyms());
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) void load();
    else if (!authLoading) setLoading(false);
  }, [authLoading, user]);

  if (authLoading || loading) return <LoadingSkeleton lines={4} />;
  if (!user) return <EmptyState title="Log in as a gym owner" action={<Link href="/login"><Button>Log in</Button></Link>} />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-50">My gyms</h1>
        <Link href="/owner/gyms/new">
          <Button><Plus className="mr-2 h-4 w-4" /> New gym</Button>
        </Link>
      </div>
      {gyms.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="No gyms registered" hint="List your first gym to start receiving enquiries." action={<Link href="/owner/gyms/new"><Button>List your gym</Button></Link>} />
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
          {gyms.map((g) => (
            <Link key={g.id} href={`/owner/gyms/${g.id}`} className="flex items-center justify-between gap-3 border-b border-white/5 bg-white/[0.02] p-4 last:border-0 hover:bg-white/[0.04]">
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold text-zinc-100">{g.name}</p>
                <p className="truncate text-[13px] text-zinc-500">{g.address}, {g.city} · {(g.membershipPlans ?? []).length} plans</p>
                {g.status === 'DRAFT' && g.rejectionReason && (
                  <p className="mt-1 text-[12.5px] text-red-300">Needs changes: {g.rejectionReason}</p>
                )}
              </div>
              <GymStatusBadge status={g.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
