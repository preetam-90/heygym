'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth, ACCESS_DENIED_MESSAGE } from '@/lib/auth-context';
import type { Role, User } from '@/lib/types';

const ROLE_STYLES: Record<Role, string> = {
  ADMIN: 'bg-purple-500/15 text-purple-400',
  GYM_OWNER: 'bg-blue-500/15 text-blue-400',
  USER: 'bg-white/5 text-zinc-200',
};

export default function UsersPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, logout } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users.');
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
      router.replace('/login?redirect=/users');
      return;
    }
    if (user.role !== 'ADMIN') {
      void logout();
      router.replace('/login?error=' + encodeURIComponent(ACCESS_DENIED_MESSAGE));
      return;
    }
    void fetchUsers();
  }, [authLoading, user, router, logout, fetchUsers]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter(
      (entry) =>
        entry.name.toLowerCase().includes(query) ||
        entry.email.toLowerCase().includes(query) ||
        entry.role.toLowerCase().includes(query),
    );
  }, [users, search]);

  if (authLoading || loading) {
    return (
      <section aria-busy="true">
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="mt-2 text-sm text-zinc-400">Loading users…</p>
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
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="mt-1 text-sm text-zinc-400">Everyone registered on the platform.</p>
        </div>
        <button
          type="button"
          onClick={() => void fetchUsers()}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-200 hover:border-white/25"
        >
          Refresh
        </button>
      </div>

      <div className="mt-4">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search name, email, or role…"
          aria-label="Search users"
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
          <p className="text-lg font-semibold">No users found</p>
          <p className="mt-1 text-sm text-zinc-400">Try a different search.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-white/10 bg-[#151518]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((entry) => (
                <tr key={entry.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-semibold text-zinc-100">{entry.name}</td>
                  <td className="px-4 py-3 text-zinc-400">{entry.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${ROLE_STYLES[entry.role]}`}
                    >
                      {entry.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {new Date(entry.createdAt).toLocaleDateString()}
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
