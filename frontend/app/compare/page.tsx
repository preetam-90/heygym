'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  PlusCircle,
  Download,
  Share2,
  BadgeCheck,
  Star,
  MapPin,
  X,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Search,
  SlidersHorizontal,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { COMPARE_GYMS, MAP_BACKDROP } from '@/lib/showcase';
import { useCompareSlugs } from '@/lib/compare-store';

const HIGHLIGHTS = ['All Categories', 'Pricing & Plans', 'Free Weights & Gear', 'Recovery & Sauna', 'Culture & Crowd'];

function Stars() {
  return <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />;
}

export default function ComparePage() {
  const storeSlugs = useCompareSlugs();
  const [removed, setRemoved] = useState<string[]>([]);
  const [highlight, setHighlight] = useState(HIGHLIGHTS[0]);
  const [toast, setToast] = useState<string | null>(null);

  const columns = useMemo(() => {
    const stored = storeSlugs
      .map((s) => COMPARE_GYMS.find((g) => g.slug === s))
      .filter(Boolean) as typeof COMPARE_GYMS;
    const base = stored.length > 0 ? stored : COMPARE_GYMS;
    const merged = [...base];
    for (const g of COMPARE_GYMS) {
      if (merged.length >= 3) break;
      if (!merged.some((m) => m.slug === g.slug)) merged.push(g);
    }
    return merged.filter((g) => !removed.includes(g.slug)).slice(0, 3);
  }, [storeSlugs, removed]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('Sharable comparison URL copied to your clipboard!');
    } catch {
      showToast(`Sharable link ready: ${window.location.href}`);
    }
  };

  const th = 'w-[25%] p-4 bg-surface-container-low';
  const labelCell =
    'p-4 font-label-lg text-[14px] font-semibold text-on-surface sticky left-0 z-10 bg-surface-container-lowest';
  const bodyCell = 'p-4 font-body-md text-[14px] text-on-surface';
  const sectionRow = 'bg-surface-container-high/60';
  const sectionCell =
    'py-3 px-4 font-label-xs-mono text-[11px] font-bold uppercase tracking-widest text-primary-container';
  const altRow = 'bg-surface-container-low/30';

  return (
    <div className="w-full bg-surface pt-20">
      <div className="relative w-full overflow-hidden">
        <div className="pointer-events-none absolute -top-40 right-1/4 h-96 w-96 rounded-full bg-primary-container/10 blur-[140px]" aria-hidden="true" />
        <div className="pointer-events-none absolute -left-32 top-1/2 h-80 w-80 rounded-full bg-surface-variant/40 blur-[120px]" aria-hidden="true" />
        <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-6 py-6">
          {/* Top Section */}
          <section className="flex flex-col justify-between gap-4 pt-1 lg:flex-row lg:items-end">
            <div className="max-w-3xl space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-high px-2.5 py-1 font-label-xs-mono text-[11px] uppercase tracking-wider text-primary-container">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary-container" aria-hidden="true" />
                  Live Benchmark Matrix
                </span>
                <span className="font-body-sm text-[12px] text-secondary">Updated 12 mins ago</span>
              </div>
              <h1 className="font-headline-xl text-[30px] font-extrabold tracking-tight text-primary md:text-[40px]">
                Compare Gyms <span className="text-primary-container">Side-by-Side</span>
              </h1>
              <p className="font-body-lg text-[16px] text-on-surface-variant">
                Side-by-side comparison of {columns.length} shortlisted fitness centers in Sector 62, Noida. No
                guesswork, no hidden pricing.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Link
                href="/gyms"
                className="inline-flex items-center gap-2 rounded-lg bg-surface-container-high px-4 py-2.5 font-label-lg text-[14px] font-semibold text-on-surface shadow-sm transition-all hover:bg-surface-bright"
              >
                <PlusCircle className="h-[18px] w-[18px] text-primary-container" aria-hidden="true" />
                <span>+ Add another gym ({columns.length}/4)</span>
              </Link>
              <button
                onClick={() => showToast('Comparison summary PDF generated! Includes verified fees and amenity audit.')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-surface-container px-4 py-2.5 font-label-lg text-[14px] font-semibold text-on-surface-variant shadow-sm transition-colors hover:bg-surface-container-high hover:text-on-surface"
              >
                <Download className="h-[18px] w-[18px]" aria-hidden="true" />
                <span>Export summary</span>
              </button>
              <button
                onClick={share}
                className="inline-flex items-center gap-1.5 rounded-lg bg-surface-container px-4 py-2.5 font-label-lg text-[14px] font-semibold text-on-surface-variant shadow-sm transition-colors hover:bg-surface-container-high hover:text-on-surface"
              >
                <Share2 className="h-[18px] w-[18px]" aria-hidden="true" />
                <span>Share comparison link</span>
              </button>
            </div>
          </section>

          {/* Quick Toggles */}
          <section className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface-container-low px-4 py-2 shadow-sm">
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              <span className="whitespace-nowrap font-label-md text-[12px] uppercase tracking-wider text-secondary">
                Highlight:
              </span>
              {HIGHLIGHTS.map((h) => (
                <button
                  key={h}
                  onClick={() => setHighlight(h)}
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 font-label-md text-[12px] transition-all ${
                    highlight === h
                      ? 'bg-primary-container font-bold text-on-primary-fixed shadow-sm'
                      : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
            <div className="flex shrink-0 items-center gap-2 font-body-sm text-[12px] text-on-surface-variant">
              <BadgeCheck className="h-4 w-4 text-tertiary-fixed" aria-hidden="true" />
              <span>Verified by HeyGym On-Site Inspectors</span>
            </div>
          </section>

          {/* Matrix */}
          <div className="w-full overflow-x-auto rounded-xl bg-surface-container-lowest pb-4 shadow-xl">
            <table className="w-full min-w-[980px] border-collapse text-left">
              <thead>
                <tr className="bg-surface-container-low align-top">
                  <th className="sticky left-0 z-20 w-[25%] bg-surface-container-low p-4 backdrop-blur-md">
                    <div className="flex h-full flex-col justify-between pt-2">
                      <div>
                        <span className="mb-1 block font-label-xs-mono text-[11px] uppercase tracking-wider text-primary-container">
                          Sector 62 Cluster
                        </span>
                        <h2 className="font-headline-md text-[22px] font-bold text-primary">Parameters &amp; Spec Check</h2>
                        <p className="mt-1 font-body-sm text-[12px] text-on-surface-variant">
                          Comparing verified equipment weight stacks, recovery infrastructure, and real crowd counts.
                        </p>
                      </div>
                      <div className="mt-4 rounded-lg bg-surface-container-high p-2">
                        <div className="flex items-center justify-between font-body-sm text-[12px] text-secondary">
                          <span>Comparison slot</span>
                          <span className="font-label-md text-[12px] text-primary">{columns.length} of 4 filled</span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-container-highest">
                          <div className="h-full rounded-full bg-primary-container" style={{ width: `${(columns.length / 4) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  </th>
                  {columns.map((gym) => (
                    <th key={gym.slug} className={th}>
                      <div
                        className={`relative flex h-full flex-col rounded-xl bg-surface-container p-4 shadow-sm transition-all hover:bg-surface-bright/40 ${
                          gym.featured ? 'shadow-[0_0_24px_rgba(202,243,0,0.08)] ring-1 ring-primary-container/40' : ''
                        }`}
                      >
                        {gym.featuredPill && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary-container px-3 py-0.5 font-label-xs-mono text-[11px] font-bold uppercase tracking-wider text-on-primary-fixed shadow-md">
                            {gym.featuredPill}
                          </div>
                        )}
                        <div className="relative mb-2 mt-1 h-36 w-full overflow-hidden rounded-lg bg-surface-container-highest">
                          <img className="h-full w-full object-cover" src={gym.image} alt={gym.name} />
                          <div className="absolute inset-0 bg-gradient-to-t from-surface-container via-transparent to-transparent" />
                          <span
                            className={`absolute left-2 top-2 rounded-md bg-surface-container-lowest/80 px-2 py-0.5 font-label-xs-mono text-[11px] uppercase tracking-wider backdrop-blur-md ${
                              gym.focusTone === 'lime' ? 'text-primary-container' : gym.focusTone === 'mint' ? 'text-tertiary-fixed' : 'text-secondary'
                            }`}
                          >
                            {gym.focusTag}
                          </span>
                          <button
                            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-surface-container-lowest/80 text-secondary backdrop-blur-md transition-colors hover:text-error"
                            title={`Remove ${gym.name}`}
                            onClick={() => setRemoved((r) => [...r, gym.slug])}
                          >
                            <X className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                        <div className="mb-1 flex items-center gap-1.5">
                          <Stars />
                          <span className="font-label-lg text-[14px] font-bold text-primary">{gym.rating}</span>
                          <span className="font-body-sm text-[12px] text-secondary">{gym.reviewsLabel}</span>
                        </div>
                        <h3 className="truncate font-headline-sm text-[18px] font-bold text-primary">{gym.name}</h3>
                        <p className="mt-0.5 flex items-center gap-1 font-body-sm text-[12px] text-on-surface-variant">
                          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                          {gym.area}
                        </p>
                        <div className="mt-2 flex items-baseline gap-1 border-t border-surface-container-high/40 pt-2">
                          <span className="font-headline-md text-[22px] font-extrabold text-primary-container">{gym.monthly}</span>
                          <span className="font-body-sm text-[12px] text-secondary">/ month</span>
                        </div>
                        <Link
                          href={`/gyms/${gym.slug}`}
                          className={`mt-2 w-full rounded-lg px-4 py-2.5 text-center font-label-lg text-[14px] font-bold transition-all ${
                            gym.slug === 'iron-fortress'
                              ? 'bg-primary-container text-on-primary-fixed shadow-[0_0_16px_rgba(202,243,0,0.2)] hover:bg-primary-fixed-dim'
                              : 'bg-surface-container-highest text-primary hover:bg-surface-bright'
                          }`}
                        >
                          {gym.cta}
                        </Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className={sectionRow}>
                  <td className={sectionCell} colSpan={columns.length + 1}>01 • Membership &amp; Commitment Pricing</td>
                </tr>
                <tr className="transition-colors hover:bg-surface-container-low">
                  <td className={labelCell}>Monthly Plan</td>
                  <td className="p-4 font-headline-sm text-[18px] font-bold text-primary">₹2,499 <span className="font-body-sm text-[12px] font-normal text-secondary">/mo</span></td>
                  <td className="p-4 font-headline-sm text-[18px] font-bold text-primary">₹3,200 <span className="font-body-sm text-[12px] font-normal text-secondary">/mo</span></td>
                  <td className="p-4 font-headline-sm text-[18px] font-bold text-primary">₹1,699 <span className="font-body-sm text-[12px] font-normal text-secondary">/mo (Budget pick)</span></td>
                </tr>
                <tr className={`transition-colors hover:bg-surface-container-low ${altRow}`}>
                  <td className={labelCell}>Quarterly Plan (3 Mo)</td>
                  <td className={bodyCell}>₹6,500 <span className="ml-1.5 font-label-xs-mono text-[11px] text-tertiary-fixed">Save ₹997</span></td>
                  <td className={bodyCell}>₹8,500 <span className="ml-1.5 font-label-xs-mono text-[11px] text-tertiary-fixed">Save ₹1,100</span></td>
                  <td className={bodyCell}>₹4,500 <span className="ml-1.5 font-label-xs-mono text-[11px] text-tertiary-fixed">Save ₹597</span></td>
                </tr>
                <tr className="transition-colors hover:bg-surface-container-low">
                  <td className={labelCell}>Annual Membership (12 Mo)</td>
                  <td className={bodyCell}>₹19,999 <span className="block font-body-sm text-[12px] text-secondary">(₹1,666/mo effective)</span></td>
                  <td className={bodyCell}>₹26,999 <span className="block font-body-sm text-[12px] text-secondary">(₹2,249/mo effective)</span></td>
                  <td className={bodyCell}>₹14,999 <span className="block font-body-sm text-[12px] text-secondary">(₹1,249/mo effective)</span></td>
                </tr>
                <tr className={`transition-colors hover:bg-surface-container-low ${altRow}`}>
                  <td className={labelCell}>Registration / Joining Fee</td>
                  <td className={`${bodyCell} flex items-center gap-1.5`}><span className="h-2 w-2 rounded-full bg-tertiary-fixed" />₹0 (Waived via HeyGym)</td>
                  <td className={`${bodyCell} flex items-center gap-1.5`}><span className="h-2 w-2 rounded-full bg-secondary" />₹1,500 (Includes welcome kit)</td>
                  <td className={`${bodyCell} flex items-center gap-1.5`}><span className="h-2 w-2 rounded-full bg-tertiary-fixed" />₹0 (Zero onboarding fee)</td>
                </tr>
                <tr className="transition-colors hover:bg-surface-container-low">
                  <td className={labelCell}>Free Trial Day Pass</td>
                  <td className="p-4"><span className="inline-flex items-center gap-1 rounded-md bg-surface-container px-2.5 py-1 font-label-md text-[12px] text-tertiary-fixed"><CheckCircle2 className="h-4 w-4" /> 1 Free Workout Pass</span></td>
                  <td className="p-4"><span className="inline-flex items-center gap-1 rounded-md bg-surface-container px-2.5 py-1 font-label-md text-[12px] text-primary-container"><CheckCircle2 className="h-4 w-4" /> 2-Day Complete Access + Sauna</span></td>
                  <td className="p-4"><span className="inline-flex items-center gap-1 rounded-md bg-surface-container px-2.5 py-1 font-label-md text-[12px] text-secondary"><XCircle className="h-4 w-4" /> Paid Day Pass (₹299)</span></td>
                </tr>

                <tr className={sectionRow}>
                  <td className={sectionCell} colSpan={columns.length + 1}>02 • Facilities, Gear &amp; Architecture</td>
                </tr>
                <tr className="transition-colors hover:bg-surface-container-low">
                  <td className={labelCell}>Free Weights Max Range</td>
                  <td className="p-4"><div className="flex flex-col gap-1"><span className="font-headline-sm text-[18px] font-bold text-primary">Up to 60 kg</span><span className="font-body-sm text-[12px] text-secondary">Eleiko &amp; Rogue urethane dumbbells + 6 Olympic platforms</span></div></td>
                  <td className="p-4"><div className="flex flex-col gap-1"><span className="font-headline-sm text-[18px] font-bold text-primary">Up to 45 kg</span><span className="font-body-sm text-[12px] text-secondary">Technogym calibrated dumbbells + 3 power cages</span></div></td>
                  <td className="p-4"><div className="flex flex-col gap-1"><span className="font-headline-sm text-[18px] font-bold text-primary">Up to 35 kg</span><span className="font-body-sm text-[12px] text-secondary">Rubber hex dumbbells + 1 Smith machine</span></div></td>
                </tr>
                <tr className={`transition-colors hover:bg-surface-container-low ${altRow}`}>
                  <td className={labelCell}>Cardio Fleet &amp; Equipment</td>
                  <td className={bodyCell}>Hammer Strength &amp; Rogue Echo Bikes, Concept2 Rowers, curved treadmills.</td>
                  <td className={bodyCell}>Technogym Skillrun series, integrated touchscreen dashboards, StairMasters.</td>
                  <td className={bodyCell}>Life Fitness standard motorized treadmills, elliptical cross trainers, spin bikes.</td>
                </tr>
                <tr className="transition-colors hover:bg-surface-container-low">
                  <td className={labelCell}>Air Conditioning &amp; Air Flow</td>
                  <td className={bodyCell}>Industrial Big Ass Fans + 6x High CFM split ducts (Zero stuffiness)</td>
                  <td className={bodyCell}>Centralized HVAC system with HEPA filtration and eucalyptus diffusers</td>
                  <td className={bodyCell}>Standard wall cassette split AC units (can warm up during peak humidity)</td>
                </tr>
                <tr className={`transition-colors hover:bg-surface-container-low ${altRow}`}>
                  <td className={labelCell}>Locker &amp; Shower Facilities</td>
                  <td className={bodyCell}>Spacious lockers (bring padlock), 4 individual hot rain-showers, towel service included.</td>
                  <td className={bodyCell}>Digital RFID coded lockers, private en-suite spa shower pods with organic toiletries.</td>
                  <td className={bodyCell}>Standard keyed lockers, 2 communal changing stalls with basic showers.</td>
                </tr>
                <tr className="transition-colors hover:bg-surface-container-low">
                  <td className={labelCell}>Steam / Sauna / Ice Bath</td>
                  <td className="p-4"><span className="inline-flex items-center gap-1.5 font-body-md text-[14px] text-on-surface"><CheckCircle2 className="h-[18px] w-[18px] text-tertiary-fixed" />Steam Room (Post-workout)</span></td>
                  <td className="p-4"><div className="flex flex-col gap-1"><span className="inline-flex items-center gap-1.5 font-label-lg text-[14px] font-bold text-primary-container"><BadgeCheck className="h-[18px] w-[18px]" />Full Thermal Suite</span><span className="font-body-sm text-[12px] text-secondary">Cedar Finnish Sauna + 4°C Cryo Cold Plunge Tub</span></div></td>
                  <td className="p-4"><span className="inline-flex items-center gap-1.5 font-body-md text-[14px] text-secondary"><XCircle className="h-[18px] w-[18px] text-secondary" />Not Available</span></td>
                </tr>
                <tr className={`transition-colors hover:bg-surface-container-low ${altRow}`}>
                  <td className={labelCell}>Dedicated Parking</td>
                  <td className={bodyCell}>Dedicated basement parking (30 cars + two-wheelers)</td>
                  <td className={bodyCell}>Complimentary Valet Parking &amp; EV charging points</td>
                  <td className={bodyCell}>Street parking only (Limited during 7–9 PM)</td>
                </tr>

                <tr className={sectionRow}>
                  <td className={sectionCell} colSpan={columns.length + 1}>03 • Atmosphere &amp; Training Culture</td>
                </tr>
                <tr className="transition-colors hover:bg-surface-container-low">
                  <td className={labelCell}>Gym Vibe &amp; Soundscape</td>
                  <td className="p-4"><span className="inline-block rounded bg-surface-container-high px-2.5 py-1 font-label-md text-[12px] text-primary">Raw Iron &amp; Powerlifting</span><p className="mt-1 font-body-sm text-[12px] text-secondary">Chalk permitted, curated heavy hip-hop &amp; phonk playlists.</p></td>
                  <td className="p-4"><span className="inline-block rounded bg-surface-container-high px-2.5 py-1 font-label-md text-[12px] text-primary">Boutique Luxury Athletic</span><p className="mt-1 font-body-sm text-[12px] text-secondary">Deep house soundscapes, minimal clutter, focused quiet energy.</p></td>
                  <td className="p-4"><span className="inline-block rounded bg-surface-container-high px-2.5 py-1 font-label-md text-[12px] text-primary">High-Tempo Commercial</span><p className="mt-1 font-body-sm text-[12px] text-secondary">Commercial pop, fast turnover, community group buzz.</p></td>
                </tr>
                <tr className={`transition-colors hover:bg-surface-container-low ${altRow}`}>
                  <td className={labelCell}>Peak Crowd Density (7-9 PM)</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2"><div className="h-2 w-16 overflow-hidden rounded-full bg-surface-container-highest"><div className="h-full w-[65%] bg-amber-400" /></div><span className="font-label-md text-[12px] text-on-surface">Moderate (65%)</span></div>
                    <span className="mt-0.5 block font-body-sm text-[12px] text-secondary">Minimal wait for squat racks</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2"><div className="h-2 w-16 overflow-hidden rounded-full bg-surface-container-highest"><div className="h-full w-[45%] bg-tertiary-fixed" /></div><span className="font-label-md text-[12px] text-tertiary-fixed">Capped Capacity (45%)</span></div>
                    <span className="mt-0.5 block font-body-sm text-[12px] text-secondary">Strict member limits prevent crowding</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2"><div className="h-2 w-16 overflow-hidden rounded-full bg-surface-container-highest"><div className="h-full w-[90%] bg-error" /></div><span className="font-label-md text-[12px] text-error">Heavy (90%)</span></div>
                    <span className="mt-0.5 block font-body-sm text-[12px] text-secondary">Expect queue for treadmills &amp; benches</span>
                  </td>
                </tr>
                <tr className="transition-colors hover:bg-surface-container-low">
                  <td className={labelCell}>Female-Friendly &amp; Staff</td>
                  <td className={bodyCell}><div className="flex items-center gap-1 text-primary"><span className="font-label-md text-[12px]">4.7 / 5.0</span><span className="font-body-sm text-[12px] text-secondary">• 2 female S&amp;C coaches</span></div><span className="mt-0.5 block font-body-sm text-[12px] text-secondary">Dedicated lifting seminars for women</span></td>
                  <td className={bodyCell}><div className="flex items-center gap-1 text-primary"><span className="font-label-md text-[12px]">5.0 / 5.0</span><span className="font-body-sm text-[12px] text-secondary">• 5 female certified coaches</span></div><span className="mt-0.5 block font-body-sm text-[12px] text-secondary">Biometric private locker wing</span></td>
                  <td className={bodyCell}><div className="flex items-center gap-1 text-primary"><span className="font-label-md text-[12px]">4.2 / 5.0</span><span className="font-body-sm text-[12px] text-secondary">• 1 female trainer</span></div><span className="mt-0.5 block font-body-sm text-[12px] text-secondary">Women-only morning batch (10-11 AM)</span></td>
                </tr>

                <tr className={sectionRow}>
                  <td className={sectionCell} colSpan={columns.length + 1}>04 • Timings &amp; Access Control</td>
                </tr>
                <tr className="transition-colors hover:bg-surface-container-low">
                  <td className={labelCell}>Weekday Timings</td>
                  <td className={`${bodyCell} font-semibold`}>05:30 AM – 11:00 PM</td>
                  <td className="p-4 font-body-md text-[14px] font-semibold text-primary-container">24/7 Biometric Access</td>
                  <td className={`${bodyCell} font-semibold`}>06:00 AM – 10:00 PM</td>
                </tr>
                <tr className={`transition-colors hover:bg-surface-container-low ${altRow}`}>
                  <td className={labelCell}>Weekend Timings</td>
                  <td className={bodyCell}>06:00 AM – 10:00 PM (Sat-Sun)</td>
                  <td className={bodyCell}>24/7 Unrestricted</td>
                  <td className={bodyCell}>07:00 AM – 08:00 PM (Sunday closes early)</td>
                </tr>
                <tr className="transition-colors hover:bg-surface-container-low">
                  <td className={labelCell}>Public Holidays</td>
                  <td className={bodyCell}>Open (Special morning schedule)</td>
                  <td className={bodyCell}>365 Days Uninterrupted</td>
                  <td className={`${bodyCell} text-secondary`}>Closed on gazetted holidays</td>
                </tr>

                <tr className={sectionRow}>
                  <td className={sectionCell} colSpan={columns.length + 1}>05 • Floor Guidance &amp; Personal Coaching</td>
                </tr>
                <tr className="transition-colors hover:bg-surface-container-low">
                  <td className={labelCell}>General Trainer on Floor</td>
                  <td className={bodyCell}><span className="font-semibold text-tertiary-fixed">Included</span> • Spotting, basic form checks, and warmup coaching.</td>
                  <td className={bodyCell}><span className="font-semibold text-tertiary-fixed">Included</span> • Movement assessment and posture correction protocol.</td>
                  <td className={bodyCell}><span className="text-secondary">Limited</span> • 1 trainer covers entire floor; general guidance on machines only.</td>
                </tr>
                <tr className={`transition-colors hover:bg-surface-container-low ${altRow}`}>
                  <td className={labelCell}>1-on-1 PT Rate / Session</td>
                  <td className={bodyCell}>₹800 – ₹1,200 <span className="block font-body-sm text-[12px] text-secondary">(CSCS / NSCA Certified)</span></td>
                  <td className={bodyCell}>₹1,500 – ₹2,200 <span className="block font-body-sm text-[12px] text-secondary">(Includes nutrition &amp; recovery plan)</span></td>
                  <td className={bodyCell}>₹500 – ₹700 <span className="block font-body-sm text-[12px] text-secondary">(Standard gym instructors)</span></td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="sticky bottom-0 z-30 bg-surface-container shadow-[0_-10px_25px_rgba(0,0,0,0.5)]">
                  <td className="sticky left-0 z-40 bg-surface-container p-4">
                    <div className="flex flex-col">
                      <span className="font-headline-sm text-[18px] font-bold text-primary">Lock Your Decision</span>
                      <span className="font-body-sm text-[12px] text-secondary">Prices guaranteed via HeyGym</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1.5">
                      <Link href="/gyms/iron-fortress" className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary-container px-4 py-3 font-label-lg text-[14px] font-bold text-on-primary-fixed shadow-[0_0_16px_rgba(202,243,0,0.3)] transition-all hover:bg-primary-fixed-dim">
                        <span>Book Free Trial</span>
                        <Zap className="h-[18px] w-[18px]" aria-hidden="true" />
                      </Link>
                      <Link className="py-0.5 text-center font-label-md text-[12px] text-on-surface-variant transition-colors hover:text-primary" href="/gyms/iron-fortress">Send Enquiry</Link>
                    </div>
                  </td>
                  <td className="bg-surface-container-high/40 p-4">
                    <div className="flex flex-col gap-1.5">
                      <Link href="/gyms/kuro-athletics" className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary-container px-4 py-3 font-label-lg text-[14px] font-bold text-on-primary-fixed shadow-[0_0_20px_rgba(202,243,0,0.35)] transition-all hover:bg-primary-fixed-dim">
                        <span>Book 2-Day Pass</span>
                        <ArrowRight className="h-[18px] w-[18px]" aria-hidden="true" />
                      </Link>
                      <Link className="py-0.5 text-center font-label-md text-[12px] text-on-surface-variant transition-colors hover:text-primary" href="/gyms/kuro-athletics">Virtual Club Tour</Link>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1.5">
                      <Link href="/gyms/pulse-performance" className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-surface-container-highest px-4 py-3 font-label-lg text-[14px] font-bold text-primary transition-all hover:bg-surface-bright">
                        <span>Get Day Pass (₹299)</span>
                      </Link>
                      <Link className="py-0.5 text-center font-label-md text-[12px] text-on-surface-variant transition-colors hover:text-primary" href="/gyms/pulse-performance">Send Enquiry</Link>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Proximity */}
          <section className="mt-1 grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="flex flex-col justify-between rounded-xl bg-surface-container-low p-6 shadow-md lg:col-span-4">
              <div className="space-y-1">
                <span className="font-label-xs-mono text-[11px] uppercase tracking-wider text-primary-container">HeyGym Verdict</span>
                <h3 className="font-headline-md text-[22px] font-bold text-primary">Which gym should you join?</h3>
                <p className="font-body-md text-[14px] text-on-surface-variant">
                  • <strong>Serious Lifters / Powerlifters:</strong> Pick <strong>Iron Fortress</strong> for calibrated bars, bumper plates, and high ceiling acoustics.<br /><br />
                  • <strong>Busy Executives &amp; Biohackers:</strong> Pick <strong>Kuro Athletics</strong> for 24/7 flexibility, zero crowd friction, sauna, and cold plunge recovery.<br /><br />
                  • <strong>Budget &amp; Daily Movers:</strong> Choose <strong>Pulse Studio</strong> for uncomplicated cardio routines under ₹1,700/mo.
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-surface-container-high pt-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary-container" aria-hidden="true" />
                  <span className="font-body-sm text-[12px] text-secondary">Verified pricing protection</span>
                </div>
                <Link className="font-label-md text-[12px] text-primary transition-colors hover:text-primary-container" href="/#how-it-works">Learn more →</Link>
              </div>
            </div>
            <div className="relative flex flex-col justify-between overflow-hidden rounded-xl bg-surface-container-low p-4 shadow-md lg:col-span-8">
              <div className="z-10 mb-2 flex items-center justify-between">
                <div>
                  <h4 className="font-headline-sm text-[18px] font-bold text-primary">Proximity &amp; Commute in Sector 62</h4>
                  <p className="font-body-sm text-[12px] text-secondary">Walkability scores and transit connectivity relative to Noida Electronic City Metro</p>
                </div>
                <span className="rounded bg-surface-container-high px-2.5 py-1 font-label-xs-mono text-[11px] text-on-surface">Radius: 2.0 km</span>
              </div>
              <div
                className="relative h-56 w-full overflow-hidden rounded-lg bg-cover bg-center shadow-inner"
                style={{ backgroundImage: `url('${MAP_BACKDROP}')` }}
              >
                <div className="absolute inset-0 flex items-center justify-center bg-surface-container-lowest/60 p-4 backdrop-blur-[2px]">
                  <div className="grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-3">
                    <div className="rounded-lg bg-surface-container-low/95 p-3 text-center shadow-md backdrop-blur-md">
                      <span className="font-label-xs-mono text-[11px] uppercase text-primary-container">Pulse Fitness</span>
                      <p className="mt-0.5 font-headline-sm text-[18px] font-extrabold text-primary">4 min walk</p>
                      <p className="font-body-sm text-[12px] text-secondary">350m from Metro Gate 2</p>
                    </div>
                    <div className="rounded-lg bg-surface-container-low/95 p-3 text-center shadow-md ring-1 ring-primary-container/30 backdrop-blur-md">
                      <span className="font-label-xs-mono text-[11px] uppercase text-primary-container">Iron Fortress</span>
                      <p className="mt-0.5 font-headline-sm text-[18px] font-extrabold text-primary">8 min walk</p>
                      <p className="font-body-sm text-[12px] text-secondary">800m • Ample street turn</p>
                    </div>
                    <div className="rounded-lg bg-surface-container-low/95 p-3 text-center shadow-md backdrop-blur-md">
                      <span className="font-label-xs-mono text-[11px] uppercase text-tertiary-fixed">Kuro Athletics</span>
                      <p className="mt-0.5 font-headline-sm text-[18px] font-extrabold text-primary">4 min drive</p>
                      <p className="font-body-sm text-[12px] text-secondary">1.4 km • Valet at porch</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Empty CTA */}
          <section className="mt-1 flex flex-col items-center justify-between gap-4 rounded-xl bg-surface-container-low p-4 shadow-sm sm:flex-row">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-primary-container">
                <SlidersHorizontal className="h-7 w-7" aria-hidden="true" />
              </div>
              <div>
                <h4 className="font-headline-sm text-[18px] font-bold text-primary">Have another facility in mind?</h4>
                <p className="font-body-sm text-[12px] text-on-surface-variant">Add Gold&apos;s Gym Sector 62 or Anytime Fitness to compare all four simultaneously.</p>
              </div>
            </div>
            <Link
              href="/gyms"
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-surface-container-high px-6 py-2.5 font-label-lg text-[14px] font-semibold text-on-surface transition-all hover:bg-surface-bright hover:text-primary"
            >
              <Search className="h-[18px] w-[18px] text-primary-container" aria-hidden="true" />
              <span>Browse Sector 62 Directory</span>
            </Link>
          </section>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-lg bg-surface-container-highest px-4 py-3 font-label-md text-[12px] font-semibold text-primary shadow-2xl ring-1 ring-primary-container/40" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
