'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Crosshair,
  Dumbbell,
  Search,
  Clock,
  Medal,
  Trophy,
  Waves,
  User,
  Navigation,
  ArrowLeftRight,
  BadgeCheck,
  ShieldCheck,
  Eye,
  PlusSquare,
  SlidersHorizontal,
  Scale,
  Star,
  ArrowRight,
  Store,
  Building2,
} from 'lucide-react';
import { SHOWCASE_GYMS, type ShowcaseGym } from '@/lib/showcase';
import { toggleCompare, useCompareSlugs } from '@/lib/compare-store';

const TRENDING = [
  { label: '24/7 Access', icon: Clock, query: '24/7' },
  { label: 'CrossFit Box', icon: Medal, query: 'CrossFit' },
  { label: 'Strength & Conditioning', icon: Dumbbell, query: 'Strength' },
  { label: 'Olympic Lifting', icon: Trophy, query: 'Olympic' },
  { label: 'Sauna & Steam', icon: Waves, query: 'Sauna' },
  { label: 'Personal Training', icon: User, query: 'Personal Training' },
];

const TABS = ['All', 'High-End Strength', 'Boutique CrossFit', '24/7 Fitness', 'MMA & Combat'] as const;

const GYM_CATEGORIES: Record<string, string[]> = {
  'iron-district': ['High-End Strength'],
  'iron-fortress': ['High-End Strength'],
  'apex-kinetic': ['Boutique CrossFit'],
  'pulse-performance': ['Boutique CrossFit'],
  'volta-247': ['24/7 Fitness'],
  'kuro-athletics': ['24/7 Fitness', 'Boutique CrossFit'],
  'apex-elite': ['MMA & Combat', 'High-End Strength'],
};

const PILLARS = [
  {
    icon: Navigation,
    title: 'Discover Nearby',
    text: 'Find gyms around your location with live transit distance, real-time footfall metrics, and current crowd levels.',
    link: 'Radius Search',
  },
  {
    icon: ArrowLeftRight,
    title: 'Compare Head-to-Head',
    text: 'Stack monthly pricing, equipment brands (Hammer Strength, Rogue, Eleiko), recovery gear, and peak hour capacity.',
    link: 'Side-by-Side Matrix',
  },
  {
    icon: BadgeCheck,
    title: 'Know Before You Join',
    text: 'Explore verified 360° facility walkthroughs, accurate barbell count, calibrated plates, and vetted member feedback.',
    link: 'Certified Audits',
  },
  {
    icon: ShieldCheck,
    title: 'Choose Confidently',
    text: 'Unlock instant 1-day guest passes, negotiate zero registration fees, and claim verified member guarantee coverage.',
    link: 'Instant Passes',
  },
];

