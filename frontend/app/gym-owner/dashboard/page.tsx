'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { gymCompletion, photoSrc } from '@/lib/gym-owner';
import type { Gym, GymStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Dumbbell, Users, LogOut, Eye, Pencil, ImageIcon, CheckCircle2, AlertTriangle } from 'lucide-react';

const STATUS_STYLES: Record<GymStatus, string> = {
  PENDING: 'bg-yellow-500/15 text-yellow-400',
  UNDER_REVIEW: 'bg-blue-500/15 text-blue-400',
  APPROVED: 'bg-green-500/15 text-green-400',
  REJECTED: 'bg-red-500/15 text-red-400',
  SUSPENDED: 'bg-zinc-500/15 text-zinc-400',
};

const STATUS_LABEL: Record<GymStatus, string> = {
  PENDING: 'Draft',
  UNDER_REVIEW: 'Pending Approval',
  APPROVED: 'Approved',
  REJECTED: 'Changes Required',
  SUSPENDED: 'Suspended',
};

export default function GymOwnerDashboardPage() {
  const router = useRouter();
  const { user: authUser, logout, refreshUser } = useAuth();
  const [gym, setGym] = useState<Gym | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const init = async () => {
    try {
      let current = authUser;
      if (!current) {
        try {
          current = await api.me();
        } catch {
          current = null;
        }
      }
      if (!current) {
        router.push('/login?redirect=/gym-owner/dashboard');
        return;
      }
      if (current.role === 'ADMIN') {
        router.push('/admin/dashboard');
        return;
      }
      if (current.role !== 'GYM_OWNER') {
        router.push('/');
        return;
      }
      setProfileName(current.name);
      setProfileEmail(current.email);
      await fetchGym();
    } catch {
      router.push('/login?redirect=/gym-owner/dashboard');
    }
  };

  const fetchGym = async () => {
    try {
      setError(null);
      const gyms = await api.getMyGyms();
      setGym(gyms[0] ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load your gym');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!gym) return;
    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await api.submitGym(gym.id);
      setGym(updated);
      setNotice('Your gym was submitted for approval.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit gym');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setError(null);
    setNotice(null);
    try {
      await api.updateProfile({ name: profileName, email: profileEmail });
      await refreshUser();
      setNotice('Profile updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="container px-4 py-16">
        <div className="flex justify-center" role="status" aria-label="Loading">
          <Loader2 className="h-8 w-8 animate-spin text-[#D4FF4F]" />
        </div>
      </div>
    );
  }

  const completion = gym ? gymCompletion(gym) : 0;
  const photoCount = gym?.images?.length ?? 0;
  const cover = photoSrc(gym?.images?.find((i) => i.isPrimary)?.url ?? gym?.images?.[0]?.url ?? gym?.imageUrl);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4FF4F]">Manage</p>
          <h1 className="mt-1 font-display text-4xl font-bold uppercase tracking-tight text-white">Owner Dashboard</h1>
          <p className="text-zinc-400">
            {authUser || profileName ? `Welcome, ${authUser?.name ?? profileName}` : 'Welcome'}
          </p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-400" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="mb-6 rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-green-400" role="status">
          {notice}
        </div>
      )}

      {!gym ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Dumbbell className="mx-auto mb-4 h-16 w-16 text-zinc-600" aria-hidden="true" />
            <h2 className="text-lg font-medium text-white">You haven&apos;t added your gym yet</h2>
            <p className="mx-auto mt-2 max-w-md text-zinc-400">
              Create your gym profile to start showing your gym to customers.
            </p>
            <Link href="/gym-owner/my-gym">
              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Add Your Gym
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {gym.status === 'REJECTED' && (
            <Card className="border-red-500/30">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" aria-hidden="true" />
                  <div className="flex-1">
                    <h2 className="font-semibold text-white">Gym Status: Changes Required</h2>
                    {gym.rejectionReason ? (
                      <p className="mt-1 text-sm text-zinc-300">
                        <span className="font-medium text-zinc-400">Admin message: </span>
                        {gym.rejectionReason}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-zinc-400">The admin requested changes before approval.</p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link href="/gym-owner/my-gym">
                        <Button variant="outline" size="sm">
                          <Pencil className="mr-1 h-4 w-4" />
                          Edit Gym
                        </Button>
                      </Link>
                      <Button size="sm" onClick={handleSubmit} disabled={submitting}>
                        {submitting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                        Resubmit
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4FF4F]">My Gym</p>
                    <CardTitle className="mt-1">{gym.name}</CardTitle>
                    <p className="mt-1 text-sm text-zinc-400">
                      {gym.address}, {gym.city}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${STATUS_STYLES[gym.status]}`}>
                    {STATUS_LABEL[gym.status] ?? gym.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {cover && (
                  <div className="overflow-hidden rounded-xl border border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={cover} alt={`${gym.name} cover`} className="aspect-video w-full object-cover" />
                  </div>
                )}
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">Profile completion</span>
                    <span className="font-semibold text-white">{completion}% complete</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={completion} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full rounded-full bg-[#D4FF4F]" style={{ width: `${completion}%` }} />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <ImageIcon className="h-4 w-4" aria-hidden="true" />
                  {photoCount} photo{photoCount === 1 ? '' : 's'} uploaded
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href="/gym-owner/my-gym">
                    <Button variant="outline" size="sm">
                      <Pencil className="mr-1 h-4 w-4" />
                      Manage Gym
                    </Button>
                  </Link>
                  <Link href="/gym-owner/my-gym/photos">
                    <Button variant="outline" size="sm">
                      <ImageIcon className="mr-1 h-4 w-4" />
                      Photos
                    </Button>
                  </Link>
                  <Link href={`/gyms/${gym.id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="mr-1 h-4 w-4" />
                      Preview Gym
                    </Button>
                  </Link>
                </div>
                {(gym.status === 'PENDING' || gym.status === 'REJECTED') && (
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-sm text-zinc-300">
                      {gym.status === 'PENDING'
                        ? 'When your profile is ready, submit it for admin approval.'
                        : 'After making the requested changes, resubmit for approval.'}
                    </p>
                    <Button className="mt-3" size="sm" onClick={handleSubmit} disabled={submitting}>
                      {submitting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                      {gym.status === 'PENDING' ? 'Submit for Approval' : 'Resubmit for Approval'}
                    </Button>
                  </div>
                )}
                {gym.status === 'UNDER_REVIEW' && (
                  <p className="flex items-center gap-2 text-sm text-blue-300">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    Submitted. The admin is reviewing your gym.
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/15">
                      <Users className="h-6 w-6 text-blue-400" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm text-zinc-400">Customers</p>
                      <p className="text-sm text-zinc-500">Available after bookings launch</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="owner-name">Name</Label>
                      <Input id="owner-name" value={profileName} onChange={(e) => setProfileName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="owner-email">Email</Label>
                      <Input id="owner-email" type="email" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} />
                    </div>
                    <Button type="submit" size="sm" disabled={savingProfile}>
                      {savingProfile && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                      Save Profile
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
