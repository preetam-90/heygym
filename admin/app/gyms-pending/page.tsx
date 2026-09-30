'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth, ACCESS_DENIED_MESSAGE } from '@/lib/auth-context';
import type { Gym } from '@/lib/types';
import GymDetailDrawer from '@/components/gym-detail-drawer';

type Action = 'APPROVED' | 'REJECTED';

export default function GymsPendingPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, logout } = useAuth();
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rowError, setRowError] = useState<Record<string, string>>({});
  const [pendingAction, setPendingAction] = useState<Record<string, Action>>({});
  const [selected, setSelected] = useState<Gym | null>(null);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    setError(null);
    // Drop stale per-row state: a previous row failure must not linger
    // after Refresh once the queue is reloaded.
    setRowError({});
    setPendingAction({});
    try {
      const data = await api.getPendingGyms();
      setGyms(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load the pending queue.');
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
      router.replace('/login?redirect=/gyms-pending');
      return;
    }
    if (user.role !== 'ADMIN') {
      void logout();
      router.replace('/login?error=' + encodeURIComponent(ACCESS_DENIED_MESSAGE));
      return;
    }
    void fetchPending();
  }, [authLoading, user, router, logout, fetchPending]);

  const handleStatusChange = async (gymId: string, status: Action) => {
    // Keep the acted row in place (disabled with Approving…/Rejecting…)
    // so pending/error feedback stays visible. No whole-list snapshot:
    // success reconciles by id and failure never touches the list, so
    // concurrent row actions cannot resurrect or drop sibling rows.
    setPendingAction((current) => ({ ...current, [gymId]: status }));
    setRowError((current) => {
      const next = { ...current };
      delete next[gymId];
      return next;
    });
    try {
      await api.updateGymStatus(gymId, status);
      setGyms((current) => current.filter((gym) => gym.id !== gymId));
    } catch (err) {
      setRowError((current) => ({
        ...current,
        [gymId]: err instanceof Error ? err.message : `Failed to ${status === 'APPROVED' ? 'approve' : 'reject'} gym.`,
      }));
    } finally {
      setPendingAction((current) => {
        const next = { ...current };
        delete next[gymId];
        return next;
      });
    }
  };

  if (authLoading || loading) {
    return (
      <section aria-busy="true">
        <h1 className="text-2xl font-bold">Pending gyms</h1>
        <p className="mt-2 text-sm text-zinc-400">Loading the approval queue…</p>
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
          <h1 className="text-2xl font-bold">Pending gyms</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Oldest submissions first. Approve or reject each gym.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void fetchPending()}
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

      {gyms.length === 0 && !error ? (
        <div className="mt-6 rounded-xl border border-white/10 bg-[#151518] p-10 text-center">
          <p className="text-lg font-semibold">No pending gyms</p>
          <p className="mt-1 text-sm text-zinc-400">
            The approval queue is empty. New gym submissions will appear here.
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
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Plans</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {gyms.map((gym) => (
                <tr key={gym.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setSelected(gym)}
                      className="font-semibold text-zinc-100 underline-offset-4 hover:underline"
                    >
                      {gym.name}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{gym.owner?.name ?? 'Unknown'}</td>
                  <td className="px-4 py-3 text-zinc-400">{gym.city}</td>
                  <td className="px-4 py-3 text-zinc-400">
                    {new Date(gym.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{gym.membershipPlans?.length ?? 0}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={gym.id in pendingAction}
                        onClick={() => void handleStatusChange(gym.id, 'APPROVED')}
                        className="rounded-lg bg-volt px-3 py-1.5 text-xs font-bold text-black disabled:opacity-50"
                      >
                        {pendingAction[gym.id] === 'APPROVED' ? 'Approving…' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        disabled={gym.id in pendingAction}
                        onClick={() => void handleStatusChange(gym.id, 'REJECTED')}
                        className="rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-bold text-red-400 disabled:opacity-50"
                      >
                        {pendingAction[gym.id] === 'REJECTED' ? 'Rejecting…' : 'Reject'}
                      </button>
                    </div>
                    {rowError[gym.id] && (
                      <p role="alert" className="mt-1 text-xs text-red-400">
                        {rowError[gym.id]}
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <GymDetailDrawer gym={selected} onClose={() => setSelected(null)} />
    </section>
  );
}