function CuratedGymCard({ gym }: { gym: ShowcaseGym }) {
  const compared = useCompareSlugs().includes(gym.slug);
  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-surface-container-high bg-surface-container-low transition-all hover:border-primary-container/50">
      <div className="relative h-64 w-full overflow-hidden bg-surface-container">
        <img
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          src={gym.image}
          alt={gym.name}
          loading="lazy"
        />
        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-surface-container-highest bg-surface-container-lowest/80 px-3 py-1 backdrop-blur-md">
          <span className="h-2 w-2 rounded-full bg-primary-container" aria-hidden="true" />
          <span className="font-label-xs-mono text-[11px] font-bold text-primary">{gym.tag}</span>
        </div>
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full border border-surface-container-highest bg-surface-container-lowest/80 px-2.5 py-1 backdrop-blur-md">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
          <span className="font-label-md text-[12px] font-bold text-primary">{gym.rating.toFixed(1)}</span>
          <span className="font-body-sm text-[12px] text-secondary">({gym.reviews})</span>
        </div>
        <div className="absolute bottom-3 left-3 rounded-md bg-surface-container-lowest/90 px-3 py-1 font-label-xs-mono text-[11px] font-bold text-primary-container backdrop-blur-md">
          {gym.distanceKm.toFixed(1)} KM AWAY • {gym.area}
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-between p-6">
        <div>
          <div className="mb-1 flex items-start justify-between gap-2">
            <h3 className="font-headline-sm text-[18px] font-bold text-primary transition-colors group-hover:text-primary-container">
              {gym.name}
            </h3>
            <span className="whitespace-nowrap font-headline-sm text-[18px] font-bold text-primary">
              {gym.priceLabel}
              <span className="font-body-sm text-[12px] font-normal text-secondary">/mo</span>
            </span>
          </div>
          <p className="mb-4 line-clamp-2 font-body-sm text-[12px] text-on-surface-variant">{gym.description}</p>
          <div className="mb-6 flex flex-wrap gap-1.5">
            {gym.amenities.slice(0, 3).map((a) => (
              <span
                key={a}
                className="rounded border border-surface-container-high bg-surface-container px-2 py-0.5 font-label-xs-mono text-[11px] text-secondary"
              >
                {a}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 border-t border-surface-container-high pt-2">
          <Link
            href={`/gyms/${gym.slug}`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-surface-container-highest bg-surface-container px-4 py-2 font-label-md text-[12px] font-semibold text-primary transition-all hover:bg-surface-container-highest"
          >
            <Eye className="h-3.5 w-3.5" aria-hidden="true" /> View Club
          </Link>
          <button
            onClick={() => toggleCompare(gym.slug)}
            className={`flex items-center justify-center gap-1 rounded-lg border border-transparent px-4 py-2 font-label-md text-[12px] font-semibold transition-all ${
              compared
                ? 'bg-primary-container text-on-primary-fixed'
                : 'bg-surface-container-high text-secondary hover:border-primary-container hover:text-primary-container'
            }`}
          >
            <PlusSquare className="h-3.5 w-3.5" aria-hidden="true" /> {compared ? 'Added' : 'Compare'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [location, setLocation] = useState('Sector 62, Noida');
  const [discipline, setDiscipline] = useState('');
  const [tab, setTab] = useState<(typeof TABS)[number]>('All');

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location.trim()) params.set('location', location.trim());
    if (discipline.trim()) params.set('q', discipline.trim());
    router.push(`/gyms${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const featured =
    tab === 'All'
      ? SHOWCASE_GYMS.filter((g) => ['iron-district', 'apex-kinetic', 'volta-247'].includes(g.slug))
      : SHOWCASE_GYMS.filter((g) => (GYM_CATEGORIES[g.slug] ?? []).includes(tab));

  return (
    <div className="flex w-full flex-col bg-surface pt-20">
      {/* HERO SECTION */}
      <section className="relative w-full overflow-hidden bg-surface-container-lowest">
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[350px] w-[700px] -translate-x-1/2 rounded-full bg-primary-container/10 blur-[130px]" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-surface-container-high/40 blur-[90px]" aria-hidden="true" />
        <div className="relative mx-auto flex max-w-[1400px] flex-col items-center px-6 pb-24 pt-10 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-surface-container-highest bg-surface-container px-3.5 py-1.5 shadow-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary-container" aria-hidden="true" />
            <span className="font-label-md text-[12px] font-semibold uppercase tracking-wide text-secondary">
              The Gym Discovery &amp; Comparison Marketplace
            </span>
          </div>
          <h1 className="mb-4 max-w-4xl text-[38px] font-extrabold leading-[44px] tracking-tight text-primary md:text-display-hero">
            Find the gym that&apos;s{' '}
            <span className="text-primary-container underline decoration-primary-container/30 underline-offset-8">
              right for you.
            </span>
          </h1>
          <p className="mb-10 max-w-2xl font-body-lg text-[16px] text-on-surface-variant">
            Discover gyms around you, compare facilities, pricing, equipment, and verified reviews — all in one place
            with zero hidden fees.
          </p>
          {/* Search & Discovery Widget */}
          <div className="w-full max-w-4xl rounded-xl border border-surface-container-highest/80 bg-surface-container-low p-2 shadow-2xl backdrop-blur-md">
            <form className="grid grid-cols-1 gap-1 md:grid-cols-12" onSubmit={submitSearch}>
              <div className="flex items-center gap-2 rounded-lg border border-transparent bg-surface-container-lowest px-4 py-3 transition-all focus-within:border-primary-container md:col-span-5">
                <MapPin className="h-5 w-5 shrink-0 text-primary-container" aria-hidden="true" />
                <div className="flex w-full min-w-0 flex-col text-left">
                  <span className="font-label-xs-mono text-[11px] font-bold uppercase text-secondary">
                    Location / City
                  </span>
                  <input
                    className="w-full truncate bg-transparent font-body-md text-[14px] text-primary placeholder:text-on-surface-variant/50 focus:outline-none"
                    placeholder="e.g. Sector 62, Noida or Bandra West"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    aria-label="Location or city"
                  />
                </div>
                <button
                  className="text-secondary transition-colors hover:text-primary-container"
                  title="Use current location"
                  type="button"
                >
                  <Crosshair className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-transparent bg-surface-container-lowest px-4 py-3 transition-all focus-within:border-primary-container md:col-span-4">
                <Dumbbell className="h-5 w-5 shrink-0 text-secondary" aria-hidden="true" />
                <div className="flex w-full min-w-0 flex-col text-left">
                  <span className="font-label-xs-mono text-[11px] font-bold uppercase text-secondary">
                    Discipline / Gear
                  </span>
                  <input
                    className="w-full truncate bg-transparent font-body-md text-[14px] text-primary placeholder:text-on-surface-variant/50 focus:outline-none"
                    placeholder="CrossFit, Sauna, Eleiko..."
                    type="text"
                    value={discipline}
                    onChange={(e) => setDiscipline(e.target.value)}
                    aria-label="Discipline or equipment"
                  />
                </div>
              </div>
              <div className="flex items-stretch md:col-span-3">
                <button
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-container px-6 py-3 font-label-lg text-[14px] font-bold text-on-primary-fixed shadow-[0_0_24px_rgba(202,243,0,0.3)] transition-all hover:bg-primary-fixed-dim active:scale-[0.98]"
                  type="submit"
                >
                  <Search className="h-5 w-5" aria-hidden="true" />
                  <span>Explore Gyms</span>
                </button>
              </div>
            </form>
          </div>
          {/* Quick Search Chips */}
          <div className="mt-4 flex max-w-3xl flex-wrap items-center justify-center gap-2">
            <span className="mr-1 font-label-xs-mono text-[11px] font-bold uppercase text-secondary">Trending:</span>
            {TRENDING.map(({ label, icon: Icon, query }) => (
              <Link
                key={label}
                href={`/gyms?q=${encodeURIComponent(query)}`}
                className="flex items-center gap-1.5 rounded-full border border-surface-container-highest bg-surface-container px-3 py-1.5 font-label-md text-[12px] font-semibold text-on-surface transition-all hover:border-primary-container/60 hover:bg-surface-container-high"
              >
                <Icon className="h-3.5 w-3.5 text-primary-container" aria-hidden="true" /> {label}
              </Link>
            ))}
          </div>
          {/* Stats Row */}
          <div className="mt-10 grid w-full max-w-4xl grid-cols-2 gap-6 border-t border-surface-container-high pt-6 md:grid-cols-4">
            {[
              ['2,400+', 'Verified Facilities', false],
              ['120+', 'Cities Covered', false],
              ['95k+', 'Authentic Reviews', false],
              ['100%', 'Transparent Pricing', true],
            ].map(([v, l, accent]) => (
              <div key={l as string} className="flex flex-col items-center">
                <span
                  className={`font-headline-lg text-[28px] font-extrabold tracking-tight ${
                    accent ? 'text-primary-container' : 'text-primary'
                  }`}
                >
                  {v as string}
                </span>
                <span className="font-body-sm text-[12px] text-on-surface-variant">{l as string}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST & VALUE PILLARS */}
      <section className="w-full bg-surface py-20">
        <div className="mx-auto max-w-[1400px] px-6">
          <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <span className="mb-2 block font-label-xs-mono text-[11px] font-bold uppercase tracking-widest text-primary-container">
                Why HeyGym
              </span>
              <h2 className="font-headline-xl text-[30px] font-bold tracking-tight text-primary md:text-[40px]">
                Everything you need to choose your next gym.
              </h2>
            </div>
            <p className="max-w-md font-body-md text-[14px] text-on-surface-variant">
              Say goodbye to predatory locked-in contracts, fake equipment photos, and walk-in sales traps. Discovery
              built with gym-goers in mind.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map(({ icon: Icon, title, text, link }) => (
              <div
                key={title}
                className="group rounded-xl border border-surface-container-high bg-surface-container-low p-6 transition-all hover:-translate-y-1 hover:border-surface-container-highest"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-surface-container-highest text-primary-container transition-colors group-hover:bg-primary-container group-hover:text-on-primary-fixed">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="mb-1 font-headline-sm text-[18px] font-semibold text-primary">{title}</h3>
                <p className="font-body-sm text-[12px] text-on-surface-variant">{text}</p>
                <div className="mt-4 flex items-center gap-1 font-label-md text-[12px] font-semibold text-primary-container">
                  <span>{link}</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED CURATED GYMS SECTION */}
      <section className="w-full border-y border-surface-container-high bg-surface-container-lowest py-20">
        <div className="mx-auto max-w-[1400px] px-6">
          <div className="mb-10 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <span className="mb-2 block font-label-xs-mono text-[11px] font-bold uppercase tracking-widest text-primary-container">
                Curated Selections
              </span>
              <h2 className="font-headline-xl text-[30px] font-bold tracking-tight text-primary md:text-[40px]">
                Popular Gyms Near You
              </h2>
            </div>
            <div className="flex max-w-full items-center gap-1.5 overflow-x-auto rounded-lg bg-surface-container-low p-1">
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`shrink-0 rounded-md px-4 py-2 font-label-md text-[12px] font-semibold transition-all ${
                    tab === t
                      ? 'bg-primary-container font-bold text-on-primary-fixed'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((gym) => (
              <CuratedGymCard key={gym.slug} gym={gym} />
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <Link
              href="/gyms"
              className="inline-flex items-center gap-2 rounded-lg border border-surface-container-highest bg-surface-container-low px-10 py-3 font-label-lg text-[14px] font-semibold text-primary transition-all hover:border-primary-container hover:text-primary-container"
            >
              <span>Explore All 28 Gyms in Sector 62, Noida</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF & HOW IT WORKS SECTION */}
      <section id="how-it-works" className="relative w-full bg-surface py-20">
        <div className="mx-auto max-w-[1400px] px-6">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <span className="mb-2 block font-label-xs-mono text-[11px] font-bold uppercase tracking-widest text-primary-container">
              Simplicity First
            </span>
            <h2 className="mb-1 font-headline-xl text-[30px] font-bold tracking-tight text-primary md:text-[40px]">
              How HeyGym Works
            </h2>
            <p className="font-body-md text-[14px] text-on-surface-variant">
              Finding your ideal workout haven shouldn&apos;t be an exhausting workout in itself.
            </p>
          </div>
          <div className="relative grid grid-cols-1 gap-6 md:grid-cols-3">
            <div
              className="absolute left-[15%] right-[15%] top-1/2 z-0 hidden h-px -translate-y-8 bg-surface-container-highest md:block"
              aria-hidden="true"
            />
            {[
              { n: '1', title: 'Search & Filter', text: 'Enter your neighborhood, specify equipment preferences, choose hours of operation, and budget criteria.', icon: SlidersHorizontal, chip: '30+ Verified Filters Available', active: false },
              { n: '2', title: 'Compare Details', text: 'Analyze facility features side-by-side. Uncover transparent membership costs, peak times, and real customer ratings.', icon: Scale, chip: 'Zero Biased Placement', active: false },
              { n: '3', title: 'Enquire & Visit', text: 'Grab a single day trial pass directly through HeyGym or book a walk-in tour without pesky telemarketing calls.', icon: BadgeCheck, chip: 'Guaranteed Zero Spam', active: true },
            ].map(({ n, title, text, icon: Icon, chip, active }) => (
              <div
                key={n}
                className="relative z-10 flex flex-col items-center rounded-xl border border-surface-container-high bg-surface-container-low p-6 text-center"
              >
                <div
                  className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full font-headline-sm text-[18px] font-bold shadow-md ${
                    active
                      ? 'bg-primary-container font-extrabold text-on-primary-fixed shadow-[0_0_20px_rgba(202,243,0,0.3)]'
                      : 'border border-surface-container-high bg-surface-container-highest text-primary-container'
                  }`}
                >
                  {n}
                </div>
                <h3 className="mb-1 font-headline-sm text-[18px] font-semibold text-primary">{title}</h3>
                <p className="font-body-sm text-[12px] text-on-surface-variant">{text}</p>
                <div className="mt-4 flex w-full items-center gap-2 rounded border border-surface-container-high bg-surface-container p-2 text-left">
                  <Icon className="h-4 w-4 shrink-0 text-primary-container" aria-hidden="true" />
                  <span className="font-label-xs-mono text-[11px] text-secondary">{chip}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GYM OWNER CALLOUT BANNER */}
      <section className="w-full bg-surface-container-lowest py-16">
        <div className="mx-auto max-w-[1400px] px-6">
          <div className="relative overflow-hidden rounded-2xl border border-surface-container-highest bg-gradient-to-r from-surface-container-low via-surface-container to-surface-container-low p-10 shadow-2xl">
            <div className="pointer-events-none absolute bottom-0 right-0 top-0 flex w-1/3 items-center justify-center opacity-10" aria-hidden="true">
              <Building2 className="h-[240px] w-[240px] text-primary-container" strokeWidth={1} />
            </div>
            <div className="relative z-10 flex max-w-2xl flex-col items-start">
              <div className="mb-4 inline-flex items-center gap-2 rounded border border-surface-container-high bg-surface-container-highest px-3 py-1">
                <Store className="h-3.5 w-3.5 text-primary-container" aria-hidden="true" />
                <span className="font-label-xs-mono text-[11px] font-semibold uppercase text-primary">
                  For Gym &amp; Studio Owners
                </span>
              </div>
              <h2 className="mb-2 font-headline-lg text-[28px] font-bold tracking-tight text-primary">
                Own a gym or fitness studio? Get discovered by thousands of active members in your city.
              </h2>
              <p className="mb-6 font-body-md text-[14px] text-on-surface-variant">
                List your club details, showcase premium gear, control your public pricing, and receive high-intent guest
                passes without paying exorbitant intermediary cuts.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/gym-owner/register"
                  className="rounded-lg bg-primary-container px-6 py-3 font-label-lg text-[14px] font-bold text-on-primary-fixed shadow-[0_0_20px_rgba(202,243,0,0.25)] transition-all hover:bg-primary-fixed-dim"
                >
                  List Your Gym Free
                </Link>
                <Link
                  href="/gym-owner/dashboard"
                  className="rounded-lg border border-surface-container-highest bg-surface-container px-4 py-3 font-label-lg text-[14px] font-semibold text-on-surface transition-all hover:border-primary-container hover:text-primary-container"
                >
                  Learn About Club Software
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
