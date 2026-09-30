'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth, ACCESS_DENIED_MESSAGE } from '@/lib/auth-context';
import type { Gym, GymStatus } from '@/lib/types';

type StatusFilter = 'ALL' | GymStatus;

const STATUS_STYLES: Record<GymStatus, string> = {
  PENDING: 'bg-yellow-500/15 text-yellow-400',
  APPROVED: 'bg-green-500/15 text-green-400',
  REJECTED: 'bg-red-500/15 text-red-400',
};

export default function AllGymsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, logout } = useAuth();
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [search, setSearch] = useState('');

  const fetchGyms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getGyms();
      setGyms(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load gyms.');
    } finally {
      setLoading(false);
    }
  }, []);

  // ADMIN-only guard: unauthenticated users go to login; verified
  // non-admins have their session cleared by AuthProvider, so route
  // them to login with access-denied rather than a privileged page.
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login?redirect=/gyms');
      return;
    }
    if (user.role !== 'ADMIN') {
      void logout();
      router.replace('/login?error=' + encodeURIComponent(ACCESS_DENIED_MESSAGE));
      return;
    }
    void fetchGyms();
  }, [authLoading, user, router, logout, fetchGyms]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return gyms
      .filter((gym) => {
        if (statusFilter !== 'ALL' && gym.status !== statusFilter) return false;
        if (!query) return true;
        return (
          gym.name.toLowerCase().includes(query) ||
          gym.city.toLowerCase().includes(query) ||
          (gym.owner?.name ?? '').toLowerCase().includes(query)
        );
      })
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [gyms, statusFilter, search]);

  if (authLoading || loading) {
    return (
      <section aria-busy="true">
        <h1 className="text-2xl font-bold">All gyms</h1>
        <p className="mt-2 text-sm text-zinc-400">Loading gyms…</p>
      </section>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  return (
    <section>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">All gyms</h1>
          <p className="mt-1 text-sm text-zinc-400">Every gym on the platform, newest first.</p>
        </div>
        <button
          type="button"
          onClick={() => void fetchGyms()}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-200 hover:border-white/25"
        >
          Refresh
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex gap-2" role="group" aria-label="Filter by status">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as StatusFilter[]).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              aria-pressed={statusFilter === status}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                statusFilter === status
                  ? 'bg-volt text-black'
                  : 'border border-white/10 text-zinc-400 hover:border-white/25'
              }`}
            >
              {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name, city, or owner…"
          aria-label="Search gyms"
          className="w-full rounded-lg border border-white/10 bg-[#151518] px-4 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 sm:max-w-xs"
        />
      </div>

      {error && (
        <div role="alert" className="mt-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {filtered.length === 0 && !error ? (
        <div className="mt-6 rounded-xl border border-white/10 bg-[#151518] p-10 text-center">
          <p className="text-lg font-semibold">No gyms found</p>
          <p className="mt-1 text-sm text-zinc-400">
            Try a different search or status filter.
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-white/10 bg-[#151518]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-3">Gym</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Plans</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((gym) => (
                <tr key={gym.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-semibold text-zinc-100">{gym.name}</td>
                  <td className="px-4 py-3 text-zinc-400">{gym.owner?.name ?? 'Unknown'}</td>
                  <td className="px-4 py-3 text-zinc-400">{gym.city}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLES[gym.status]}`}
                    >
                      {gym.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{gym.membershipPlans?.length ?? 0}</td>
                  <td className="px-4 py-3 text-zinc-400">
                    {new Date(gym.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
