'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { api, friendlyError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { Notification } from '@/types';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/ui-states';
import { Button } from '@/components/ui/button';

export default function NotificationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.listNotifications(1, 48);
      setItems(r.notifications);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !user) {
      setLoading(false);
      return;
    }
    void load();
  }, [user, authLoading]);

  const markRead = async (id: string) => {
    await api.markNotificationRead(id).catch(() => null);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)));
  };

  const markAll = async () => {
    await api.markAllNotificationsRead().catch(() => null);
    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
  };

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 pb-20 pt-28">
        <LoadingSkeleton lines={4} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 pb-20 pt-28">
        <EmptyState title="Log in to see notifications" action={<Link href="/login"><Button>Log in</Button></Link>} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 pb-20 pt-28">
        <ErrorState message={error} onRetry={load} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20 pt-28">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-50">Notifications</h1>
        {items.some((n) => !n.readAt) && (
          <Button variant="outline" onClick={markAll}>Mark all read</Button>
        )}
      </div>
      {items.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No notifications" hint="Enquiry updates and gym status changes will appear here." />
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((n) => (
            <article
              key={n.id}
              className={`rounded-2xl border p-4 ${n.readAt ? 'border-white/10 bg-white/[0.02]' : 'border-lime-300/30 bg-lime-300/[0.04]'}`}
            >
              <p className="flex items-center gap-2 text-[14.5px] font-semibold text-zinc-100">
                <Bell className="h-4 w-4 text-zinc-500" />
                {n.title}
                {!n.readAt && <span className="h-2 w-2 rounded-full bg-lime-300" aria-label="Unread" />}
              </p>
              <p className="mt-1.5 text-[13.5px] text-zinc-400">{n.message}</p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-[12px] text-zinc-600">{new Date(n.createdAt).toLocaleString()}</p>
                {!n.readAt && (
                  <button onClick={() => markRead(n.id)} className="text-[12.5px] text-lime-300 hover:underline">
                    Mark as read
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
