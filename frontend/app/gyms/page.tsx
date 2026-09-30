'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  X,
  MapPin,
  ChevronDown,
  ArrowDownWideNarrow,
  Columns2,
  Check,
  BadgeCheck,
  Wallet,
  Navigation,
  Heart,
  Star,
  ArrowRight,
  Square,
  CheckSquare,
  CheckCircle2,
  Plus,
  Minus,
  Crosshair,
  SlidersHorizontal,
} from 'lucide-react';
import { api } from '@/lib/api';
import { photoSrc } from '@/lib/gym-owner';
import type { Gym } from '@/types';
import { SHOWCASE_GYMS, MAP_BACKDROP, AVATAR_FALLBACK, type ShowcaseGym } from '@/lib/showcase';
import { toggleCompare, clearCompare, useCompareSlugs } from '@/lib/compare-store';

interface DisplayGym {
  key: string;
  slug: string;
  name: string;
  locationLine: string;
  shortArea: string;
  rating: number | null;
  reviews: number | null;
  priceLabel: string;
  priceValue: number | null;
  description: string;
  amenities: string[];
  openLabel: string;
  openDetail: string;
  crowdLabel: string;
  crowdTone: 'emerald' | 'amber';
  image: string;
  mapPrice: string;
  pinTop: string;
  pinLeft: string;
  gymId: string;
  isShowcase: boolean;
}

function toDisplay(gym: Gym, index: number): DisplayGym {
  const match = SHOWCASE_GYMS.find(
    (s) => s.name.toLowerCase() === gym.name.toLowerCase() || s.slug === gym.id,
  );
  const minPrice =
    gym.membershipPlans && gym.membershipPlans.length > 0
      ? Math.min(...gym.membershipPlans.map((p) => p.price))
      : null;
  const cover = photoSrc(gym.imageUrl) ?? match?.image ?? SHOWCASE_GYMS[index % SHOWCASE_GYMS.length].image;
  const amenities =
    [...(gym.facilities ?? []), ...(gym.services ?? [])].slice(0, 5).length > 0
      ? [...(gym.facilities ?? []), ...(gym.services ?? [])].slice(0, 5)
      : (match?.amenities ?? ['Strength Floor', 'Cardio Deck', 'Lockers']);
  return {
    key: gym.id,
    slug: match?.slug ?? gym.id,
    name: gym.name,
    locationLine: `${gym.address}, ${gym.city}`,
    shortArea: gym.city,
    rating: match?.rating ?? null,
    reviews: match?.reviews ?? null,
    priceLabel: minPrice != null ? `₹${minPrice.toLocaleString('en-IN')}` : (match?.priceLabel ?? 'View plans'),
    priceValue: minPrice ?? match?.priceMonthly ?? null,
    description: gym.description ?? match?.description ?? 'Verified training facility with certified equipment and coaching.',
    amenities,
    openLabel:
      gym.openingTime && gym.closingTime
        ? `Open ${gym.openingTime} – ${gym.closingTime}`
        : (match?.openLabel ?? 'Open Today'),
    openDetail: match?.openDetail ?? '',
    crowdLabel: match?.crowdLabel ?? 'Live Updates',
    crowdTone: match?.crowdTone ?? 'emerald',
    image: cover,
    mapPrice: minPrice != null ? `₹${(minPrice / 1000).toFixed(1)}k` : (match?.mapPrice ?? '₹2k'),
    pinTop: match?.pinTop ?? `${22 + ((index * 17) % 50)}%`,
    pinLeft: match?.pinLeft ?? `${25 + ((index * 23) % 45)}%`,
    gymId: gym.id,
    isShowcase: false,
  };
}

