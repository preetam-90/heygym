'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Star,
  Navigation,
  MapPin,
  Bookmark,
  Share2,
  Images,
  BadgeCheck,
  Award,
  Zap,
  CalendarCheck,
  ArrowLeftRight,
  Compass,
  Ruler,
  Users,
  Thermometer,
  ParkingSquare,
  Dumbbell,
  Medal,
  Footprints,
  Waves,
  Check,
  CheckCircle2,
  X,
  Reply,
  ThumbsUp,
  ShieldCheck,
  QrCode,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { api } from '@/lib/api';
import { photoSrc } from '@/lib/gym-owner';
import type { Gym } from '@/types';
import {
  SHOWCASE_GYMS,
  DETAIL_GALLERY,
  SHOWCASE_COACHES,
  SHOWCASE_REVIEWS,
  type ShowcaseGym,
} from '@/lib/showcase';
import { toggleCompare, useCompareSlugs } from '@/lib/compare-store';

interface PlanTier {
  name: string;
  price: string;
  per: string;
  desc: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
}

interface StatCell {
  label: string;
  icon: React.ReactNode;
  value: string;
  sub: string;
}

interface EquipCard {
  icon: React.ReactNode;
  title: string;
  tag: string;
  text: string;
  chips: string[];
}

function inr(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function GymDetailPage() {
  const params = useParams();
  const gymId = params.id as string;
  const isShowcaseSlug = SHOWCASE_GYMS.some((s) => s.slug === gymId);
  const [gym, setGym] = useState<Gym | null>(null);
  const [loading, setLoading] = useState(!isShowcaseSlug);
  const [notFound, setNotFound] = useState(false);
  const [saved, setSaved] = useState(false);
  const [shared, setShared] = useState(false);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [trialOpen, setTrialOpen] = useState(false);
  const [planField, setPlanField] = useState('General Membership / Custom Enquiry');
  const [enquirySent, setEnquirySent] = useState(false);
  const [passReady, setPassReady] = useState(false);
  const comparedSlugs = useCompareSlugs();

  useEffect(() => {
    let live = true;
    // Showcase catalogue slugs (Stitch design) resolve locally — no backend fetch needed.
    if (isShowcaseSlug) {
      setGym(null);
      setNotFound(false);
      setLoading(false);
      return () => {
        live = false;
      };
    }
    setLoading(true);
    api
      .getGymById(gymId)
      .then((data) => {
        if (live) {
          setGym(data);
          setNotFound(false);
        }
      })
      .catch(() => {
        if (live) {
          const isShowcase = SHOWCASE_GYMS.some((s) => s.slug === gymId);
          setGym(null);
          setNotFound(!isShowcase);
        }
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [gymId]);

  const showcase: ShowcaseGym | undefined =
    SHOWCASE_GYMS.find((s) => s.slug === gymId) ??
    (gym ? SHOWCASE_GYMS.find((s) => s.name.toLowerCase() === gym.name.toLowerCase()) : undefined);
  const isIronFortress = showcase?.slug === 'iron-fortress' || gym?.name.toLowerCase().includes('iron fortress');

  const name = isIronFortress ? 'Iron Fortress Strength Club' : (gym?.name ?? showcase?.name ?? 'Gym');
  const city = gym?.city ?? 'Noida';
  const area = showcase?.area ?? city;
  const address = gym ? `${gym.address}, ${gym.city}` : 'Plot C-22, Sector 62, Noida, Uttar Pradesh';
  const rating = showcase?.rating ?? null;
  const reviewCount = showcase?.reviews ?? null;
  const hours =
    gym?.openingTime && gym?.closingTime
      ? `${gym.openingTime} – ${gym.closingTime}`
      : '05:30 AM – 11:00 PM';
  const slug = showcase?.slug ?? gymId;
  const compared = comparedSlugs.includes(slug);

  const realImages = [...(gym?.images ?? [])]
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary))
    .map((i) => photoSrc(i.url))
    .filter(Boolean) as string[];
  const cover = photoSrc(gym?.imageUrl);
  const galleryMain = cover ?? realImages[0] ?? showcase?.image ?? DETAIL_GALLERY.main;
  const galleryThumbs =
    realImages.length >= 4
      ? realImages.slice(0, 4)
      : DETAIL_GALLERY.thumbs.map((t) => t.src);

  const stats: StatCell[] = isIronFortress
    ? [
        { label: 'Total Area', icon: <Ruler className="h-5 w-5 text-primary-container" />, value: '14,000', sub: 'Square Feet on 2 Floors' },
        { label: 'Capacity', icon: <Users className="h-5 w-5 text-primary-container" />, value: '120', sub: 'Active Floor Cap (Uncrowded)' },
        { label: 'Climate', icon: <Thermometer className="h-5 w-5 text-primary-container" />, value: '19°C', sub: 'Dual HEPA Air Handling' },
        { label: 'Access', icon: <ParkingSquare className="h-5 w-5 text-primary-container" />, value: 'Free', sub: 'Valet & Reserved Stalls' },
      ]
    : [
        { label: 'Location', icon: <MapPin className="h-5 w-5 text-primary-container" />, value: city, sub: address.split(',').slice(0, 2).join(',') },
        { label: 'Hours', icon: <Users className="h-5 w-5 text-primary-container" />, value: hours.split('–')[0].trim(), sub: `Open ${hours}` },
        { label: 'Plans', icon: <Ruler className="h-5 w-5 text-primary-container" />, value: `${gym?.membershipPlans?.length ?? 3}`, sub: 'Membership options' },
        { label: 'Status', icon: <BadgeCheck className="h-5 w-5 text-primary-container" />, value: 'Verified', sub: 'HeyGym audited facility' },
      ];

  const equipment: EquipCard[] = isIronFortress
    ? [
        { icon: <Dumbbell className="h-[22px] w-[22px]" />, title: 'Free Weights & Power', tag: 'Rogue & Eleiko IPF Spec', text: 'Full calibrated steel plate selection with micro-weights, competition rubber bumper sets, dumbbells ranging from 2.5 kg up to 60 kg in 2.5 kg increments, and 8 dedicated Texas power bars.', chips: ['Eleiko Calibrated', '60kg Dumbbells', 'Specialty Bars'] },
        { icon: <Medal className="h-[22px] w-[22px]" />, title: 'Olympic & Power Platforms', tag: 'Acoustic Vibration Damping', text: '4 sunken oak platforms with reinforced high-density rubber sound dampening. Competition monolifts, adjustable safety straps, and chalk basins at every lifting station.', chips: ['4 Olympic Racks', 'Monolift Compatible', 'Chalk Provided'] },
        { icon: <Footprints className="h-[22px] w-[22px]" />, title: 'Cardio & Metabolic Engine', tag: 'High-Output Conditioning', text: 'Non-motorized Woodway curve treadmills, Concept2 PM5 SkiErgs, PM5 Rowers, and Rogue Echo Bikes. Built for metabolic threshold conditioning without electric throttle latency.', chips: ['Woodway Curves', 'Echo Bikes', 'Concept2 Suite'] },
        { icon: <Waves className="h-[22px] w-[22px]" />, title: 'Recovery & Hydro Lounge', tag: 'Contrast Therapy Protocol', text: 'Full Spectrum Clearlight Infrared Sauna operating at 65°C alongside twin 4°C filtered ice plunge tubs. Towel service and shower lockers integrated.', chips: ['Infrared Sauna', '4°C Cold Plunge', 'Steam Rooms'] },
      ]
    : [
        {
          icon: <Dumbbell className="h-[22px] w-[22px]" />,
          title: 'Facilities & Equipment',
          tag: 'Verified On-Site',
          text: gym?.description ?? showcase?.description ?? 'Strength floor, cardio deck and functional training zones maintained to HeyGym audit standards.',
          chips: [...(gym?.facilities ?? []), ...(showcase?.amenities ?? [])].slice(0, 6),
        },
        {
          icon: <Users className="h-[22px] w-[22px]" />,
          title: 'Services & Programs',
          tag: 'Coach Led',
          text: 'Group classes, personal coaching and recovery services run by certified trainers throughout the week.',
          chips: [...(gym?.services ?? []), 'Personal Training', 'Group Classes'].slice(0, 6),
        },
      ];

  const monthlyBase = showcase?.priceMonthly ?? 1999;
  const plans: PlanTier[] =
    gym?.membershipPlans && gym.membershipPlans.length > 0
      ? gym.membershipPlans.map((p, i) => ({
          name: p.name,
          price: inr(p.price),
          per: `/ ${p.duration} month${p.duration > 1 ? 's' : ''}`,
          desc: p.description ?? 'Full facility access with standard member benefits.',
          features: ['Full unrestricted floor access', 'Day-use electronic lockers', 'Trainer support on floor'],
          highlighted: i === 0,
          badge: i === 0 ? 'Most Popular Choice' : undefined,
        }))
      : [
          { name: 'Monthly Access', price: inr(monthlyBase), per: '/ month', desc: 'Ideal for seasonal training blocks or independent athletes test-driving the facility.', features: ['Full unrestricted floor access', 'Day-use electronic lockers', 'Initial mobility & 1RM screening'] },
          { name: 'Quarterly Power', price: inr(Math.round(monthlyBase * 3 * 0.87)), per: '/ 3 months', desc: 'Comprehensive cycle for powerlifters and athletes targeting PR benchmarks.', features: ['All floor & platform access', 'Dedicated permanent locker space', '1x S&C Coach consult session', '2 Recovery Lounge guest passes'], highlighted: true, badge: 'Most Popular Choice' },
          { name: 'Annual Elite', price: inr(Math.round(monthlyBase * 12 * 0.65)), per: '/ year', desc: 'The definitive commitment for elite strength progression and club brotherhood.', features: ['Unlimited 24/7 biometric floor access', 'Unlimited Infrared Sauna & Plunge', '12 Guest passes for teammates', 'Priority locker & laundry service'], badge: 'SAVE 35%' },
        ];

  const coaches = isIronFortress ? SHOWCASE_COACHES : [];
  const reviews = isIronFortress ? SHOWCASE_REVIEWS : [];

  const selectPlan = (planTitle: string, price: string) => {
    setPlanField(`${planTitle} (${price})`);
    setEnquirySent(false);
    setEnquiryOpen(true);
  };

  const requestCoach = (coachName: string) => {
    setPlanField(`Coaching Consultation with ${coachName}`);
    setEnquirySent(false);
    setEnquiryOpen(true);
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      /* clipboard unavailable */
    }
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  if (loading) {
    return (
      <div className="mx-auto flex max-w-[1400px] justify-center px-6 py-32 pt-32" role="status" aria-label="Loading">
        <Loader2 className="h-8 w-8 animate-spin text-primary-container" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-[1400px] px-6 py-32 text-center" role="alert">
        <p className="text-error">Gym not found</p>
        <Link href="/gyms" className="mt-4 inline-flex items-center gap-2 font-semibold text-primary-container hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Gyms
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full bg-surface pt-20">
      {/* BREADCRUMBS & TOP UTILITY BAR */}
      <div className="mx-auto w-full max-w-[1400px] px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <nav className="flex flex-wrap items-center gap-2 font-body-sm text-[12px] text-on-surface-variant" aria-label="Breadcrumb">
            <Link className="transition-colors hover:text-primary" href="/">Home</Link>
            <span className="text-surface-bright">/</span>
            <Link className="transition-colors hover:text-primary" href="/gyms">Discover</Link>
            <span className="text-surface-bright">/</span>
            <Link className="transition-colors hover:text-primary" href="/gyms">{city}</Link>
            <span className="text-surface-bright">/</span>
            <Link className="transition-colors hover:text-primary" href="/gyms">{area}</Link>
            <span className="text-surface-bright">/</span>
            <span className="font-semibold text-primary">{name}</span>
          </nav>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSaved(!saved)}
              className="flex items-center gap-1.5 rounded-lg bg-surface-container-low px-4 py-1.5 font-label-md text-[12px] font-semibold text-on-surface transition-all hover:bg-surface-container"
              aria-pressed={saved}
            >
              <Bookmark className={`h-[18px] w-[18px] text-primary-container ${saved ? 'fill-primary-container' : ''}`} aria-hidden="true" />
              <span>{saved ? 'Saved to Wishlist' : 'Save Facility'}</span>
            </button>
            <button
              onClick={share}
              className="flex items-center gap-1.5 rounded-lg bg-surface-container-low px-4 py-1.5 font-label-md text-[12px] font-semibold text-on-surface transition-all hover:bg-surface-container"
            >
              <Share2 className="h-[18px] w-[18px]" aria-hidden="true" />
              <span>{shared ? 'Link Copied!' : 'Share'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* HERO GALLERY SECTION */}
      <section className="mx-auto mb-6 w-full max-w-[1400px] px-6">
        <div className="relative grid grid-cols-1 gap-2 lg:grid-cols-12">
          <div className="group relative h-[380px] overflow-hidden rounded-xl sm:h-[480px] lg:col-span-8 lg:h-[540px]">
            <img
              alt={name}
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
              src={galleryMain}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface-container-lowest/90 via-surface-container-lowest/20 to-transparent" />
            <div className="absolute left-4 top-4 flex flex-wrap items-center gap-1">
              <div className="flex items-center gap-1.5 rounded-full bg-surface-container-lowest/80 px-2 py-1 font-label-xs-mono text-[11px] uppercase text-primary-fixed backdrop-blur-md">
                <BadgeCheck className="h-4 w-4 fill-primary-fixed text-surface-container-lowest" aria-hidden="true" />
                Verified Facility
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-surface-container-lowest/80 px-2 py-1 font-label-xs-mono text-[11px] uppercase text-on-surface backdrop-blur-md">
                <Award className="h-[15px] w-[15px] text-amber-400" aria-hidden="true" />
                Top Rated 2025
              </div>
            </div>
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
              <div className="space-y-1">
                <span className="rounded bg-surface-container-lowest/80 px-2.5 py-1 font-label-xs-mono text-[11px] uppercase tracking-wider text-primary-container">
                  Private Heavy Athletics
                </span>
                <p className="font-headline-md text-[22px] text-primary drop-shadow-md">Main Competition &amp; Power Hall</p>
              </div>
              <button className="hidden items-center gap-2 rounded-lg bg-surface-container-lowest/90 px-4 py-2 font-label-md text-[12px] font-semibold text-on-surface shadow-lg backdrop-blur-md transition-colors hover:text-primary-container sm:inline-flex">
                <Images className="h-[18px] w-[18px]" aria-hidden="true" />
                <span>View All 28 Photos</span>
              </button>
            </div>
          </div>
          <div className="grid h-[380px] grid-cols-2 gap-2 sm:h-[480px] lg:col-span-4 lg:h-[540px]">
            {DETAIL_GALLERY.thumbs.map((t, i) => (
              <div key={t.label} className="group relative cursor-pointer overflow-hidden rounded-xl">
                <img
                  alt={t.label}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  src={galleryThumbs[i] ?? t.src}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/80 via-transparent to-transparent" />
                <span className="absolute bottom-2 left-2.5 font-label-xs-mono text-[11px] uppercase text-primary">
                  {t.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GYM IDENTITY HEADER & STICKY ACTION STRIP */}
      <section className="mb-10 w-full bg-surface-container-low py-6">
        <div className="mx-auto w-full max-w-[1400px] px-6">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-headline-xl text-[30px] font-extrabold tracking-tight text-primary md:text-[40px]">{name}</h1>
                <span className="rounded bg-primary-container/20 px-2 py-0.5 font-label-xs-mono text-[11px] font-bold uppercase text-primary-container">
                  Tier 1 Certified
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-body-md text-[14px] text-on-surface-variant">
                {rating != null ? (
                  <div className="flex items-center gap-1.5 font-semibold text-on-surface">
                    <Star className="h-5 w-5 fill-amber-400 text-amber-400" aria-hidden="true" />
                    <span className="font-bold text-primary">{rating.toFixed(1)}</span>
                    <span className="font-normal text-on-surface-variant">({reviewCount} verified reviews)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 font-semibold text-on-surface">
                    <BadgeCheck className="h-5 w-5 text-primary-container" aria-hidden="true" />
                    <span className="font-normal text-on-surface-variant">Verified listing</span>
                  </div>
                )}
                <span className="text-surface-bright">•</span>
                <div className="flex items-center gap-1">
                  <Navigation className="h-[18px] w-[18px] text-primary-container" aria-hidden="true" />
                  <span>{showcase ? `${showcase.distanceKm.toFixed(1)} km away` : 'Nearby'}</span>
                </div>
                <span className="text-surface-bright">•</span>
                <div className="flex items-center gap-1">
                  <MapPin className="h-[18px] w-[18px]" aria-hidden="true" />
                  <span>{address}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 rounded bg-surface-container px-2.5 py-1 font-label-xs-mono text-[11px] text-emerald-400">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" aria-hidden="true" />
                  Open Today: {hours}
                </span>
                <span className="font-body-sm text-[12px] text-on-surface-variant">Peak hours: 6:00 PM – 8:30 PM</span>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <button
                onClick={() => { setEnquirySent(false); setEnquiryOpen(true); }}
                className="flex items-center gap-2 rounded-lg bg-primary-container px-6 py-3 font-label-lg text-[14px] font-bold text-on-primary-fixed shadow-md transition-all hover:scale-[1.01] hover:bg-primary-fixed-dim"
              >
                <Zap className="h-5 w-5" aria-hidden="true" />
                <span>Enquire Now</span>
              </button>
              <button
                onClick={() => { setPassReady(false); setTrialOpen(true); }}
                className="flex items-center gap-2 rounded-lg bg-surface-container-high px-4 py-3 font-label-lg text-[14px] font-semibold text-on-surface transition-colors hover:text-primary-container"
              >
                <CalendarCheck className="h-5 w-5" aria-hidden="true" />
                <span>Book Free Trial Visit</span>
              </button>
              <button
                onClick={() => toggleCompare(slug)}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-3 font-label-md text-[12px] font-semibold transition-colors ${
                  compared ? 'bg-primary-container/20 text-primary-container' : 'bg-surface-container-highest text-on-surface-variant hover:text-primary'
                }`}
              >
                <ArrowLeftRight className="h-[18px] w-[18px]" aria-hidden="true" />
                <span>{compared ? `Added to Compare (${comparedSlugs.length})` : 'Add to Compare'}</span>
              </button>
              <a
                className="rounded-lg bg-surface-container-highest p-3 text-on-surface-variant transition-colors hover:text-primary"
                href="#locationSection"
                title="Directions"
              >
                <Compass className="h-5 w-5" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT CONTAINER */}
      <div className="mx-auto mb-10 grid w-full max-w-[1400px] grid-cols-1 gap-6 px-6 lg:grid-cols-12">
        <div className="space-y-10 lg:col-span-8">
          {/* 1. QUICK STATS BENTO */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-lg text-[28px] tracking-tight text-primary">Facility Overview</h2>
              <span className="font-label-xs-mono text-[11px] uppercase tracking-wider text-primary-container">
                {isIronFortress ? 'Audit Ref: IF-NOIDA-62' : `Verified • ${area}`}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="flex h-32 flex-col justify-between rounded-xl bg-surface-container-low p-4">
                  <div className="flex items-center justify-between text-on-surface-variant">
                    <span className="font-label-md text-[12px] font-semibold">{s.label}</span>
                    {s.icon}
                  </div>
                  <div>
                    <div className="font-headline-lg text-[28px] font-bold text-primary">{s.value}</div>
                    <div className="font-body-sm text-[12px] text-on-surface-variant">{s.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 2. FACILITIES & EQUIPMENT MATRIX */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-headline-lg text-[28px] tracking-tight text-primary">Equipment &amp; Facilities Matrix</h2>
              <span className="font-body-sm text-[12px] text-on-surface-variant">Competition-Grade Hardware</span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {equipment.map((card) => (
                <div key={card.title} className="space-y-2 rounded-xl bg-surface-container-low p-6 transition-colors hover:bg-surface-container">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-high text-primary-container">
                      {card.icon}
                    </div>
                    <div>
                      <h3 className="font-headline-sm text-[18px] text-primary">{card.title}</h3>
                      <span className="font-label-xs-mono text-[11px] text-secondary">{card.tag}</span>
                    </div>
                  </div>
                  <p className="font-body-md text-[14px] text-on-surface-variant">{card.text}</p>
                  {card.chips.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {card.chips.map((c) => (
                        <span key={c} className="rounded bg-surface-container-highest px-2 py-0.5 font-label-xs-mono text-[11px] text-on-surface">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* 3. TRANSPARENT MEMBERSHIP PLANS */}
          <section className="space-y-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-headline-lg text-[28px] tracking-tight text-primary">Transparent Pricing</h2>
                <span className="rounded bg-surface-container-high px-2 py-0.5 font-label-xs-mono text-[11px] text-on-surface">
                  NO HIDDEN JOINING FEES
                </span>
              </div>
              <p className="font-body-md text-[14px] text-on-surface-variant">
                Direct club rates vetted by HeyGym. Cancel or freeze anytime with 14-day notice.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative flex flex-col justify-between space-y-4 rounded-xl p-6 transition-all ${
                    plan.highlighted ? 'bg-surface-container shadow-xl' : 'bg-surface-container-low hover:bg-surface-container'
                  }`}
                >
                  {plan.badge && (
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-0.5 font-label-xs-mono text-[11px] font-bold uppercase tracking-wider shadow ${
                      plan.highlighted ? 'bg-primary-container text-on-primary-fixed' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {plan.badge}
                    </div>
                  )}
                  <div className="space-y-2 pt-2">
                    <div className="font-headline-sm text-[18px] text-primary">{plan.name}</div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-headline-xl text-[40px] font-extrabold text-primary">{plan.price}</span>
                      <span className="font-body-sm text-[12px] text-on-surface-variant">{plan.per}</span>
                    </div>
                    <p className="font-body-sm text-[12px] text-on-surface-variant">{plan.desc}</p>
                    <ul className="space-y-2 pt-1 font-body-sm text-[12px] text-on-surface">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2">
                          <Check className="h-4 w-4 shrink-0 text-primary-container" aria-hidden="true" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    onClick={() => selectPlan(plan.name, plan.price)}
                    className={`w-full rounded-lg py-2.5 font-label-md text-[12px] font-semibold transition-all ${
                      plan.highlighted
                        ? 'bg-primary-container font-bold text-on-primary-fixed shadow-md hover:bg-primary-fixed-dim'
                        : 'bg-surface-container-highest text-on-surface hover:text-primary-container'
                    }`}
                  >
                    Enquire About Plan
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* 4. CERTIFIED COACHES & TRAINERS */}
          {coaches.length > 0 && (
            <section className="space-y-4">
              <div>
                <h2 className="font-headline-lg text-[28px] tracking-tight text-primary">Strength Faculty</h2>
                <p className="font-body-md text-[14px] text-on-surface-variant">
                  Certified coaches available for 1-on-1 prep and movement screenings.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {coaches.map((coach) => (
                  <div key={coach.name} className="flex flex-col justify-between space-y-4 rounded-xl bg-surface-container-low p-4">
                    <div className="space-y-2">
                      <div className="relative h-44 overflow-hidden rounded-lg">
                        <img alt={coach.name} className="h-full w-full object-cover" src={coach.image} loading="lazy" />
                        <span className="absolute bottom-2 left-2 rounded bg-surface-container-lowest/80 px-2 py-0.5 font-label-xs-mono text-[11px] uppercase text-primary-container">
                          {coach.role}
                        </span>
                      </div>
                      <h3 className="font-headline-sm text-[18px] text-primary">{coach.name}</h3>
                      <p className="font-body-sm text-[12px] text-on-surface-variant">{coach.bio}</p>
                    </div>
                    <div className="space-y-2 pt-1">
                      <div className="flex flex-wrap gap-1">
                        {coach.certs.map((c) => (
                          <span key={c} className="rounded bg-surface-container-high px-2 py-0.5 font-label-xs-mono text-[11px] text-on-surface">
                            {c}
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={() => requestCoach(coach.name)}
                        className="w-full rounded bg-surface-container py-1.5 font-label-xs-mono text-[11px] uppercase tracking-wider text-on-surface transition-colors hover:bg-surface-container-high"
                      >
                        Book Consultation
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 5. MEMBER REVIEWS & SCORES */}
          {reviews.length > 0 && rating != null && (
            <section className="space-y-4">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <h2 className="font-headline-lg text-[28px] tracking-tight text-primary">Verified Member Reviews</h2>
                  <p className="font-body-md text-[14px] text-on-surface-variant">
                    Aggregated from verified HeyGym entry scans and memberships.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-headline-xl text-[40px] font-extrabold text-primary">{rating.toFixed(1)}</span>
                  <div className="space-y-0.5">
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="h-[18px] w-[18px] fill-amber-400" aria-hidden="true" />
                      ))}
                    </div>
                    <span className="font-body-sm text-[12px] text-on-surface-variant">{reviewCount} ratings</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 rounded-xl bg-surface-container-low p-6 sm:grid-cols-4">
                {[
                  ['Equipment', '4.9', 98],
                  ['Hygiene', '4.9', 98],
                  ['Floor Space', '4.7', 94],
                  ['Coaching', '4.8', 96],
                ].map(([label, score, pct]) => (
                  <div key={label as string} className="space-y-1">
                    <div className="flex justify-between font-label-md text-[12px] font-semibold text-on-surface-variant">
                      <span>{label as string}</span>
                      <span className="font-bold text-primary">{score as string}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-highest">
                      <div className="h-full rounded-full bg-primary-container" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {reviews.map((review) => (
                  <div key={review.name} className="space-y-2 rounded-xl bg-surface-container-low p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <img alt={review.name} className="h-10 w-10 rounded-full object-cover" src={review.avatar} loading="lazy" />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-headline-sm text-[18px] text-primary">{review.name}</span>
                            <span className="rounded bg-surface-container-highest px-2 py-0.5 font-label-xs-mono text-[11px] uppercase text-primary-container">
                              {review.badge}
                            </span>
                          </div>
                          <span className="font-body-sm text-[12px] text-on-surface-variant">{review.when}</span>
                        </div>
                      </div>
                      <div className="flex text-amber-400">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star key={i} className="h-4 w-4 fill-amber-400" aria-hidden="true" />
                        ))}
                      </div>
                    </div>
                    <p className="font-body-md text-[14px] text-on-surface">{review.text}</p>
                    {review.ownerReply && (
                      <div className="space-y-1 rounded-lg bg-surface-container-high p-2">
                        <div className="flex items-center gap-1.5 font-label-xs-mono text-[11px] font-bold uppercase text-primary-container">
                          <Reply className="h-3.5 w-3.5" aria-hidden="true" />
                          {name} Management
                        </div>
                        <p className="font-body-sm text-[12px] text-on-surface-variant">{review.ownerReply}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-4 pt-1 font-label-md text-[12px] font-semibold text-on-surface-variant">
                      <button className="flex items-center gap-1 transition-colors hover:text-primary">
                        <ThumbsUp className="h-4 w-4" aria-hidden="true" />
                        <span>Helpful ({review.helpful})</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* RIGHT 4 COLS */}
        <div className="space-y-6 lg:col-span-4">
          <div className="sticky top-24 space-y-4">
            <div className="space-y-4 rounded-xl bg-surface-container-low p-6 shadow-xl">
              <div className="flex items-center justify-between pb-1">
                <div>
                  <span className="font-label-xs-mono text-[11px] uppercase tracking-wider text-on-surface-variant">
                    Day Pass Admission
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-headline-lg text-[28px] font-bold text-primary">₹499</span>
                    <span className="font-body-sm text-[12px] text-on-surface-variant">/ day</span>
                  </div>
                </div>
                <span className="rounded bg-surface-container px-2.5 py-1 font-label-xs-mono text-[11px] font-bold text-emerald-400">
                  Instant Barcode Access
                </span>
              </div>
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => { setPassReady(false); setTrialOpen(true); }}
                  className="w-full rounded-lg bg-primary-container py-3 font-label-lg text-[14px] font-bold text-on-primary-fixed shadow-md transition-all hover:bg-primary-fixed-dim"
                >
                  Book Complimentary First Session
                </button>
                <button
                  onClick={() => { setEnquirySent(false); setEnquiryOpen(true); }}
                  className="w-full rounded-lg bg-surface-container-high py-3 font-label-md text-[12px] font-semibold text-on-surface transition-colors hover:text-primary-container"
                >
                  Speak with Head Coach
                </button>
              </div>
              <div className="space-y-1 rounded-lg bg-surface-container-highest p-2 font-body-sm text-[12px] text-on-surface-variant">
                <div className="flex items-center gap-2 font-semibold text-on-surface">
                  <ShieldCheck className="h-[18px] w-[18px] text-primary-container" aria-hidden="true" />
                  HeyGym Facility Guarantee
                </div>
                <p>100% money back if equipment or amenities do not match verified photos upon first arrival.</p>
              </div>
            </div>

            <div className="space-y-4 rounded-xl bg-surface-container-low p-6" id="locationSection">
              <h3 className="font-headline-sm text-[18px] text-primary">Location &amp; Traffic Density</h3>
              <div className="group relative h-44 w-full overflow-hidden rounded-lg bg-surface-container-highest">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url('${DETAIL_GALLERY.main}')` }}
                />
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between rounded bg-surface-container-lowest/80 p-2 backdrop-blur-md">
                  <span className="font-label-xs-mono text-[11px] text-on-surface">Sector 62 Metro: 600m</span>
                  <a className="font-label-xs-mono text-[11px] text-primary-container hover:underline" href="https://maps.google.com" target="_blank" rel="noreferrer">
                    Open Navigation →
                  </a>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between font-label-xs-mono text-[11px] text-on-surface-variant">
                  <span>TRAFFIC DENSITY</span>
                  <span className="text-primary">Today: Moderate</span>
                </div>
                <div className="grid h-16 grid-cols-8 items-end gap-1 pt-2">
                  {[
                    ['6A', 'h-4', 'bg-surface-container-highest', false],
                    ['8A', 'h-10', 'bg-primary-container/40', false],
                    ['11A', 'h-5', 'bg-surface-container-highest', false],
                    ['2P', 'h-4', 'bg-surface-container-highest', false],
                    ['4P', 'h-6', 'bg-surface-container-highest', false],
                    ['7P', 'h-14', 'bg-primary-container', true],
                    ['9P', 'h-12', 'bg-primary-container/80', false],
                    ['11P', 'h-4', 'bg-surface-container-highest', false],
                  ].map(([label, h, bg, hot]) => (
                    <div key={label as string} className="space-y-1 text-center">
                      <div className={`w-full rounded-t ${h as string} ${bg as string}`} />
                      <span className={`block text-[9px] ${hot ? 'font-bold text-primary-container' : 'text-on-surface-variant'}`}>
                        {label as string}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="pt-1 font-body-sm text-[12px] text-on-surface-variant">
                  Quietest hours between 11:30 AM – 4:00 PM. Maximum platform freedom.
                </p>
              </div>
              <div className="space-y-2 pt-1 font-body-sm text-[12px] text-on-surface">
                {['Chalk allowed & provided', 'Dedicated deadlift drop zones', 'Basement valet parking for members'].map((rule) => (
                  <div key={rule} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary-container" aria-hidden="true" />
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE STICKY BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between gap-4 border-t border-surface-container-high bg-surface-container-lowest/95 p-4 backdrop-blur-xl lg:hidden">
        <div>
          <span className="block font-label-xs-mono text-[11px] text-on-surface-variant">{name.split(' ').slice(0, 2).join(' ')}</span>
          <span className="font-headline-sm text-[18px] font-bold text-primary">
            {showcase?.priceLabel ?? plans[0]?.price ?? '₹2,499'}
            <span className="font-body-sm text-[12px] font-normal text-on-surface-variant">/mo</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setPassReady(false); setTrialOpen(true); }}
            className="rounded-lg bg-surface-container-high px-4 py-2.5 font-label-md text-[12px] font-semibold text-on-surface"
          >
            Free Trial
          </button>
          <button
            onClick={() => { setEnquirySent(false); setEnquiryOpen(true); }}
            className="rounded-lg bg-primary-container px-4 py-2.5 font-label-md text-[12px] font-bold text-on-primary-fixed shadow-md"
          >
            Enquire Now
          </button>
        </div>
      </div>

      {/* MODAL: ENQUIRY */}
      {enquiryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-container-lowest/80 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-label="Direct club enquiry">
          <div className="relative w-full max-w-lg space-y-4 rounded-xl border border-surface-container-high bg-surface-container-low p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-headline-md text-[22px] text-primary">Direct Club Enquiry</h3>
                <p className="font-body-sm text-[12px] text-on-surface-variant">{name} • {area}, {city}</p>
              </div>
              <button className="rounded-lg p-1 text-on-surface-variant hover:text-primary" onClick={() => setEnquiryOpen(false)} aria-label="Close enquiry">
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            {enquirySent ? (
              <div className="space-y-3 py-4 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-primary-container" aria-hidden="true" />
                <p className="font-headline-sm text-[18px] text-primary">Request received!</p>
                <p className="font-body-md text-[14px] text-on-surface-variant">
                  {name} management has received your request and will call you within 2 hours with membership details.
                </p>
                <button onClick={() => setEnquiryOpen(false)} className="w-full rounded-lg bg-surface-container-highest py-3 font-label-md text-[12px] font-semibold text-on-surface hover:text-primary-container">
                  Done
                </button>
              </div>
            ) : (
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  setEnquirySent(true);
                }}
              >
                <div className="space-y-1">
                  <label className="font-label-md text-[12px] font-semibold text-on-surface" htmlFor="modalPlanField">
                    Selected Plan Interest
                  </label>
                  <input
                    id="modalPlanField"
                    className="w-full rounded-lg bg-surface-container-highest px-4 py-2 font-body-md text-[14px] text-on-surface outline-none"
                    readOnly
                    type="text"
                    value={planField}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-label-md text-[12px] font-semibold text-on-surface">Your Full Name</label>
                  <input
                    className="w-full rounded-lg border border-surface-container-highest bg-surface-container px-4 py-2.5 font-body-md text-[14px] text-on-surface outline-none focus:border-primary-container"
                    placeholder="e.g. Aryan Sehgal"
                    required
                    type="text"
                  />
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="font-label-md text-[12px] font-semibold text-on-surface">Phone Number</label>
                    <input
                      className="w-full rounded-lg border border-surface-container-highest bg-surface-container px-4 py-2.5 font-body-md text-[14px] text-on-surface outline-none focus:border-primary-container"
                      placeholder="+91 98765 43210"
                      required
                      type="tel"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-label-md text-[12px] font-semibold text-on-surface">Preferred Time</label>
                    <select className="w-full rounded-lg border border-surface-container-highest bg-surface-container px-4 py-2.5 font-body-md text-[14px] text-on-surface outline-none focus:border-primary-container">
                      <option>Morning (06:00 - 10:00)</option>
                      <option>Afternoon (11:00 - 16:00)</option>
                      <option>Evening (17:00 - 21:00)</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="font-label-md text-[12px] font-semibold text-on-surface">Primary Fitness Goal</span>
                  <div className="flex flex-wrap gap-2">
                    {['Powerlifting', 'Hypertrophy', 'Olympic Lifts', 'S&C / Sauna'].map((goal) => (
                      <label key={goal} className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-surface-container px-3 py-1.5 font-body-sm text-[12px] text-on-surface hover:bg-surface-container-high">
                        <input className="accent-primary-container" name="goal" type="checkbox" value={goal} /> {goal}
                      </label>
                    ))}
                  </div>
                </div>
                <button
                  className="w-full rounded-lg bg-primary-container py-3 font-label-lg text-[14px] font-bold text-on-primary-fixed shadow-md transition-all hover:bg-primary-fixed-dim"
                  type="submit"
                >
                  Request Callback &amp; Exclusive Rate
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: TRIAL */}
      {trialOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-container-lowest/80 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-label="Book trial pass">
          <div className="relative w-full max-w-lg space-y-4 rounded-xl border border-surface-container-high bg-surface-container-low p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-headline-md text-[22px] text-primary">Book 1-Day Trial Pass</h3>
                <p className="font-body-sm text-[12px] text-on-surface-variant">Experience {name} firsthand without fee</p>
              </div>
              <button className="rounded-lg p-1 text-on-surface-variant hover:text-primary" onClick={() => setTrialOpen(false)} aria-label="Close trial">
                <X className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            {passReady ? (
              <div className="space-y-3 py-4 text-center">
                <QrCode className="mx-auto h-12 w-12 text-primary-container" aria-hidden="true" />
                <p className="font-headline-sm text-[18px] text-primary">Pass Generated!</p>
                <p className="font-body-md text-[14px] text-on-surface-variant">
                  Check your SMS and WhatsApp for your entry pass to {name}, {area}.
                </p>
                <button onClick={() => setTrialOpen(false)} className="w-full rounded-lg bg-surface-container-highest py-3 font-label-md text-[12px] font-semibold text-on-surface hover:text-primary-container">
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1 rounded-lg bg-surface-container-highest p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-headline-sm text-[18px] text-primary">Complimentary Guest Pass</span>
                    <span className="font-headline-sm text-[18px] font-bold text-primary-container">FREE</span>
                  </div>
                  <p className="font-body-sm text-[12px] text-on-surface-variant">
                    Includes 1 full day floor access, locker, and 1 contrast sauna cycle.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="font-label-md text-[12px] font-semibold text-on-surface">Target Trial Date</label>
                    <input className="w-full rounded-lg border border-surface-container-highest bg-surface-container px-4 py-2.5 font-body-md text-[14px] text-on-surface outline-none focus:border-primary-container" type="date" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-label-md text-[12px] font-semibold text-on-surface">Your WhatsApp / Phone</label>
                    <input className="w-full rounded-lg border border-surface-container-highest bg-surface-container px-4 py-2.5 font-body-md text-[14px] text-on-surface outline-none focus:border-primary-container" placeholder="+91 98111 22334" type="tel" />
                  </div>
                </div>
                <button
                  onClick={() => setPassReady(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-container py-3 font-label-lg text-[14px] font-bold text-on-primary-fixed shadow-md transition-all hover:bg-primary-fixed-dim"
                >
                  <QrCode className="h-5 w-5" aria-hidden="true" />
                  <span>Generate Digital Entry Pass</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
