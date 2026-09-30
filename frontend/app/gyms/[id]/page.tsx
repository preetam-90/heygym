'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Heart, MapPin, Star, X } from 'lucide-react';
import { api, friendlyError } from '@/lib/api';
import { photoSrc } from '@/lib/gym-owner';
import { useAuth } from '@/lib/auth-context';
import type { Gym, GymHours, Review } from '@/types';
import { facilityNames, gymPhotos, planDuration } from '@/types';
import { FacilityIcon, DAY_NAMES, formatTime } from '@/lib/facilities';
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/ui-states';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function GymDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const slug = params.id as string;

  const [gym, setGym] = useState<Gym | null>(null);
  const [hours, setHours] = useState<GymHours[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePhoto, setActivePhoto] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const [favBusy, setFavBusy] = useState(false);
  const [favDone, setFavDone] = useState(false);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [enquiryMsg, setEnquiryMsg] = useState('');
  const [enquiryBusy, setEnquiryBusy] = useState(false);
  const [enquiryDone, setEnquiryDone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [rating, setRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewBusy, setReviewBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const g = await api.getGymById(slug);
      setGym(g);
      setHours(g.hours ?? (await api.getGymHours(g.id).catch(() => [])));
      const r = await api.listReviews(g.id, 1, 10).catch(() => null);
      if (r) {
        setReviews(r.reviews);
        setAvgRating(r.averageRating ?? g.averageRating ?? null);
        setReviewCount(r.reviewCount ?? g.reviewCount ?? 0);
      } else {
        setAvgRating(g.averageRating ?? null);
        setReviewCount(g.reviewCount ?? 0);
      }
    } catch (e) {
      setError(friendlyError(e, 'Gym not found.'));
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleFavorite = async () => {
    if (!gym || !user) {
      router.push('/login');
      return;
    }
    setFavBusy(true);
    try {
      if (favDone) {
        await api.removeFavorite(gym.id);
        setFavDone(false);
      } else {
        await api.addFavorite(gym.id);
        setFavDone(true);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      if (msg.includes('Already')) {
        try {
          await api.removeFavorite(gym!.id);
          setFavDone(false);
        } catch {
          setError(msg);
        }
      } else setError(msg);
    } finally {
      setFavBusy(false);
    }
  };

  const sendEnquiry = async () => {
    if (!gym) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (enquiryMsg.trim().length < 10) {
      setFormError('Please write at least 10 characters so the owner can help you.');
      return;
    }
    setEnquiryBusy(true);
    setFormError(null);
    try {
      await api.sendEnquiry(gym.id, enquiryMsg.trim());
      setEnquiryDone(true);
      setEnquiryOpen(false);
      setEnquiryMsg('');
    } catch (e) {
      setFormError(friendlyError(e));
    } finally {
      setEnquiryBusy(false);
    }
  };

  const submitReview = async () => {
    if (!gym || !user) {
      router.push('/login');
      return;
    }
    setReviewBusy(true);
    try {
      const created = await api.createReview(gym.id, {
        rating,
        title: reviewTitle || undefined,
        comment: reviewComment || undefined,
      });
      setReviews((prev) => [created, ...prev]);
      setReviewCount((c) => c + 1);
      setReviewTitle('');
      setReviewComment('');
      const r = await api.listReviews(gym.id, 1, 10).catch(() => null);
      if (r) {
        setReviews(r.reviews);
        setAvgRating(r.averageRating);
        setReviewCount(r.reviewCount);
      }
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setReviewBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-28">
        <LoadingSkeleton lines={5} />
      </div>
    );
  }

  if (error || !gym) {
    return (
      <div className="mx-auto max-w-3xl px-4 pb-20 pt-28">
        <ErrorState message={error ?? 'Gym not found.'} onRetry={load} />
        <Link href="/gyms" className="mt-6 inline-block text-[14px] text-lime-300 hover:underline">
          ← Back to discovery
        </Link>
      </div>
    );
  }

  const photos = gymPhotos(gym);
  const names = facilityNames(gym);
  const plans = (gym.membershipPlans ?? []).filter((p) => p.isActive);
  const today = new Date().getDay();
  const todayHours = hours.find((h) => h.dayOfWeek === today);
  const cover = photos[activePhoto]?.url ?? gym.imageUrl;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-24">
      <Link href="/gyms" className="inline-flex items-center gap-2 text-[13.5px] text-zinc-400 hover:text-zinc-100">
        <ArrowLeft className="h-4 w-4" /> Back to discovery
      </Link>

      {/* Gallery */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900">
        {cover ? (
          <button onClick={() => setLightbox(true)} className="block w-full" aria-label="Open photo gallery">
            <img src={photoSrc(cover) ?? ''} alt={gym.name} className="aspect-[16/8] w-full object-cover" />
          </button>
        ) : (
          <div className="flex aspect-[16/8] items-center justify-center text-zinc-500">No photos yet</div>
        )}
        {photos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto border-t border-white/10 bg-black/40 p-3">
            {photos.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setActivePhoto(i)}
                className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border ${i === activePhoto ? 'border-lime-300' : 'border-white/10'}`}
                aria-label={`Photo ${i + 1}`}
              >
                <img src={photoSrc(p.url) ?? ''} alt={p.altText ?? gym.name} className="h-full w-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Header */}
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-50">{gym.name}</h1>
          <p className="mt-2 flex items-center gap-1.5 text-[14px] text-zinc-400">
            <MapPin className="h-4 w-4 text-zinc-500" />
            {gym.address}, {gym.city}
            {gym.distanceKm != null && <span className="text-zinc-500">· {gym.distanceKm} km away</span>}
          </p>
          <p className="mt-2 flex items-center gap-2 text-[14px]">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <strong className="text-zinc-100">{(avgRating ?? gym.averageRating)?.toFixed(1) ?? 'New'}</strong>
            <span className="text-zinc-500">({reviewCount} reviews)</span>
            {todayHours && (
              <span className="ml-2 rounded-full bg-white/5 px-2.5 py-0.5 text-[12px] text-zinc-300">
                {todayHours.isClosed ? 'Closed today' : `Today ${formatTime(todayHours.openTime)} – ${formatTime(todayHours.closeTime)}`}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={toggleFavorite} disabled={favBusy}>
            <Heart className="mr-2 h-4 w-4" /> {favDone ? 'Saved' : 'Favorite'}
          </Button>
          <Button onClick={() => setEnquiryOpen(true)}>Send enquiry</Button>
        </div>
      </div>
      {enquiryDone && (
        <p className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-[13.5px] text-emerald-200">
          Enquiry sent — the owner will respond and you will see a notification.
        </p>
      )}

      {/* About */}
      {gym.description && (
        <section className="mt-8">
          <h2 className="text-[18px] font-semibold text-zinc-100">About</h2>
          <p className="mt-2 max-w-3xl text-[14.5px] leading-relaxed text-zinc-400">{gym.description}</p>
        </section>
      )}

      {/* Facilities */}
      <section className="mt-8">
        <h2 className="text-[18px] font-semibold text-zinc-100">Facilities</h2>
        {names.length === 0 && (gym.facilitiesDetailed ?? []).length === 0 ? (
          <p className="mt-2 text-[14px] text-zinc-500">No facilities listed yet.</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {(gym.facilitiesDetailed ?? names.map((n) => ({ id: n, name: n, slug: n.toLowerCase().replace(/[^a-z0-9]+/g, '-'), isActive: true }))).map((f) => (
              <span key={f.id} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[13px] text-zinc-200">
                <FacilityIcon slug={f.slug} />
                {f.name}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Plans */}
      <section className="mt-8">
        <h2 className="text-[18px] font-semibold text-zinc-100">Membership plans</h2>
        {plans.length === 0 ? (
          <p className="mt-2 text-[14px] text-zinc-500">No active plans right now — send an enquiry for pricing.</p>
        ) : (
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((p) => (
              <div key={p.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <p className="text-[15px] font-semibold text-zinc-100">{p.name}</p>
                <p className="tabular mt-1 text-2xl font-bold text-zinc-50">₹{p.price.toLocaleString('en-IN')}</p>
                <p className="text-[12.5px] text-zinc-500">{planDuration(p)} days</p>
                {p.description && <p className="mt-2 text-[13px] text-zinc-400">{p.description}</p>}
                {(p.features ?? []).length > 0 && (
                  <ul className="mt-3 space-y-1.5 text-[13px] text-zinc-300">
                    {p.features.map((f) => (
                      <li key={f} className="flex gap-2">✓ {f}</li>
                    ))}
                  </ul>
                )}
                <Button variant="outline" className="mt-4 w-full" onClick={() => setEnquiryOpen(true)}>
                  Enquire
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Hours */}
      <section className="mt-8">
        <h2 className="text-[18px] font-semibold text-zinc-100">Opening hours</h2>
        {hours.length === 0 ? (
          <p className="mt-2 text-[14px] text-zinc-500">Hours not published yet.</p>
        ) : (
          <div className="mt-3 max-w-md divide-y divide-white/5 rounded-2xl border border-white/10">
            {[...hours].sort((a, b) => a.dayOfWeek - b.dayOfWeek).map((h) => (
              <div key={h.id} className={`flex justify-between px-4 py-2.5 text-[13.5px] ${h.dayOfWeek === today ? 'bg-lime-300/[0.06] text-zinc-100' : 'text-zinc-400'}`}>
                <span>{DAY_NAMES[h.dayOfWeek]}</span>
                <span>{h.isClosed ? 'Closed' : `${formatTime(h.openTime)} – ${formatTime(h.closeTime)}`}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Reviews */}
      <section className="mt-8">
        <h2 className="text-[18px] font-semibold text-zinc-100">Reviews</h2>
        <p className="mt-1 text-[13.5px] text-zinc-500">
          {avgRating != null ? `${avgRating.toFixed(1)} average · ` : ''}{reviewCount} reviews
        </p>
        {user ? (
          <div className="mt-4 max-w-xl rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-[13.5px] font-medium text-zinc-200">Write a review</p>
            <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setRating(n)} aria-label={`${n} stars`} className={`rounded p-1 ${n <= rating ? 'text-amber-400' : 'text-zinc-600'}`}>
                  <Star className={`h-5 w-5 ${n <= rating ? 'fill-amber-400' : ''}`} />
                </button>
              ))}
            </div>
            <Input placeholder="Title (optional)" value={reviewTitle} onChange={(e) => setReviewTitle(e.target.value)} className="mt-2" aria-label="Review title" />
            <Textarea placeholder="How was your experience?" value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} className="mt-2" aria-label="Review comment" />
            <Button className="mt-3" disabled={reviewBusy} onClick={submitReview}>
              {reviewBusy ? 'Posting…' : 'Post review'}
            </Button>
          </div>
        ) : (
          <p className="mt-3 text-[13.5px] text-zinc-500">
            <Link href="/login" className="text-lime-300 hover:underline">Log in</Link> to write a review.
          </p>
        )}
        <div className="mt-5 space-y-3">
          {reviews.length === 0 ? (
            <EmptyState title="No reviews yet" hint="Be the first to share your experience." />
          ) : (
            reviews.map((r) => (
              <article key={r.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <p className="flex items-center gap-2 text-[13.5px]">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> <strong>{r.rating}</strong>
                  {r.title && <span className="font-medium text-zinc-100">{r.title}</span>}
                </p>
                {r.comment && <p className="mt-1.5 text-[13.5px] text-zinc-400">{r.comment}</p>}
                <p className="mt-2 text-[12px] text-zinc-600">
                  {r.user?.name ?? 'Member'} · {new Date(r.createdAt).toLocaleDateString()}
                </p>
              </article>
            ))
          )}
        </div>
      </section>

      {/* Enquiry modal */}
      {enquiryOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label="Send enquiry">
          <div className="absolute inset-0 bg-black/70" onClick={() => setEnquiryOpen(false)} />
          <div className="relative w-full max-w-md rounded-t-2xl border border-white/10 bg-zinc-950 p-5 sm:rounded-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-[16px] font-semibold text-zinc-100">Enquire at {gym.name}</h3>
              <button onClick={() => setEnquiryOpen(false)} aria-label="Close" className="rounded-lg p-2 text-zinc-400 hover:bg-white/5">
                <X className="h-5 w-5" />
              </button>
            </div>
            <Textarea
              value={enquiryMsg}
              onChange={(e) => setEnquiryMsg(e.target.value)}
              placeholder="I'm interested in the monthly membership. Can I visit before joining?"
              rows={4}
              aria-label="Enquiry message"
            />
            {formError && <p className="mt-2 text-[13px] text-red-300">{formError}</p>}
            <Button className="mt-4 w-full" disabled={enquiryBusy} onClick={sendEnquiry}>
              {enquiryBusy ? 'Sending…' : 'Send enquiry'}
            </Button>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && cover && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" role="dialog" aria-modal="true" aria-label="Photo gallery" onClick={() => setLightbox(false)}>
          <img src={photoSrc(cover) ?? ''} alt={gym.name} className="max-h-[85vh] max-w-full rounded-xl object-contain" />
        </div>
      )}
    </div>
  );
}
