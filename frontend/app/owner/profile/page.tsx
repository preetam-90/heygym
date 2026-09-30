'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { api, friendlyError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { photoSrc } from '@/lib/gym-owner';
import { EmptyState, LoadingSkeleton } from '@/components/ui-states';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const ACCEPT = 'image/jpeg,image/png,image/webp';
const MAX_BYTES = 5 * 1024 * 1024;

export default function OwnerProfilePage() {
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setName(user.name ?? '');
      setPhone(user.phone ?? '');
      setEmail(user.email ?? '');
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="mx-auto max-w-xl">
        <LoadingSkeleton lines={3} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-xl">
        <EmptyState title="Log in to view your profile" action={<Link href="/login"><Button>Log in</Button></Link>} />
      </div>
    );
  }

  const avatar = photoSrc(user.avatarUrl);
  const initial = (user.name ?? user.email ?? '?').trim().charAt(0).toUpperCase() || '?';

  const onPickFile = (picked: File | null) => {
    setAvatarError(null);
    if (!picked) {
      setFile(null);
      return;
    }
    if (picked.size > MAX_BYTES) {
      setFile(null);
      setAvatarError('Image must be 5 MB or smaller.');
      return;
    }
    setFile(picked);
  };

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    setAvatarError(null);
    try {
      await api.uploadAvatar(file);
      await refreshUser();
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (e) {
      setAvatarError(friendlyError(e, 'Avatar upload failed. Please try again.'));
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async () => {
    setRemoving(true);
    setAvatarError(null);
    try {
      await api.updateProfile({ avatarUrl: null });
      await refreshUser();
    } catch (e) {
      setAvatarError(friendlyError(e));
    } finally {
      setRemoving(false);
    }
  };

  const save = async () => {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const trimmedName = name.trim();
      if (trimmedName && trimmedName.length < 2) {
        throw new Error('Name must be at least 2 characters.');
      }
      await api.updateProfile({
        name: trimmedName || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() ? phone.trim() : null,
      });
      await refreshUser();
      setSaved(true);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-50">Profile</h1>

      <div className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <div className="flex items-center gap-4">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="Profile avatar" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-lime-300/15 text-2xl font-bold text-lime-200" aria-label="Avatar placeholder">
              {initial}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold text-zinc-100">{user.name}</p>
            <p className="truncate text-[13px] text-zinc-500">{user.email}</p>
            {user.avatarUrl && (
              <button
                type="button"
                onClick={removeAvatar}
                disabled={removing}
                className="mt-1 text-[12.5px] text-zinc-500 underline-offset-2 hover:text-red-300 hover:underline disabled:opacity-50"
              >
                {removing ? 'Removing…' : 'Remove avatar'}
              </button>
            )}
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-zinc-400" htmlFor="owner-avatar">Avatar</label>
          <Input
            id="owner-avatar"
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
          />
          <p className="mt-1 text-[12px] text-zinc-600">JPEG, PNG or WebP, up to 5 MB.</p>
        </div>
        {avatarError && <p className="text-[13px] text-red-300">{avatarError}</p>}
        <Button onClick={upload} disabled={!file || uploading} variant="secondary">
          {uploading ? 'Uploading…' : 'Upload avatar'}
        </Button>
      </div>

      <div className="mt-4 space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-zinc-400" htmlFor="owner-profile-name">Name</label>
          <Input id="owner-profile-name" value={name} onChange={(e) => setName(e.target.value)} minLength={2} />
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-zinc-400" htmlFor="owner-profile-email">Email</label>
          <Input id="owner-profile-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-zinc-400" htmlFor="owner-profile-phone">Phone</label>
          <Input id="owner-profile-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91…" />
          <p className="mt-1 text-[12px] text-zinc-600">Digits, spaces and + ( ) - only, 7–20 characters.</p>
        </div>
        <p className="text-[12.5px] text-zinc-600">Role: {user.role}</p>
        {error && <p className="text-[13px] text-red-300">{error}</p>}
        {saved && <p className="text-[13px] text-emerald-300">Profile updated.</p>}
        <Button onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</Button>
      </div>
    </div>
  );
}
