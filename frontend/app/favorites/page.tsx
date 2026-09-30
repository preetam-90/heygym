'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, friendlyError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { Favorite } from '@/types';
import { GymCard } from '@/components/gym-card';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/ui-states';
import { Button } from '@/components/ui/button';

export default function FavoritesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .listFavorites(1, 48)
      .then((r) => setItems(r.favorites))
      .catch((e) => setError(friendlyError(e)))
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-28">
        <LoadingSkeleton lines={4} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 pb-20 pt-28">
        <EmptyState
          title="Log in to see favorites"
          hint="Save gyms you like and compare them later."
          action={
            <Link href="/login">
              <Button>Log in</Button>
            </Link>
          }
        />
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
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-28">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-50">Saved gyms</h1>
      <p className="mt-2 text-[14px] text-zinc-400">{items.length} saved</p>
      {items.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No favorites yet"
            hint="Tap the heart on any gym to save it here."
            action={
              <Link href="/gyms">
                <Button>Discover gyms</Button>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((f) => f.gym && <GymCard key={f.id} gym={f.gym} />)}
        </div>
      )}
    </div>
  );
}
