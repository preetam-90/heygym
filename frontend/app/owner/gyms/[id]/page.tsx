'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api, friendlyError } from '@/lib/api';
import { photoSrc } from '@/lib/gym-owner';
import type { Facility, Gym, GymHours, MembershipPlan } from '@/types';
import { facilityNames, gymPhotos, planDuration } from '@/types';
import { FacilityIcon, DAY_NAMES, formatTime } from '@/lib/facilities';
import { GymStatusBadge } from '@/components/status-badge';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/ui-states';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type Tab = 'overview' | 'facilities' | 'plans' | 'photos' | 'hours';

export default function OwnerGymDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [gym, setGym] = useState<Gym | null>(null);
  const [allFacilities, setAllFacilities] = useState<Facility[]>([]);
  const [hours, setHours] = useState<GymHours[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // overview form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');

  // plans form
  const [planName, setPlanName] = useState('');
  const [planPrice, setPlanPrice] = useState('');
  const [planDays, setPlanDays] = useState('30');
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);

  // hours form
  const [hoursDraft, setHoursDraft] = useState<Array<{ dayOfWeek: number; openTime: string; closeTime: string; isClosed: boolean }>>([]);

  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [g, facs] = await Promise.all([api.getGymById(id), api.getFacilities()]);
      setGym(g);
      setAllFacilities(facs);
      setName(g.name);
      setDescription(g.description ?? '');
      setPhone(g.phone ?? '');
      setCity(g.city);
      setAddress(g.address);
      setHours(g.hours ?? []);
      setPlans((g.membershipPlans ?? []).map((p) => ({ ...p, features: p.features ?? [], isActive: p.isActive ?? true })));
      const h = g.hours ?? [];
      setHoursDraft(
        [0, 1, 2, 3, 4, 5, 6].map((d) => {
          const ex = h.find((x) => x.dayOfWeek === d);
          return { dayOfWeek: d, openTime: ex?.openTime ?? '06:00', closeTime: ex?.closeTime ?? '22:00', isClosed: ex?.isClosed ?? false };
        }),
      );
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveOverview = async () => {
    if (!gym) return;
    setBusy(true);
    try {
      const updated = await api.updateGym(gym.id, { name, description, phone, city, address } as never);
      setGym(updated);
      setNotice('Gym updated.');
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!gym) return;
    setBusy(true);
    try {
      setGym(await api.submitGym(gym.id));
      setNotice('Submitted for admin review.');
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  const removeGym = async () => {
    if (!gym || !confirm(`Delete ${gym.name}? This cannot be undone.`)) return;
    await api.deleteGym(gym.id);
    router.push('/owner/gyms');
  };

  const toggleFacility = async (slug: string) => {
    if (!gym) return;
    const detailed = gym.facilitiesDetailed ?? [];
    const has = detailed.some((f) => f.slug === slug);
    try {
      if (has) {
        const f = detailed.find((x) => x.slug === slug)!;
        await api.removeGymFacility(gym.id, f.id);
      } else {
        await api.addGymFacility(gym.id, slug);
      }
      setGym(await api.getGymById(gym.id));
    } catch (e) {
      setError(friendlyError(e));
    }
  };

  const savePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gym) return;
    const price = Number(planPrice);
    const days = Number(planDays);
    if (!planName.trim() || planName.trim().length < 2) return setError('Plan name must be at least 2 characters.');
    if (!Number.isFinite(price) || price <= 0) return setError('Price must be positive.');
    if (!Number.isInteger(days) || days <= 0) return setError('Duration must be whole days.');
    try {
      if (editingPlan) await api.updateMembershipPlan(gym.id, editingPlan.id, { name: planName.trim(), price, durationDays: days });
      else await api.createMembershipPlan(gym.id, { name: planName.trim(), price, durationDays: days });
      setPlanName('');
      setPlanPrice('');
      setPlanDays('30');
      setEditingPlan(null);
      const g = await api.getGymById(gym.id);
      setGym(g);
      setPlans(g.membershipPlans ?? []);
      setNotice('Plan saved.');
    } catch (err) {
      setError(friendlyError(err));
    }
  };

  const uploadPhoto = async (file: File) => {
    if (!gym) return;
    if (file.size > 5 * 1024 * 1024) return setError('Image must be 5 MB or smaller.');
    setUploading(true);
    try {
      await api.uploadGymPhoto(gym.id, file);
      setGym(await api.getGymById(gym.id));
      setNotice('Photo uploaded.');
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setUploading(false);
    }
  };

  const saveHours = async () => {
    if (!gym) return;
    setBusy(true);
    try {
      const saved = await api.setGymHours(gym.id, hoursDraft);
      setHours(saved);
      setNotice('Hours saved.');
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingSkeleton lines={5} />;
  if (error && !gym) return <ErrorState message={error} onRetry={load} />;
  if (!gym) return <EmptyState title="Gym not found" />;

  const photos = gymPhotos(gym);
  const linked = new Set((gym.facilitiesDetailed ?? []).map((f) => f.slug));

  return (
    <div>
      <Link href="/owner/gyms" className="text-[13.5px] text-zinc-400 hover:text-zinc-100">← All gyms</Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-50">{gym.name}</h1>
          <div className="mt-2 flex items-center gap-2">
            <GymStatusBadge status={gym.status} />
            {gym.status === 'DRAFT' && gym.rejectionReason && (
              <span className="text-[13px] text-red-300">Needs changes: {gym.rejectionReason}</span>
            )}
            {gym.status === 'PENDING_APPROVAL' && <span className="text-[13px] text-sky-300">Waiting for admin review</span>}
            {gym.status === 'APPROVED' && (
              <Link href={`/gyms/${gym.slug || gym.id}`} className="text-[13px] text-lime-300 hover:underline">View public page →</Link>
            )}
            {gym.status === 'SUSPENDED' && <span className="text-[13px] text-red-300">Suspended — contact support</span>}
          </div>
        </div>
        <div className="flex gap-2">
          {gym.status === 'DRAFT' && <Button onClick={submit} disabled={busy}>Submit for approval</Button>}
          <Link href={`/owner/gyms/${gym.id}/edit`}><Button variant="outline">Edit</Button></Link>
          <Button variant="outline" onClick={removeGym}>Delete</Button>
        </div>
      </div>
      {notice && <p className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-[13.5px] text-emerald-200">{notice}</p>}
      {error && <p className="mt-3 text-[13.5px] text-red-300">{error}</p>}

      <div className="mt-5 flex gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02] p-1.5" role="tablist">
        {(['overview', 'facilities', 'plans', 'photos', 'hours'] as Tab[]).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`flex-1 rounded-xl px-4 py-2.5 text-[13.5px] font-medium capitalize ${tab === t ? 'bg-lime-300 text-black' : 'text-zinc-400 hover:text-white'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="mt-4 space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div><label className="mb-1.5 block text-[13px] text-zinc-400">Name</label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><label className="mb-1.5 block text-[13px] text-zinc-400">Description</label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div><label className="mb-1.5 block text-[13px] text-zinc-400">Phone</label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            <div><label className="mb-1.5 block text-[13px] text-zinc-400">City</label><Input value={city} onChange={(e) => setCity(e.target.value)} /></div>
            <div><label className="mb-1.5 block text-[13px] text-zinc-400">Address</label><Input value={address} onChange={(e) => setAddress(e.target.value)} /></div>
          </div>
          <Button onClick={saveOverview} disabled={busy}>{busy ? 'Saving…' : 'Save overview'}</Button>
        </div>
      )}

      {tab === 'facilities' && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <p className="text-[13.5px] text-zinc-400">Linked: {facilityNames(gym).join(', ') || 'none'}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {allFacilities.map((f) => (
              <button key={f.slug} onClick={() => toggleFacility(f.slug)} aria-pressed={linked.has(f.slug)} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] ${linked.has(f.slug) ? 'border-lime-300 bg-lime-300/10 text-lime-200' : 'border-white/10 bg-white/5 text-zinc-300'}`}>
                <FacilityIcon slug={f.slug} />{f.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === 'plans' && (
        <div className="mt-4 space-y-3">
          {plans.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <div>
                <p className="font-semibold text-zinc-100">{p.name} {!p.isActive && <span className="text-[11px] text-zinc-500">(inactive)</span>}</p>
                <p className="tabular text-[13px] text-zinc-400">₹{p.price.toLocaleString('en-IN')} / {planDuration(p)} days</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setEditingPlan(p); setPlanName(p.name); setPlanPrice(String(p.price)); setPlanDays(String(planDuration(p))); }}>Edit</Button>
                <Button variant="outline" onClick={async () => { await api.deleteMembershipPlan(gym.id, p.id); const g = await api.getGymById(gym.id); setGym(g); setPlans(g.membershipPlans ?? []); }}>Delete</Button>
              </div>
            </div>
          ))}
          <form onSubmit={savePlan} className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:grid-cols-4">
            <Input placeholder="Plan name" value={planName} onChange={(e) => setPlanName(e.target.value)} aria-label="Plan name" />
            <Input placeholder="Price ₹" inputMode="numeric" value={planPrice} onChange={(e) => setPlanPrice(e.target.value)} aria-label="Price" />
            <Input placeholder="Days" inputMode="numeric" value={planDays} onChange={(e) => setPlanDays(e.target.value)} aria-label="Duration days" />
            <Button type="submit">{editingPlan ? 'Update plan' : 'Add plan'}</Button>
          </form>
        </div>
      )}

      {tab === 'photos' && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadPhoto(f); e.target.value = ''; }} />
          <Button onClick={() => fileRef.current?.click()} disabled={uploading}>{uploading ? 'Uploading…' : 'Upload photo'}</Button>
          <p className="mt-2 text-[12.5px] text-zinc-500">JPG/PNG/WebP, max 5 MB, up to 10 photos.</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {photos.map((p) => (
              <div key={p.id} className="overflow-hidden rounded-xl border border-white/10">
                <img src={photoSrc(p.url) ?? ''} alt={p.altText ?? gym.name} className="aspect-square w-full object-cover" loading="lazy" />
                <div className="flex items-center justify-between bg-black/40 p-2 text-[12px]">
                  <span className="text-zinc-300">{p.isPrimary ? 'Primary' : `#${p.sortOrder ?? 0}`}</span>
                  <span className="flex gap-1">
                    {!p.isPrimary && <button className="text-lime-300 hover:underline" onClick={async () => { await api.setPrimaryPhoto(gym.id, p.id); setGym(await api.getGymById(gym.id)); }}>Primary</button>}
                    <button className="text-red-300 hover:underline" onClick={async () => { await api.deleteGymPhoto(gym.id, p.id); setGym(await api.getGymById(gym.id)); }}>Delete</button>
                  </span>
                </div>
              </div>
            ))}
          </div>
          {photos.length === 0 && <p className="mt-3 text-[13.5px] text-zinc-500">No photos yet.</p>}
        </div>
      )}

      {tab === 'hours' && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          {hoursDraft.map((h, i) => (
            <div key={h.dayOfWeek} className="flex flex-wrap items-center gap-3 border-b border-white/5 py-2.5 last:border-0">
              <span className="w-28 text-[13.5px] text-zinc-200">{DAY_NAMES[h.dayOfWeek]}</span>
              <label className="flex items-center gap-1.5 text-[13px] text-zinc-400">
                <input type="checkbox" checked={!h.isClosed} onChange={(e) => setHoursDraft((prev) => prev.map((x, xi) => (xi === i ? { ...x, isClosed: !e.target.checked } : x)))} /> Open
              </label>
              {!h.isClosed && (
                <>
                  <Input type="time" value={h.openTime} onChange={(e) => setHoursDraft((prev) => prev.map((x, xi) => (xi === i ? { ...x, openTime: e.target.value } : x)))} className="w-32" aria-label="Opening time" />
                  <span className="text-zinc-500">→</span>
                  <Input type="time" value={h.closeTime} onChange={(e) => setHoursDraft((prev) => prev.map((x, xi) => (xi === i ? { ...x, closeTime: e.target.value } : x)))} className="w-32" aria-label="Closing time" />
                </>
              )}
              {h.isClosed && <span className="text-[13px] text-zinc-500">Closed ({formatTime(hours.find((x) => x.dayOfWeek === h.dayOfWeek)?.openTime)} shown until saved)</span>}
            </div>
          ))}
          <Button className="mt-4" onClick={saveHours} disabled={busy}>{busy ? 'Saving…' : 'Save hours'}</Button>
        </div>
      )}
    </div>
  );
}