function showcaseToDisplay(s: ShowcaseGym): DisplayGym {
  return {
    key: s.slug,
    slug: s.slug,
    name: s.name,
    locationLine: s.distanceLabel,
    shortArea: s.area,
    rating: s.rating,
    reviews: s.reviews,
    priceLabel: s.priceLabel,
    priceValue: s.priceMonthly,
    description: s.description,
    amenities: s.amenities,
    openLabel: s.openLabel,
    openDetail: s.openDetail,
    crowdLabel: s.crowdLabel,
    crowdTone: s.crowdTone,
    image: s.image,
    mapPrice: s.mapPrice,
    pinTop: s.pinTop,
    pinLeft: s.pinLeft,
    gymId: s.slug,
    isShowcase: true,
  };
}

const QUICK_CHIPS = [
  { id: 'price', label: 'Price: Under ₹2,500/mo', kind: 'active' },
  { id: 'rating', label: 'Rating 4.5+ ★', kind: 'active' },
  { id: 'open', label: 'Open Now (Until 11 PM)', kind: 'dot' },
  { id: 'olympic', label: 'Olympic Racks & Plates', kind: 'plain' },
  { id: 'recovery', label: 'AC & Cold Plunge', kind: 'plain' },
  { id: 'parking', label: 'Dedicated Basement Parking', kind: 'plain' },
] as const;

type ChipId = (typeof QUICK_CHIPS)[number]['id'];

function matchesChip(g: DisplayGym, chip: ChipId): boolean {
  const hay = `${g.name} ${g.description} ${g.amenities.join(' ')}`.toLowerCase();
  switch (chip) {
    case 'price':
      return g.priceValue == null || g.priceValue <= 2500;
    case 'rating':
      return g.rating == null || g.rating >= 4.5;
    case 'open':
      return true;
    case 'olympic':
      return /olympic|rack|platform|eleiko|rogue|barbell|strength/.test(hay);
    case 'recovery':
      return /sauna|plunge|steam|recovery|cold/.test(hay);
    case 'parking':
      return /parking|valet/.test(hay);
    default:
      return true;
  }
}

const CHIP_LABEL: Record<ChipId, string> = {
  price: 'Price: Under ₹2,500/mo',
  rating: 'Rating 4.5+',
  open: 'Open Now',
  olympic: 'Olympic Racks',
  recovery: 'Cold Plunge',
  parking: 'Parking',
};

