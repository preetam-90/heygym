'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { gymCompletion, photoSrc } from '@/lib/gym-owner';
import type { Gym, GymImage, GymStatus, MembershipPlan } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2, Plus, Dumbbell, LogOut, Eye, Pencil, ImageIcon, CheckCircle2, AlertTriangle,
  Upload, Star, Trash2, Clock, MapPin, Phone, Mail, Tag, LayoutDashboard, Settings as SettingsIcon,
  Check, X, Globe, Sparkles,
} from 'lucide-react';

const STATUS_DOT: Record<GymStatus, string> = {
  PENDING: 'bg-amber-400',
  UNDER_REVIEW: 'bg-sky-400',
  APPROVED: 'bg-emerald-400',
  REJECTED: 'bg-red-400',
  SUSPENDED: 'bg-zinc-500',
};

const STATUS_LABEL: Record<GymStatus, string> = {
  PENDING: 'Draft',
  UNDER_REVIEW: 'In review',
  APPROVED: 'Live',
  REJECTED: 'Needs changes',
  SUSPENDED: 'Suspended',
};

type Tab = 'overview' | 'photos' | 'plans' | 'settings';

const ACCEPT = 'image/jpeg,image/png,image/webp';
const MAX_BYTES = 5 * 1024 * 1024;

