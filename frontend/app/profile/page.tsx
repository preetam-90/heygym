'use client';

import { useEffect, useState } from 'react';
import { api, friendlyError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { EmptyState, LoadingSkeleton } from '@/components/ui-states';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name ?? '');
      setPhone(user.phone ?? '');
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="mx-auto max-w-xl px-4 pb-20 pt-28">
        <LoadingSkeleton lines={3} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 pb-20 pt-28">
        <EmptyState title="Log in to view your profile" action={<Link href="/login"><Button>Log in</Button></Link>} />
      </div>
    );
  }

  const save = async () => {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      await api.updateProfile({ name: name.trim() || undefined, phone: phone.trim() ? phone.trim() : null });
      await refreshUser();
      setSaved(true);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 pb-20 pt-28">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-50">Profile</h1>
      <div className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-zinc-400" htmlFor="profile-name">Name</label>
          <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-zinc-400">Email</label>
          <Input value={user.email} disabled aria-label="Email (cannot be changed here)" />
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-zinc-400" htmlFor="profile-phone">Phone</label>
          <Input id="profile-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91…" />
        </div>
        <p className="text-[12.5px] text-zinc-600">Role: {user.role}</p>
        {error && <p className="text-[13px] text-red-300">{error}</p>}
        {saved && <p className="text-[13px] text-emerald-300">Profile updated.</p>}
        <Button onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</Button>
      </div>
    </div>
  );
}
