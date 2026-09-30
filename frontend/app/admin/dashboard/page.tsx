'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, friendlyError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { AdminStats, Enquiry, Gym, Review, User } from '@/types';
import { GymStatusBadge, EnquiryStatusBadge } from '@/components/status-badge';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/ui-states';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Tab = 'overview' | 'pending' | 'gyms' | 'reviews' | 'users' | 'enquiries';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, pending, allUsers, revs, enqs] = await Promise.all([
        api.getStats(),
        api.getPendingGyms(1, 20),
        api.getUsers(1, 20),
        api.listAdminReviews(1, 20),
        api.listAdminEnquiries(1, 20),
      ]);
      setStats(s);
      setGyms(pending.gyms);
      setUsers(allUsers.users);
      setReviews(revs.reviews);
      setEnquiries(enqs.enquiries);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authUser && authUser.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    void load();
  }, [authUser, router, load]);

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
      await load();
      setRejectId(null);
      setReason('');
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-28">
        <LoadingSkeleton lines={5} />
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="mx-auto max-w-3xl px-4 pb-20 pt-28">
        <ErrorState message={error} onRetry={load} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-28">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-50">Admin</h1>
      {stats && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total users', value: stats.totalUsers },
            { label: 'Total gyms', value: stats.totalGyms },
            { label: 'Pending approval', value: stats.pendingGyms },
            { label: 'Approved', value: stats.approvedGyms },
            { label: 'Draft / needs changes', value: stats.draftGyms ?? stats.rejectedGyms },
            { label: 'Suspended', value: stats.suspendedGyms ?? 0 },
            { label: 'Enquiries', value: stats.totalEnquiries ?? 0 },
            { label: 'Reviews', value: stats.totalReviews ?? 0 },
          ].map((c) => (
            <div key={c.label} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <p className="text-[13px] text-zinc-500">{c.label}</p>
              <p className="tabular mt-1 text-3xl font-bold text-zinc-50">{c.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02] p-1.5" role="tablist">
        {(['overview', 'pending', 'gyms', 'reviews', 'users', 'enquiries'] as Tab[]).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`flex-1 rounded-xl px-4 py-2.5 text-[13.5px] font-medium capitalize ${tab === t ? 'bg-lime-300 text-black' : 'text-zinc-400 hover:text-white'}`}>
            {t}
          </button>
        ))}
      </div>
      {error && <p className="mt-3 text-[13.5px] text-red-300">{error}</p>}

      {tab === 'pending' && (
        <div className="mt-4 space-y-3">
          {gyms.length === 0 ? (
            <EmptyState title="No pending gyms" hint="New submissions will appear here for review." />
          ) : (
            gyms.map((g) => (
              <div key={g.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[15px] font-semibold text-zinc-100">{g.name}</p>
                    <p className="text-[13px] text-zinc-500">{g.address}, {g.city} · Owner: {g.owner?.name}</p>
                  </div>
                  <GymStatusBadge status={g.status} />
                </div>
                {rejectId === g.id ? (
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <Input placeholder="Reason (required)" value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Rejection reason" />
                    <Button disabled={busy || !reason.trim()} onClick={() => act(() => api.rejectGym(g.id, reason.trim()))}>Reject gym</Button>
                    <Button variant="outline" onClick={() => { setRejectId(null); setReason(''); }}>Cancel</Button>
                  </div>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href={`/gyms/${g.slug || g.id}`}><Button variant="outline">View</Button></Link>
                    <Button disabled={busy} onClick={() => act(() => api.approveGym(g.id))}>Approve</Button>
                    <Button variant="outline" onClick={() => setRejectId(g.id)}>Reject</Button>
                    <Button variant="outline" onClick={() => act(() => api.suspendGym(g.id, 'Policy review'))}>Suspend</Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'gyms' && (
        <AdminGymList onError={setError} />
      )}

      {tab === 'reviews' && (
        <div className="mt-4 space-y-3">
          {reviews.length === 0 ? (
            <EmptyState title="No reviews" />
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-[14px] text-zinc-100">★ {r.rating} · {r.gym?.name} · {r.user?.name}</p>
                {r.comment && <p className="mt-1 text-[13.5px] text-zinc-400">{r.comment}</p>}
                <div className="mt-2 flex gap-2">
                  <Button variant="outline" disabled={busy} onClick={() => act(() => api.hideReview(r.id))}>Hide</Button>
                  <Button variant="outline" disabled={busy} onClick={() => act(() => api.restoreReview(r.id))}>Restore</Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'users' && (
        <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] p-4 last:border-0">
              <div>
                <p className="text-[14.5px] font-medium text-zinc-100">{u.name}</p>
                <p className="text-[13px] text-zinc-500">{u.email} · {u.role}</p>
              </div>
              <span className="text-[12px] text-zinc-500">{new Date(u.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
          {users.length === 0 && <EmptyState title="No users" />}
        </div>
      )}

      {tab === 'enquiries' && (
        <div className="mt-4 space-y-3">
          {enquiries.length === 0 ? (
            <EmptyState title="No enquiries" />
          ) : (
            enquiries.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div>
                  <p className="text-[14px] text-zinc-100">{e.gym?.name} · {e.user?.name}</p>
                  <p className="line-clamp-1 text-[13px] text-zinc-500">{e.message}</p>
                </div>
                <EnquiryStatusBadge status={e.status} />
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'overview' && (
        <p className="mt-4 text-[14px] text-zinc-400">
          Review pending gyms, moderate reviews, and monitor platform activity. Use the tabs above.
        </p>
      )}
    </div>
  );
}

function AdminGymList({ onError }: { onError: (m: string) => void }) {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .getAllGyms(1, 20, status || undefined)
      .then((r) => setGyms(r.gyms))
      .catch((e) => onError(friendlyError(e)))
      .finally(() => setLoading(false));
  }, [status, onError]);

  if (loading) return <div className="mt-4"><LoadingSkeleton lines={3} /></div>;

  return (
    <div className="mt-4">
      <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-[14px]" aria-label="Filter by status">
        <option value="">All statuses</option>
        <option value="DRAFT">Draft</option>
        <option value="PENDING_APPROVAL">Pending</option>
        <option value="APPROVED">Approved</option>
        <option value="SUSPENDED">Suspended</option>
      </select>
      <div className="mt-3 space-y-2">
        {gyms.map((g) => (
          <div key={g.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <div>
              <p className="text-[14.5px] font-medium text-zinc-100">{g.name}</p>
              <p className="text-[13px] text-zinc-500">{g.city}</p>
            </div>
            <div className="flex items-center gap-2">
              <GymStatusBadge status={g.status} />
              {g.status === 'SUSPENDED' ? (
                <Button variant="outline" onClick={async () => { await api.restoreGym(g.id); setStatus((s) => s); }}>Restore</Button>
              ) : (
                g.status === 'APPROVED' && (
                  <Button variant="outline" onClick={async () => { await api.suspendGym(g.id, 'Admin review'); }}>Suspend</Button>
                )
              )}
            </div>
          </div>
        ))}
        {gyms.length === 0 && <EmptyState title="No gyms" />}
      </div>
    </div>
  );
}