export default function GymOwnerDashboardPage() {
  const router = useRouter();
  const { user: authUser, logout, refreshUser } = useAuth();
  const [gym, setGym] = useState<Gym | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState<Tab>('overview');

  // Settings
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Photos
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [busyPhotoId, setBusyPhotoId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Plans
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [planName, setPlanName] = useState('');
  const [planPrice, setPlanPrice] = useState('');
  const [planDuration, setPlanDuration] = useState('1');
  const [planDesc, setPlanDesc] = useState('');
  const [savingPlan, setSavingPlan] = useState(false);
  const [confirmPlanDelete, setConfirmPlanDelete] = useState<string | null>(null);

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
      const first = gyms[0] ?? null;
      setGym(first);
      setPlans(first?.membershipPlans ?? []);
      if (first && (!first.membershipPlans || first.membershipPlans.length === 0)) {
        void loadPlans(first.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load your gym');
    } finally {
      setLoading(false);
    }
  };

  const refreshGym = useCallback(async () => {
    const gyms = await api.getMyGyms();
    const first = gyms[0] ?? null;
    setGym(first);
    if (first) {
      try {
        const fetched = await api.getMembershipPlans(first.id);
        setPlans(fetched);
      } catch {
        setPlans(first.membershipPlans ?? []);
      }
    }
    return first;
  }, []);

  const loadPlans = async (gymId: string) => {
    setPlansLoading(true);
    try {
      const fetched = await api.getMembershipPlans(gymId);
      setPlans(fetched);
    } catch {
      // plans may already be embedded; ignore
    } finally {
      setPlansLoading(false);
    }
  };

  // ---------- submit / profile ----------
  const handleSubmit = async () => {
    if (!gym) return;
    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await api.submitGym(gym.id);
      setGym(updated);
      setNotice('Submitted for review. Approval usually takes under 24 hours.');
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

  // ---------- photos ----------
  const handleFiles = async (files: FileList | File[] | null) => {
    if (!files || !gym) return;
    const list = Array.from(files as unknown as File[]);
    if (list.length === 0) return;
    setError(null);
    setNotice(null);
    const current = gym.images?.length ?? 0;
    if (current + list.length > 10) {
      setError(`You can upload at most 10 photos (you have ${current}).`);
      return;
    }
    setUploading(true);
    try {
      let done = 0;
      for (const file of list) {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          throw new Error(`"${file.name}" is not a JPG, PNG, or WebP image.`);
        }
        if (file.size > MAX_BYTES) {
          throw new Error(`"${file.name}" exceeds the 5 MB limit.`);
        }
        done += 1;
        setUploadProgress(`Uploading ${done} of ${list.length}…`);
        await api.uploadGymPhoto(gym.id, file);
      }
      await refreshGym();
      setNotice(list.length === 1 ? 'Photo uploaded.' : `${list.length} photos uploaded.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Photo upload failed.');
      await refreshGym().catch(() => undefined);
    } finally {
      setUploading(false);
      setUploadProgress(null);
      setDragOver(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSetPrimary = async (photo: GymImage) => {
    if (!gym || photo.isPrimary) return;
    setBusyPhotoId(photo.id);
    setError(null);
    try {
      await api.setPrimaryPhoto(gym.id, photo.id);
      await refreshGym();
      setNotice('Cover photo updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set cover photo.');
    } finally {
      setBusyPhotoId(null);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!gym) return;
    setBusyPhotoId(photoId);
    setError(null);
    try {
      await api.deleteGymPhoto(gym.id, photoId);
      setConfirmDeleteId(null);
      await refreshGym();
      setNotice('Photo deleted.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete photo.');
    } finally {
      setBusyPhotoId(null);
    }
  };

  // ---------- plans ----------
  const resetPlanForm = () => {
    setPlanName('');
    setPlanPrice('');
    setPlanDuration('1');
    setPlanDesc('');
    setEditingPlan(null);
    setShowPlanForm(false);
  };

  const openEditPlan = (plan: MembershipPlan) => {
    setEditingPlan(plan);
    setPlanName(plan.name);
    setPlanPrice(String(plan.price));
    setPlanDuration(String(plan.duration));
    setPlanDesc(plan.description ?? '');
    setShowPlanForm(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gym) return;
    const price = Number(planPrice);
    const duration = Number(planDuration);
    if (!planName.trim() || planName.trim().length < 2) {
      setError('Plan name must be at least 2 characters.');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setError('Price must be a positive number.');
      return;
    }
    if (!Number.isInteger(duration) || duration <= 0) {
      setError('Duration must be a whole number of months.');
      return;
    }
    setSavingPlan(true);
    setError(null);
    setNotice(null);
    try {
      const payload = {
        name: planName.trim(),
        price,
        duration,
        description: planDesc.trim() || undefined,
      };
      if (editingPlan) {
        await api.updateMembershipPlan(gym.id, editingPlan.id, payload);
        setNotice('Plan updated.');
      } else {
        await api.createMembershipPlan(gym.id, payload);
        setNotice('Plan added.');
      }
      resetPlanForm();
      await refreshGym();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save plan.');
    } finally {
      setSavingPlan(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!gym) return;
    setSavingPlan(true);
    try {
      await api.deleteMembershipPlan(gym.id, planId);
      setConfirmPlanDelete(null);
      await refreshGym();
      setNotice('Plan deleted.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete plan.');
    } finally {
      setSavingPlan(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-8 max-w-md">
          <div className="h-4 w-24 animate-pulse rounded-full bg-white/[0.07]" />
          <div className="mt-3 h-10 w-72 animate-pulse rounded-[12px] bg-white/[0.07]" />
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="h-64 animate-pulse rounded-[20px] bg-white/[0.04] lg:col-span-2" />
          <div className="h-64 animate-pulse rounded-[20px] bg-white/[0.04]" />
        </div>
      </div>
    );
  }

  const completion = gym ? gymCompletion(gym) : 0;
  const photos = gym?.images ?? [];
  const photoCount = photos.length;
  const cover = photoSrc(photos.find((i) => i.isPrimary)?.url ?? photos[0]?.url ?? gym?.imageUrl);
  const hasHours = !!gym?.openingTime && !!gym?.closingTime;
  const hasPlans = plans.length > 0;

  const checklist: { label: string; done: boolean; hint: string; action: Tab | 'my-gym' }[] = gym
    ? [
        { label: 'Add at least 3 photos', done: photoCount >= 3, hint: `${photoCount}/3 uploaded`, action: 'photos' },
        { label: 'Add a membership plan', done: hasPlans, hint: hasPlans ? `${plans.length} live` : 'none yet', action: 'plans' },
        { label: 'Set opening hours', done: hasHours, hint: hasHours ? `${gym.openingTime} – ${gym.closingTime}` : 'not set', action: 'my-gym' },
        { label: 'Write a description', done: !!(gym.description && gym.description.length > 20), hint: gym.description ? `${gym.description.length} chars` : 'missing', action: 'my-gym' },
        { label: 'Add contact details', done: !!(gym.phone || gym.email), hint: gym.phone ?? gym.email ?? 'missing', action: 'my-gym' },
      ]
    : [];

  const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'photos', label: 'Photos', icon: ImageIcon, badge: photoCount },
    { id: 'plans', label: 'Plans', icon: Tag, badge: plans.length },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Manage</p>
          <h1 className="mt-1.5 font-display text-4xl font-semibold tracking-[-0.02em] text-white md:text-[44px]">Owner dashboard</h1>
          <p className="mt-1.5 text-[14px] text-zinc-400">
            {authUser || profileName ? `Welcome back, ${authUser?.name ?? profileName}` : 'Welcome'} · everything for your gym in one place
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {gym && (
            <>
              <Link href={`/gyms/${gym.id}`}>
                <Button variant="secondary" size="sm">
                  <Eye className="mr-1.5 h-4 w-4" />
                  Preview
                </Button>
              </Link>
              <Link href="/gym-owner/my-gym">
                <Button variant="outline" size="sm">
                  <Pencil className="mr-1.5 h-4 w-4" />
                  Edit details
                </Button>
              </Link>
            </>
          )}
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="mr-1.5 h-4 w-4" />
            Log out
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-2.5 rounded-[14px] border border-red-500/25 bg-red-500/[0.08] p-4 text-[13.5px] text-red-300" role="alert">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {notice && (
        <div className="mb-5 flex items-start gap-2.5 rounded-[14px] border border-emerald-500/25 bg-emerald-500/[0.08] p-4 text-[13.5px] text-emerald-300" role="status">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}
      {uploadProgress && (
        <div className="mb-5 flex items-center gap-3 rounded-[14px] border border-[#D4FF4F]/25 bg-[#D4FF4F]/[0.07] p-4 text-[13.5px] text-[#D4FF4F]" role="status">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          {uploadProgress}
        </div>
      )}

      {!gym ? (
        <Card className="surface-premium">
          <CardContent className="py-14 text-center">
            <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-[16px] border border-white/[0.08] bg-white/[0.04]">
              <Dumbbell className="h-6 w-6 text-zinc-400" aria-hidden="true" />
            </span>
            <h2 className="text-[20px] font-semibold tracking-[-0.015em] text-white">You haven&apos;t added your gym yet</h2>
            <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-zinc-400">
              Create your gym profile, add photos and plans, then submit for review — it takes about 5 minutes.
            </p>
            <Link href="/gym-owner/my-gym">
              <Button className="mt-6">
                <Plus className="mr-2 h-4 w-4" />
                Add your gym
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Status banner */}
          {gym.status === 'REJECTED' && (
            <Card className="mb-5 border-red-500/25">
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" aria-hidden="true" />
                  <div>
                    <h2 className="text-[15px] font-semibold text-white">Changes requested</h2>
                    <p className="mt-1 text-[13.5px] text-zinc-400">
                      {gym.rejectionReason ? <><span className="text-zinc-500">Admin note: </span>{gym.rejectionReason}</> : 'The admin requested changes before approval.'}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link href="/gym-owner/my-gym"><Button variant="outline" size="sm">Edit gym</Button></Link>
                  <Button size="sm" onClick={handleSubmit} disabled={submitting}>
                    {submitting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                    Resubmit
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          {gym.status === 'UNDER_REVIEW' && (
            <div className="mb-5 flex items-center gap-2.5 rounded-[14px] border border-sky-500/25 bg-sky-500/[0.08] p-4 text-[13.5px] text-sky-300" role="status">
              <Clock className="h-4 w-4 shrink-0" />
              Submitted — the admin team is reviewing your gym. We&apos;ll notify you once it&apos;s live.
            </div>
          )}

          {/* Tabs */}
          <div className="surface-premium mb-6 flex gap-1 overflow-x-auto rounded-[16px] p-1.5" role="tablist" aria-label="Dashboard sections">
            {tabs.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`flex min-h-[44px] flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-[11px] px-4 py-2.5 text-[13.5px] font-medium transition-colors duration-150 ${
                  tab === t.id ? 'bg-[#D4FF4F] text-black shadow-[0_4px_16px_rgba(212,255,79,0.25)]' : 'text-zinc-400 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                <t.icon className="h-4 w-4" aria-hidden="true" />
                {t.label}
                {typeof t.badge === 'number' && t.badge > 0 && (
                  <span className={`tabular rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${tab === t.id ? 'bg-black/15 text-black' : 'bg-white/[0.08] text-zinc-300'}`}>
                    {t.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* OVERVIEW */}
          {tab === 'overview' && (
            <div className="grid gap-5 lg:grid-cols-3">
              {/* Hero */}
              <Card className="overflow-hidden lg:col-span-2">
                <div className="relative aspect-[16/8] w-full overflow-hidden bg-gradient-to-br from-zinc-800/60 to-zinc-900">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover} alt={`${gym.name} cover`} className="h-full w-full object-cover" />
                  ) : (
                    <button onClick={() => setTab('photos')} className="flex h-full w-full flex-col items-center justify-center gap-3 text-zinc-500 transition-colors hover:text-zinc-300">
                      <ImageIcon className="h-10 w-10" aria-hidden="true" />
                      <span className="text-[13.5px] font-medium">Add your first photo to make this shine</span>
                    </button>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                  <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-3 p-5 md:p-6">
                    <div>
                      <h2 className="text-balance text-[22px] font-semibold tracking-[-0.015em] text-white md:text-[26px]">{gym.name}</h2>
                      <p className="mt-1 flex items-center gap-1.5 text-[13px] text-zinc-300">
                        <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                        {gym.address}, {gym.city}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/55 px-3 py-1.5 text-[12px] font-medium text-zinc-200 backdrop-blur-md">
                      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[gym.status]}`} aria-hidden="true" />
                      {STATUS_LABEL[gym.status] ?? gym.status}
                    </span>
                  </div>
                  <button
                    onClick={() => setTab('photos')}
                    className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-[10px] border border-white/15 bg-black/55 px-3 py-2 text-[12.5px] font-medium text-white backdrop-blur-md transition-colors hover:bg-black/75"
                  >
                    <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    {photoCount}/10 photos
                  </button>
                </div>
                <CardContent className="space-y-5 p-5 md:p-6">
                  {/* Completion */}
                  <div>
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="font-medium text-zinc-400">Profile completion</span>
                      <span className="tabular font-semibold text-white">{completion}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.07]" role="progressbar" aria-valuenow={completion} aria-valuemin={0} aria-valuemax={100} aria-label="Profile completion">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#b8e62e] to-[#D4FF4F] transition-[width] duration-500" style={{ width: `${completion}%` }} />
                    </div>
                  </div>
                  {/* Meta strip */}
                  <div className="grid gap-2.5 sm:grid-cols-3">
                    <div className="rounded-[12px] border border-white/[0.07] bg-white/[0.03] p-3.5">
                      <p className="flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.1em] text-zinc-500"><Clock className="h-3.5 w-3.5" /> Hours</p>
                      <p className="tabular mt-1.5 text-[13.5px] text-zinc-200">{hasHours ? `${gym.openingTime} – ${gym.closingTime}` : 'Not set'}</p>
                    </div>
                    <div className="rounded-[12px] border border-white/[0.07] bg-white/[0.03] p-3.5">
                      <p className="flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.1em] text-zinc-500"><Phone className="h-3.5 w-3.5" /> Contact</p>
                      <p className="mt-1.5 truncate text-[13.5px] text-zinc-200">{gym.phone ?? gym.email ?? 'Not set'}</p>
                    </div>
                    <div className="rounded-[12px] border border-white/[0.07] bg-white/[0.03] p-3.5">
                      <p className="flex items-center gap-1.5 text-[11.5px] font-semibold uppercase tracking-[0.1em] text-zinc-500"><Sparkles className="h-3.5 w-3.5" /> Facilities</p>
                      <p className="tabular mt-1.5 text-[13.5px] text-zinc-200">{gym.facilities?.length ?? 0} listed</p>
                    </div>
                  </div>
                  {/* Facilities chips */}
                  {gym.facilities && gym.facilities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {gym.facilities.slice(0, 8).map((f) => (
                        <span key={f} className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[12px] text-zinc-300">{f}</span>
                      ))}
                      {gym.facilities.length > 8 && (
                        <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[12px] text-zinc-400">+{gym.facilities.length - 8} more</span>
                      )}
                    </div>
                  )}
                  {(gym.status === 'PENDING' || gym.status === 'REJECTED') && (
                    <div className="flex flex-col gap-3 rounded-[14px] border border-[#D4FF4F]/20 bg-[#D4FF4F]/[0.05] p-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-[13.5px] leading-relaxed text-zinc-300">
                        {gym.status === 'PENDING' ? 'Looking good? Submit for review to go live.' : 'Changes saved? Resubmit for review.'}
                      </p>
                      <Button size="sm" onClick={handleSubmit} disabled={submitting} className="shrink-0">
                        {submitting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                        {gym.status === 'PENDING' ? 'Submit for review' : 'Resubmit'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Side column */}
              <div className="space-y-5">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-[16px]">Next steps</CardTitle>
                    <CardDescription>Get to 100% to get approved faster.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {checklist.map((item) => (
                      <button
                        key={item.label}
                        onClick={() => (item.action === 'my-gym' ? router.push('/gym-owner/my-gym') : setTab(item.action))}
                        className="flex w-full items-center gap-3 rounded-[12px] p-2.5 text-left transition-colors hover:bg-white/[0.05]"
                      >
                        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${item.done ? 'border-[#D4FF4F]/40 bg-[#D4FF4F]/15' : 'border-white/15 bg-white/[0.04]'}`}>
                          {item.done ? <Check className="h-3.5 w-3.5 text-[#D4FF4F]" aria-hidden="true" /> : <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" aria-hidden="true" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block truncate text-[13.5px] font-medium ${item.done ? 'text-zinc-400 line-through decoration-zinc-600' : 'text-zinc-100'}`}>{item.label}</span>
                          <span className="block truncate text-[12px] text-zinc-500">{item.hint}</span>
                        </span>
                      </button>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-[16px]">Quick actions</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-2">
                    <button onClick={() => setTab('photos')} className="flex flex-col items-start gap-2 rounded-[12px] border border-white/[0.08] bg-white/[0.03] p-3.5 text-left transition-colors hover:border-white/20 hover:bg-white/[0.06]">
                      <Upload className="h-4.5 w-4.5 text-[#D4FF4F]" aria-hidden="true" />
                      <span className="text-[13px] font-medium text-zinc-200">Upload photos</span>
                    </button>
                    <button onClick={() => setTab('plans')} className="flex flex-col items-start gap-2 rounded-[12px] border border-white/[0.08] bg-white/[0.03] p-3.5 text-left transition-colors hover:border-white/20 hover:bg-white/[0.06]">
                      <Tag className="h-4.5 w-4.5 text-zinc-300" aria-hidden="true" />
                      <span className="text-[13px] font-medium text-zinc-200">Manage plans</span>
                    </button>
                    <Link href="/gym-owner/my-gym" className="flex flex-col items-start gap-2 rounded-[12px] border border-white/[0.08] bg-white/[0.03] p-3.5 transition-colors hover:border-white/20 hover:bg-white/[0.06]">
                      <Pencil className="h-4.5 w-4.5 text-zinc-300" aria-hidden="true" />
                      <span className="text-[13px] font-medium text-zinc-200">Edit details</span>
                    </Link>
                    <Link href="/gym-owner/my-gym/photos" className="flex flex-col items-start gap-2 rounded-[12px] border border-white/[0.08] bg-white/[0.03] p-3.5 transition-colors hover:border-white/20 hover:bg-white/[0.06]">
                      <Globe className="h-4.5 w-4.5 text-zinc-300" aria-hidden="true" />
                      <span className="text-[13px] font-medium text-zinc-200">Photo studio</span>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* PHOTOS */}
          {tab === 'photos' && (
            <div className="space-y-5">
              {/* Dropzone */}
              {photoCount >= 10 ? (
                <div className="flex flex-col items-center justify-center gap-3 rounded-[20px] border border-dashed border-white/[0.14] bg-white/[0.02] p-10 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-white/[0.07]">
                    <ImageIcon className="h-5 w-5 text-zinc-400" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-[15px] font-semibold text-white">Photo limit reached (10/10)</p>
                    <p className="mt-1 text-[13px] text-zinc-500">Delete a photo below to upload a new one.</p>
                  </div>
                </div>
              ) : (
              <label
                htmlFor="gym-photo-input"
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); void handleFiles(e.dataTransfer.files); }}
                className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[20px] border border-dashed p-10 text-center transition-colors duration-200 ${
                  dragOver ? 'border-[#D4FF4F]/60 bg-[#D4FF4F]/[0.06]' : 'border-white/[0.14] bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.04]'
                }`}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#D4FF4F] shadow-[0_4px_16px_rgba(212,255,79,0.25)]">
                  {uploading ? <Loader2 className="h-5 w-5 animate-spin text-black" /> : <Upload className="h-5 w-5 text-black" aria-hidden="true" />}
                </span>
                <div>
                  <p className="text-[15px] font-semibold text-white">{dragOver ? 'Drop photos to upload' : 'Drag photos here, or click to browse'}</p>
                  <p className="mt-1 text-[13px] text-zinc-500">{photoCount} of 10 used · JPG, PNG, WebP · max 5 MB each · first photo becomes cover</p>
                </div>
                <span aria-hidden="true" className="inline-flex h-10 min-h-[44px] items-center justify-center rounded-[8px] bg-[#D4FF4F] px-4 text-[13px] font-semibold text-[#0A0F00]">
                  {uploading ? 'Uploading…' : 'Choose files'}
                </span>
              </label>
              )}
              <input ref={fileRef} id="gym-photo-input" type="file" accept={ACCEPT} multiple className="sr-only" onChange={(e) => void handleFiles(e.target.files)} />

              {photos.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <ImageIcon className="mx-auto mb-4 h-10 w-10 text-zinc-600" aria-hidden="true" />
                    <p className="text-[16px] font-semibold text-white">No photos yet</p>
                    <p className="mx-auto mt-1.5 max-w-sm text-[13.5px] text-zinc-400">Gyms with 3+ photos get 2× more inquiries. Start with your training floor.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {photos.map((photo) => {
                    const src = photoSrc(photo.url);
                    const busy = busyPhotoId === photo.id;
                    return (
                      <Card key={photo.id} className="card-lift group overflow-hidden">
                        <div className="relative aspect-[4/3] bg-zinc-900">
                          {src && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={src} alt="Gym photo" className="h-full w-full object-cover" loading="lazy" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                          {photo.isPrimary && (
                            <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-[#D4FF4F] px-2.5 py-1 text-[11px] font-bold text-black">
                              <Star className="h-3 w-3" aria-hidden="true" />
                              Cover
                            </span>
                          )}
                        </div>
                        <CardContent className="flex flex-wrap items-center gap-2 p-3.5">
                          {!photo.isPrimary ? (
                            <Button variant="secondary" size="sm" disabled={busy} onClick={() => void handleSetPrimary(photo)} className="flex-1">
                              {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Star className="mr-1.5 h-3.5 w-3.5" />}
                              Make cover
                            </Button>
                          ) : (
                            <span className="flex-1 rounded-[8px] bg-[#D4FF4F]/[0.08] px-3 py-2.5 text-center text-[12.5px] font-medium text-[#D4FF4F]">Cover photo</span>
                          )}
                          {confirmDeleteId === photo.id ? (
                            <span className="flex flex-1 gap-1.5">
                              <Button variant="destructive" size="sm" disabled={busy} onClick={() => void handleDeletePhoto(photo.id)} className="flex-1">
                                Confirm
                              </Button>
                              <Button variant="ghost" size="sm" disabled={busy} onClick={() => setConfirmDeleteId(null)} aria-label="Cancel delete">
                                <X className="h-4 w-4" />
                              </Button>
                            </span>
                          ) : (
                            <Button variant="ghost" size="sm" disabled={busy} onClick={() => setConfirmDeleteId(photo.id)} aria-label="Delete photo" className="text-zinc-500 hover:text-red-300">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* PLANS */}
          {tab === 'plans' && (
            <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
              {/* Form */}
              <Card className={showPlanForm || plans.length === 0 ? '' : 'max-lg:hidden'}>
                <CardHeader>
                  <CardTitle className="text-[16px]">{editingPlan ? 'Edit plan' : 'New plan'}</CardTitle>
                  <CardDescription>{editingPlan ? 'Update pricing or details.' : 'Monthly, quarterly, annual — your call.'}</CardDescription>
                </CardHeader>
                <CardContent>
                  {!showPlanForm && plans.length > 0 ? (
                    <Button onClick={() => setShowPlanForm(true)} className="w-full">
                      <Plus className="mr-2 h-4 w-4" />
                      Add a plan
                    </Button>
                  ) : (
                    <form onSubmit={handleSavePlan} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="plan-name">Plan name</Label>
                        <Input id="plan-name" value={planName} onChange={(e) => setPlanName(e.target.value)} placeholder="Monthly Pro" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="plan-price">Price (₹ or $)</Label>
                          <Input id="plan-price" inputMode="decimal" value={planPrice} onChange={(e) => setPlanPrice(e.target.value)} placeholder="1499" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="plan-duration">Duration (months)</Label>
                          <Input id="plan-duration" inputMode="numeric" value={planDuration} onChange={(e) => setPlanDuration(e.target.value)} placeholder="1" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="plan-desc">Description <span className="font-normal text-zinc-500">(optional)</span></Label>
                        <Textarea id="plan-desc" rows={3} value={planDesc} onChange={(e) => setPlanDesc(e.target.value)} placeholder="Full access, 1 PT session, diet chart…" />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" disabled={savingPlan} className="flex-1">
                          {savingPlan && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {editingPlan ? 'Save changes' : 'Add plan'}
                        </Button>
                        {(editingPlan || plans.length > 0) && (
                          <Button type="button" variant="outline" onClick={resetPlanForm}>Cancel</Button>
                        )}
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>

              {/* List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] text-zinc-500">{plansLoading ? 'Loading…' : `${plans.length} plan${plans.length === 1 ? '' : 's'}`}</p>
                  {plans.length > 0 && !showPlanForm && (
                    <Button size="sm" onClick={() => setShowPlanForm(true)} className="lg:hidden">
                      <Plus className="mr-1.5 h-3.5 w-3.5" /> Add
                    </Button>
                  )}
                </div>
                {plans.length === 0 && !plansLoading ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Tag className="mx-auto mb-4 h-10 w-10 text-zinc-600" aria-hidden="true" />
                      <p className="text-[16px] font-semibold text-white">No plans yet</p>
                      <p className="mx-auto mt-1.5 max-w-sm text-[13.5px] text-zinc-400">Add your first membership plan — gyms with pricing get far more inquiries.</p>
                      <Button className="mt-5" onClick={() => setShowPlanForm(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Add your first plan
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  plans.map((plan, idx) => (
                    <Card key={plan.id} className={`card-lift ${idx === 0 ? 'accent-tint' : ''}`}>
                      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-[15px] font-semibold text-white">{plan.name}</p>
                          {plan.description && <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-zinc-400">{plan.description}</p>}
                          <p className="tabular mt-2 text-[13px] text-zinc-500">
                            <span className="text-[17px] font-semibold text-white">${plan.price}</span>
                            <span className="ml-1.5">/ {plan.duration} mo{plan.duration > 1 ? 's' : ''}</span>
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <Button variant="ghost" size="sm" onClick={() => openEditPlan(plan)} aria-label={`Edit ${plan.name}`}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {confirmPlanDelete === plan.id ? (
                            <>
                              <Button variant="destructive" size="sm" disabled={savingPlan} onClick={() => void handleDeletePlan(plan.id)}>
                                Confirm
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setConfirmPlanDelete(null)} aria-label="Cancel">
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <Button variant="ghost" size="sm" onClick={() => setConfirmPlanDelete(plan.id)} aria-label={`Delete ${plan.name}`} className="text-zinc-500 hover:text-red-300">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {/* SETTINGS */}
          {tab === 'settings' && (
            <div className="grid gap-5 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-[16px]">Profile</CardTitle>
                  <CardDescription>How athletes reach you.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="owner-name">Name</Label>
                      <Input id="owner-name" value={profileName} onChange={(e) => setProfileName(e.target.value)} autoComplete="name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="owner-email">Email</Label>
                      <Input id="owner-email" type="email" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} autoComplete="email" />
                    </div>
                    <Button type="submit" size="sm" disabled={savingProfile}>
                      {savingProfile && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                      Save profile
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-[16px]">Gym contact</CardTitle>
                  <CardDescription>Shown on your public listing.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 rounded-[12px] border border-white/[0.07] bg-white/[0.03] p-3.5">
                    <Phone className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true" />
                    <p className="truncate text-[13.5px] text-zinc-200">{gym.phone ?? 'No phone added'}</p>
                  </div>
                  <div className="flex items-center gap-3 rounded-[12px] border border-white/[0.07] bg-white/[0.03] p-3.5">
                    <Mail className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true" />
                    <p className="truncate text-[13.5px] text-zinc-200">{gym.email ?? 'No email added'}</p>
                  </div>
                  <div className="flex items-center gap-3 rounded-[12px] border border-white/[0.07] bg-white/[0.03] p-3.5">
                    <Clock className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true" />
                    <p className="tabular text-[13.5px] text-zinc-200">{hasHours ? `${gym.openingTime} – ${gym.closingTime}` : 'Hours not set'}</p>
                  </div>
                  <Link href="/gym-owner/my-gym">
                    <Button variant="outline" size="sm" className="mt-1 w-full">
                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
                      Edit gym details
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