function GymCard({ gym, index }: { gym: DisplayGym; index: number }) {
  const comparedSlugs = useCompareSlugs();
  const compared = comparedSlugs.includes(gym.slug);
  const [fav, setFav] = useState(false);
  return (
    <article
      className={`group relative rounded-xl bg-gradient-to-b from-surface-container via-surface-container to-surface-container-low p-4 shadow-xl transition-all duration-300 hover:-translate-y-0.5 ${
        compared ? 'ring-1 ring-primary-container' : ''
      }`}
    >
      {compared && (
        <div className="absolute -top-2.5 right-6 flex items-center gap-1 rounded-full bg-primary-container px-2.5 py-0.5 font-label-xs-mono text-[11px] font-extrabold uppercase tracking-wider text-on-primary-fixed shadow-md">
          <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> In Comparison
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
        <div className="relative h-52 min-h-[190px] overflow-hidden rounded-lg sm:col-span-5 sm:h-auto">
          <img
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            src={gym.image}
            alt={gym.name}
            loading={index > 1 ? 'lazy' : undefined}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/90 via-transparent to-black/30" aria-hidden="true" />
          <div className="absolute left-2 top-2 flex items-center gap-1.5">
            <span className="flex items-center gap-1 rounded-md bg-surface-container-lowest/80 px-2 py-0.5 font-label-xs-mono text-[11px] font-bold uppercase text-primary backdrop-blur-md">
              <BadgeCheck className="h-3 w-3 text-primary-container" aria-hidden="true" />
              Verified Partner
            </span>
          </div>
          <button
            className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-lowest/70 backdrop-blur-md transition-colors ${
              fav ? 'text-error' : 'text-primary hover:text-error'
            }`}
            title="Save to favorites"
            onClick={() => setFav(!fav)}
            aria-pressed={fav}
          >
            <Heart className={`h-4 w-4 ${fav ? 'fill-error' : ''}`} aria-hidden="true" />
          </button>
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
            {gym.rating != null ? (
              <span className="flex items-center gap-0.5 rounded bg-amber-400/90 px-2 py-0.5 font-label-xs-mono text-[11px] font-black text-surface-container-lowest">
                ★ {gym.rating.toFixed(1)} <span className="font-normal opacity-80">({gym.reviews})</span>
              </span>
            ) : (
              <span className="flex items-center gap-0.5 rounded bg-primary-container/90 px-2 py-0.5 font-label-xs-mono text-[11px] font-black text-on-primary-fixed">
                ★ New on HeyGym
              </span>
            )}
            <span
              className={`flex items-center gap-1 rounded bg-surface-container-lowest/85 px-2 py-0.5 font-label-xs-mono text-[11px] font-bold backdrop-blur-md ${
                gym.crowdTone === 'amber' ? 'text-amber-300' : 'text-emerald-400'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 animate-pulse rounded-full ${
                  gym.crowdTone === 'amber' ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
                aria-hidden="true"
              />
              {gym.crowdLabel}
            </span>
          </div>
        </div>
        <div className="flex flex-col justify-between sm:col-span-7">
          <div>
            <div className="mb-1 flex items-start justify-between gap-1">
              <div>
                <h3 className="font-headline-sm text-[18px] font-bold text-primary transition-colors group-hover:text-primary-container">
                  {gym.name}
                </h3>
                <p className="mt-0.5 flex items-center gap-1 font-body-sm text-[12px] text-on-surface-variant">
                  <Navigation className="h-3.5 w-3.5 text-primary-container" aria-hidden="true" />
                  <span>{gym.locationLine}</span>
                </p>
              </div>
            </div>
            <div className="my-2.5 flex items-center gap-2">
              <span className="flex items-center gap-1 rounded bg-surface-container-high px-2 py-0.5 font-label-xs-mono text-[11px] font-semibold text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                {gym.openLabel}
              </span>
              {gym.openDetail && (
                <span className="font-label-xs-mono text-[11px] text-on-surface-variant">{gym.openDetail}</span>
              )}
            </div>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {gym.amenities.map((a) => (
                <span
                  key={a}
                  className="rounded bg-surface-container-lowest px-2 py-0.5 font-label-xs-mono text-[11px] text-on-surface"
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-1 flex items-center justify-between gap-2 border-t border-surface-container-high/40 pt-2">
            <div>
              <span className="block font-label-xs-mono text-[11px] uppercase text-on-surface-variant">
                Membership Tier
              </span>
              <div className="flex items-baseline gap-1">
                <span className="font-headline-sm text-[18px] font-extrabold tracking-tight text-primary">
                  {gym.priceLabel}
                </span>
                {gym.priceValue != null && (
                  <span className="font-body-sm text-[12px] text-on-surface-variant">/ month</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleCompare(gym.slug)}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-2 font-label-md text-[12px] font-bold transition-all ${
                  compared
                    ? 'bg-primary-container text-on-primary-fixed shadow-sm'
                    : 'bg-surface-container-high text-on-surface hover:bg-surface-variant hover:text-primary'
                }`}
              >
                {compared ? (
                  <CheckSquare className="h-3.5 w-3.5 font-bold" aria-hidden="true" />
                ) : (
                  <Square className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span className="hidden sm:inline">{compared ? 'Selected' : 'Compare'}</span>
              </button>
              <Link
                href={`/gyms/${gym.gymId}`}
                className="flex items-center gap-1 rounded-lg bg-surface-container-highest px-3.5 py-2 font-label-md text-[12px] font-bold text-primary transition-all hover:bg-surface-bright"
              >
                <span>View Details</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function GymsPageInner() {
  const searchParams = useSearchParams();
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('Sector 62, Noida (Within 5 km)');
  const [sort, setSort] = useState('Recommended');
  const [activeChips, setActiveChips] = useState<ChipId[]>(['price', 'rating']);
  const [visible, setVisible] = useState(4);
  const [mapFull, setMapFull] = useState(false);
  const comparedSlugs = useCompareSlugs();

  useEffect(() => {
    setSearch(searchParams.get('q') ?? '');
    const loc = searchParams.get('location');
    if (loc) setLocation(`${loc} (Within 5 km)`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let live = true;
    api
      .getGyms()
      .then((data) => {
        if (live) setGyms(data);
      })
      .catch(() => {
        if (live) setGyms([]);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, []);

  const catalogue: DisplayGym[] = useMemo(() => {
    if (gyms.length > 0) return gyms.map(toDisplay);
    return SHOWCASE_GYMS.slice(0, 4).map(showcaseToDisplay);
  }, [gyms]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = catalogue.filter((g) => {
      const matchesSearch =
        !q ||
        g.name.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        g.amenities.some((a) => a.toLowerCase().includes(q));
      const matchesChips = activeChips.every((c) => matchesChip(g, c));
      return matchesSearch && matchesChips;
    });
    if (sort === 'Price: Low to High') list = [...list].sort((a, b) => (a.priceValue ?? 999999) - (b.priceValue ?? 999999));
    if (sort === 'Rating: High to Low') list = [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    return list;
  }, [catalogue, search, activeChips, sort]);

  const shown = filtered.slice(0, visible);
  const comparedGyms = catalogue.filter((g) => comparedSlugs.includes(g.slug));
  const totalLabel = gyms.length > 0 ? gyms.length : 48;

  const toggleChip = (id: ChipId) =>
    setActiveChips((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));

  return (
    <div className="w-full bg-surface pt-20">
      {/* Sticky Query & Sub-Header Filter Bar */}
      <section className="sticky top-20 z-40 w-full bg-surface-container-lowest/90 shadow-md backdrop-blur-md">
        <div className="mx-auto max-w-[1400px] px-6 py-4">
          <div className="mb-4 flex flex-col justify-between gap-2 md:flex-row md:items-end">
            <div>
              <div className="mb-1 flex items-center gap-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-container/15 px-2.5 py-0.5 font-label-xs-mono text-[11px] font-bold uppercase tracking-wider text-primary-fixed">
                  <span className="h-1.5 w-1.5 animate-ping rounded-full bg-primary-container" aria-hidden="true" />
                  Live Density Radar
                </span>
                <span className="font-label-xs-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
                  Delhi NCR Hub
                </span>
              </div>
              <h1 className="font-headline-lg text-[28px] tracking-tight text-primary">
                Find your next gym in <span className="text-primary-container">Noida &amp; Delhi NCR</span>
              </h1>
              <p className="font-body-md text-[14px] text-on-surface-variant">
                Showing <strong className="font-bold text-primary">{totalLabel}</strong> verified private facilities,
                strength compounds &amp; boutique clubs
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-4">
              <div className="flex items-center gap-2 rounded-lg bg-surface-container px-4 py-1 shadow-sm">
                <BadgeCheck className="h-4 w-4 text-primary-container" aria-hidden="true" />
                <div>
                  <span className="block font-label-xs-mono text-[11px] leading-none text-on-surface-variant">
                    100% INSPECTED
                  </span>
                  <span className="font-label-md text-[12px] font-bold text-primary">Biometric Audited</span>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-surface-container px-4 py-1 shadow-sm">
                <Wallet className="h-4 w-4 text-tertiary-fixed" aria-hidden="true" />
                <div>
                  <span className="block font-label-xs-mono text-[11px] leading-none text-on-surface-variant">
                    ZERO SURCHARGE
                  </span>
                  <span className="font-label-md text-[12px] font-bold text-primary">Direct Rates</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Search & Location Selector Bar */}
          <div className="grid grid-cols-1 gap-1 rounded-xl bg-surface-container p-1.5 shadow-inner lg:grid-cols-12">
            <div className="flex items-center gap-2 rounded-lg bg-surface-container-lowest px-4 py-2 focus-within:ring-1 focus-within:ring-primary-container lg:col-span-6">
              <Search className="h-5 w-5 text-on-surface-variant" aria-hidden="true" />
              <input
                className="w-full bg-transparent font-body-md text-[14px] text-primary placeholder:text-on-surface-variant/60 focus:outline-none"
                placeholder="Search by gym name, equipment (Eleiko, Rogue), steam, turf..."
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setVisible(4);
                }}
                aria-label="Search gyms"
              />
              {search && (
                <button
                  className="rounded p-1 text-on-surface-variant transition-colors hover:text-primary"
                  title="Clear search"
                  onClick={() => setSearch('')}
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
            <div className="flex cursor-pointer items-center justify-between rounded-lg bg-surface-container-lowest px-4 py-2 transition-colors hover:bg-surface-variant/40 lg:col-span-4">
              <div className="flex min-w-0 items-center gap-2">
                <MapPin className="h-[18px] w-[18px] shrink-0 text-primary-container" aria-hidden="true" />
                <div className="min-w-0 text-left">
                  <span className="block truncate font-label-xs-mono text-[11px] uppercase text-on-surface-variant">
                    Search Radius
                  </span>
                  <span className="block truncate font-label-md text-[12px] font-bold text-primary">{location}</span>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-on-surface-variant" aria-hidden="true" />
            </div>
            <div className="flex items-center gap-1 lg:col-span-2">
              <div className="relative flex-1">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  aria-label="Sort gyms"
                  className="w-full cursor-pointer appearance-none truncate rounded-lg bg-surface-container-lowest px-4 py-2 pr-8 font-label-md text-[12px] font-bold text-primary transition-colors hover:bg-surface-variant/40 focus:outline-none [&>option]:bg-surface-container-low"
                >
                  <option>Recommended</option>
                  <option>Price: Low to High</option>
                  <option>Rating: High to Low</option>
                </select>
                <ArrowDownWideNarrow className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-on-surface-variant" aria-hidden="true" />
              </div>
              <button
                className="flex h-full items-center justify-center gap-1 rounded-lg bg-primary-container px-3 font-label-md text-[12px] font-bold text-on-primary-fixed shadow-sm"
                title="Toggle full map"
                onClick={() => setMapFull(!mapFull)}
                aria-pressed={mapFull}
              >
                <Columns2 className="h-[18px] w-[18px]" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Quick Filter Chips & Toggles */}
          <div className="no-scrollbar flex items-center gap-1 overflow-x-auto py-2.5">
            {QUICK_CHIPS.map((chip) => {
              const active = activeChips.includes(chip.id);
              return (
                <button
                  key={chip.id}
                  onClick={() => toggleChip(chip.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 font-label-md text-[12px] font-semibold transition-all ${
                    active
                      ? 'bg-primary-container font-bold text-on-primary-fixed shadow-sm'
                      : 'bg-surface-container-high text-on-surface hover:bg-surface-bright hover:text-primary'
                  }`}
                >
                  {chip.kind === 'dot' && !active && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                  )}
                  <span>{chip.label}</span>
                  {active && <Check className="h-3.5 w-3.5 font-bold" aria-hidden="true" />}
                </button>
              );
            })}
            <button className="flex shrink-0 items-center gap-1 rounded-full bg-surface-container-high px-3 py-1.5 font-label-md text-[12px] text-on-surface transition-all hover:bg-surface-bright hover:text-primary">
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
              <span>All Filters (14)</span>
            </button>
          </div>
          {/* Active Filter String Line */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="font-label-xs-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
              Active Criteria:
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-surface-container-high px-2 py-0.5 font-label-xs-mono text-[11px] text-primary">
              Sector 62 (≤ 5km)
            </span>
            {activeChips.map((c) => (
              <span
                key={c}
                className="inline-flex items-center gap-1 rounded bg-surface-container-high px-2 py-0.5 font-label-xs-mono text-[11px] text-primary"
              >
                {CHIP_LABEL[c]}
                <button
                  className="text-on-surface-variant transition-colors hover:text-error"
                  onClick={() => toggleChip(c)}
                  aria-label={`Remove ${CHIP_LABEL[c]} filter`}
                >
                  ✕
                </button>
              </span>
            ))}
            {activeChips.length > 0 && (
              <button
                className="ml-2 font-label-xs-mono text-[11px] uppercase text-primary-container hover:underline"
                onClick={() => setActiveChips([])}
              >
                Clear all tags
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Hybrid Master Layout */}
      <div className="relative mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-6 py-6 lg:flex-row">
        {/* LEFT COLUMN */}
        <div className={`flex w-full flex-col gap-6 pb-28 ${mapFull ? 'lg:hidden' : 'lg:w-[58%] xl:w-[60%]'}`}>
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2">
              <span className="font-headline-sm text-[18px] font-bold text-primary">Top Verified Facilities</span>
              <span className="rounded bg-surface-container-high px-2 py-0.5 font-label-xs-mono text-[11px] text-on-surface-variant">
                {filtered.length} MATCHES
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-body-sm text-[12px] text-on-surface-variant">Live crowd updates enabled</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col gap-6" role="status" aria-label="Loading gyms">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl bg-surface-container p-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
                    <div className="h-52 min-h-[190px] animate-pulse rounded-lg bg-surface-container-high sm:col-span-5" />
                    <div className="space-y-3 sm:col-span-7">
                      <div className="h-5 w-2/3 animate-pulse rounded bg-surface-container-high" />
                      <div className="h-4 w-1/2 animate-pulse rounded bg-surface-container-high/60" />
                      <div className="h-4 w-full animate-pulse rounded bg-surface-container-high/40" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl bg-surface-container p-6 py-16 text-center">
              <p className="text-[19px] font-semibold text-white">No gyms found</p>
              <p className="mt-2 text-[14px] text-zinc-400">Try a different search or clear filters.</p>
              <button
                onClick={() => {
                  setSearch('');
                  setActiveChips([]);
                }}
                className="mt-4 text-[14px] font-semibold text-primary-container hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            shown.map((gym, i) => <GymCard key={gym.key} gym={gym} index={i} />)
          )}

          {/* Pagination */}
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl bg-surface-container p-6 text-center shadow-md">
            <span className="font-label-md text-[12px] font-semibold text-on-surface-variant">
              Displaying {shown.length} of {filtered.length} verified facilities
            </span>
            <div className="h-1.5 w-48 overflow-hidden rounded-full bg-surface-container-highest">
              <div
                className="h-full bg-primary-container"
                style={{ width: `${filtered.length ? Math.min(100, (shown.length / filtered.length) * 100) : 0}%` }}
              />
            </div>
            {visible < filtered.length && (
              <button
                onClick={() => setVisible((v) => v + 4)}
                className="rounded-lg bg-surface-container-high px-6 py-2.5 font-label-lg text-[14px] font-bold text-primary shadow-sm transition-all hover:bg-surface-bright"
              >
                Load 12 More Facilities
              </button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN — Map */}
        <div
          className={`relative flex h-[560px] w-full flex-col overflow-hidden rounded-2xl bg-surface-container-lowest shadow-2xl lg:sticky lg:top-48 lg:h-[calc(100vh-190px)] ${
            mapFull ? 'lg:w-full' : 'lg:w-[42%] xl:w-[40%]'
          }`}
        >
          <div
            className="pointer-events-none absolute inset-0 h-full w-full bg-cover bg-center opacity-30 contrast-125 brightness-75"
            style={{ backgroundImage: `url('${MAP_BACKDROP}')` }}
          />
          <div className="pointer-events-none absolute inset-0 z-0 bg-[#0e1114]/90">
            <svg className="h-full w-full opacity-40" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern height="40" id="grid" patternUnits="userSpaceOnUse" width="40">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#252a33" strokeWidth="0.75" />
                </pattern>
              </defs>
              <rect fill="url(#grid)" height="100%" width="100%" />
              <path d="M -50 180 Q 200 240 500 120 T 900 280" fill="none" stroke="#374151" strokeWidth="4" />
              <path d="M 220 -50 L 290 800" fill="none" stroke="#374151" strokeWidth="3" />
              <path d="M -50 480 Q 300 420 800 620" fill="none" stroke="#2c333f" strokeWidth="3" />
              <path d="M 450 -50 Q 420 320 600 700" fill="none" stroke="#2c333f" strokeWidth="2" />
              <circle cx="280" cy="310" fill="rgba(202,243,0,0.03)" r="190" stroke="rgba(202,243,0,0.2)" strokeDasharray="6,6" strokeWidth="1.5" />
            </svg>
          </div>
          <div className="absolute left-4 right-4 top-4 z-20 flex items-center justify-between">
            <div className="flex items-center gap-2 rounded-lg bg-surface-container-lowest/90 px-3 py-1.5 shadow-lg backdrop-blur-md">
              <span className="h-2 w-2 animate-ping rounded-full bg-primary-container" aria-hidden="true" />
              <span className="font-label-xs-mono text-[11px] font-bold uppercase tracking-wider text-primary">
                Sector 62 Cluster
              </span>
              <span className="font-label-xs-mono text-[11px] text-on-surface-variant">• 5km range</span>
            </div>
            <div className="flex items-center gap-1.5">
              {[
                { icon: Plus, label: 'Zoom in' },
                { icon: Minus, label: 'Zoom out' },
                { icon: Crosshair, label: 'Recenter my location' },
              ].map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-container-lowest/90 text-primary shadow-lg backdrop-blur-md transition-colors hover:text-primary-container"
                  title={label}
                >
                  <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>

          {shown.slice(0, 4).map((gym, i) => (
            <div
              key={gym.key}
              className="absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              style={{ top: gym.pinTop, left: gym.pinLeft }}
            >
              <div className="relative flex flex-col items-center">
                {i === 0 && <div className="absolute -inset-2 animate-ping rounded-full bg-primary-container/20" aria-hidden="true" />}
                <div
                  className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 font-label-md text-[12px] font-bold shadow-lg transition-colors hover:bg-primary-container hover:text-on-primary-fixed ${
                    i === 0
                      ? 'scale-110 bg-primary-container text-on-primary-fixed shadow-[0_0_18px_rgba(202,243,0,0.5)]'
                      : 'bg-surface-container-lowest text-primary-fixed'
                  }`}
                >
                  {gym.mapPrice}
                </div>
                <div
                  className={`-mt-1 h-2 w-2 rotate-45 shadow-md ${i === 0 ? 'h-2.5 w-2.5 bg-primary-container' : 'bg-surface-container-lowest'}`}
                  aria-hidden="true"
                />
              </div>
            </div>
          ))}
          <div className="absolute left-[58%] top-[75%] z-10 -translate-x-1/2 -translate-y-1/2 opacity-75">
            <div className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-primary-fixed bg-surface-container-high">
              <div className="h-1.5 w-1.5 rounded-full bg-primary-container" />
            </div>
          </div>
          <div className="absolute left-[22%] top-[38%] z-10 -translate-x-1/2 -translate-y-1/2 opacity-75">
            <div className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-primary-fixed bg-surface-container-high">
              <div className="h-1.5 w-1.5 rounded-full bg-primary-container" />
            </div>
          </div>

          {shown[0] && (
            <div className="z-30 m-4 mt-auto rounded-xl bg-surface-container-lowest/95 p-4 shadow-2xl ring-1 ring-primary-container/30 backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg">
                  <img className="h-full w-full object-cover" src={shown[0].image} alt={shown[0].name} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-label-xs-mono text-[11px] font-bold uppercase tracking-wider text-primary-container">
                      Featured on Map
                    </span>
                    {shown[0].rating != null && (
                      <span className="font-label-xs-mono text-[11px] font-bold text-amber-300">
                        ★ {shown[0].rating.toFixed(1)} ({shown[0].reviews})
                      </span>
                    )}
                  </div>
                  <h4 className="truncate font-label-lg text-[14px] font-bold text-primary">{shown[0].name}</h4>
                  <p className="truncate font-body-sm text-[12px] text-on-surface-variant">
                    {shown[0].shortArea} • {shown[0].openLabel}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="block font-headline-sm text-[18px] font-extrabold leading-tight text-primary">
                    {shown[0].priceLabel}
                  </span>
                  {shown[0].priceValue != null && (
                    <span className="block font-label-xs-mono text-[11px] text-on-surface-variant">/ month</span>
                  )}
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-surface-container-high/40 pt-1">
                <span className="flex items-center gap-1 font-label-xs-mono text-[11px] text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                  Pass available today
                </span>
                <Link
                  href={`/gyms/${shown[0].gymId}`}
                  className="inline-flex items-center gap-0.5 font-label-md text-[12px] font-bold text-primary-container hover:underline"
                >
                  Explore club <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compare Tray */}
      {comparedGyms.length > 0 && (
        <div className="fixed bottom-6 left-1/2 z-50 w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2 transition-all duration-300">
          <div className="flex flex-col items-center justify-between gap-2 rounded-2xl bg-surface-container-lowest/95 p-3 shadow-[0_12px_40px_rgba(0,0,0,0.85)] ring-1 ring-primary-container/40 backdrop-blur-2xl sm:flex-row sm:px-6 sm:py-2">
            <div className="flex w-full items-center gap-4 sm:w-auto">
              <div className="flex shrink-0 items-center -space-x-3">
                {comparedGyms.slice(0, 2).map((g) => (
                  <div key={g.key} className="h-10 w-10 overflow-hidden rounded-full bg-surface-container-high shadow-md ring-2 ring-surface-container-lowest">
                    <img className="h-full w-full object-cover" src={g.image} alt={g.name} />
                  </div>
                ))}
                {comparedGyms.length > 2 ? (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high font-label-md text-[12px] font-bold text-primary-container shadow-md ring-2 ring-surface-container-lowest">
                    +{comparedGyms.length - 2}
                  </div>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high font-label-md text-[12px] font-bold text-primary-container shadow-md ring-2 ring-surface-container-lowest">
                    <img className="h-full w-full rounded-full object-cover" src={AVATAR_FALLBACK} alt="Add gym" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-label-md text-[12px] font-bold text-primary">
                    {comparedGyms.length} Gym{comparedGyms.length > 1 ? 's' : ''} Selected for Matrix
                  </span>
                  <span className="rounded bg-primary-container px-1.5 py-0.5 font-label-xs-mono text-[11px] font-black text-on-primary-fixed">
                    {comparedGyms.length}/4
                  </span>
                </div>
                <p className="truncate font-body-sm text-[12px] text-on-surface-variant">
                  {comparedGyms.map((g) => g.name.split(' ').slice(0, 2).join(' ')).join(' vs ')}
                </p>
              </div>
            </div>
            <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
              <button
                onClick={clearCompare}
                className="px-4 py-2 font-label-md text-[12px] font-semibold text-on-surface-variant transition-colors hover:text-primary"
              >
                Clear
              </button>
              <Link
                href="/compare"
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary-container px-6 py-2.5 font-label-lg text-[14px] font-bold text-on-primary-fixed shadow-[0_0_24px_rgba(202,243,0,0.35)] transition-all hover:bg-primary-fixed-dim sm:flex-none"
              >
                <span>Compare Head-to-Head</span>
                <ArrowRight className="h-[18px] w-[18px]" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GymsPage() {
  return (
    <Suspense fallback={<div className="w-full bg-surface pt-20" />}>
      <GymsPageInner />
    </Suspense>
  );
}
