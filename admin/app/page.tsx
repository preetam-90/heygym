'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth, ACCESS_DENIED_MESSAGE } from '@/lib/auth-context';
import type { AdminStats } from '@/lib/types';

const CARDS: { key: keyof AdminStats; label: string }[] = [
  { key: 'totalUsers', label: 'Total users' },
  { key: 'totalGyms', label: 'Total gyms' },
  { key: 'pendingGyms', label: 'Pending gyms' },
  { key: 'approvedGyms', label: 'Approved gyms' },
  { key: 'rejectedGyms', label: 'Rejected gyms' },
];

export default function OverviewPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, logout } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load platform stats.');
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
      router.replace('/login?redirect=/');
      return;
    }
    if (user.role !== 'ADMIN') {
      void logout();
      router.replace('/login?error=' + encodeURIComponent(ACCESS_DENIED_MESSAGE));
      return;
    }
    void fetchStats();
  }, [authLoading, user, router, logout, fetchStats]);

  if (authLoading || loading) {
    return (
      <section aria-busy="true">
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="mt-2 text-sm text-zinc-400">Loading platform stats…</p>
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
          <h1 className="text-2xl font-bold">Overview</h1>
          <p className="mt-1 text-sm text-zinc-400">Platform totals at a glance.</p>
        </div>
        <button
          type="button"
          onClick={() => void fetchStats()}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-200 hover:border-white/25"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div role="alert" className="mt-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {stats && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {CARDS.map((card) => (
            <div key={card.key} className="rounded-xl border border-white/10 bg-[#151518] p-5">
              <p className="text-xs uppercase tracking-wider text-zinc-500">{card.label}</p>
              <p className="mt-2 text-3xl font-bold">{stats[card.key]}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
