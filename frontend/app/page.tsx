import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dumbbell, Target, Users, Trophy, MapPin, Zap, ArrowRight, Flame, ShieldCheck, Clock } from 'lucide-react';

export default function HomePage() {
  const features = [
    {
      icon: MapPin,
      title: 'Find Gyms Near You',
      description: 'Discover vetted gyms with photos, amenities, and real reviews.',
    },
    {
      icon: Zap,
      title: 'Compare Plans Fast',
      description: 'Prices, durations, and features side-by-side. No hidden fees.',
    },
    {
      icon: Target,
      title: 'Track Progress',
      description: 'Set goals and track your journey with integrated tools.',
    },
    {
      icon: Users,
      title: 'Join The Community',
      description: 'Connect with athletes and find your training partners.',
    },
  ];

  const marquee = ['STRENGTH', 'CONDITIONING', 'POWERLIFTING', 'CROSSFIT', 'BOXING', 'YOGA', 'HIIT', 'BODYBUILDING'];

  return (
    <div className="flex flex-col bg-[#09090B]">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid" aria-hidden="true" />
        <div className="absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-[#D4FF4F]/15 blur-[140px]" aria-hidden="true" />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#09090B] to-transparent" aria-hidden="true" />
        <span className="text-outline pointer-events-none absolute left-1/2 top-8 -translate-x-1/2 select-none whitespace-nowrap font-display text-[18vw] font-bold uppercase leading-none opacity-40" aria-hidden="true">
          TRAIN HARD
        </span>

        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-20 text-center sm:px-6 md:pb-28 md:pt-28">
          <Link href="/gyms" className="inline-flex items-center gap-2 rounded-full border border-[#D4FF4F]/30 bg-[#D4FF4F]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#D4FF4F]">
            <Flame className="h-3.5 w-3.5" aria-hidden="true" />
            500+ gyms live now
          </Link>
          <h1 className="mx-auto mt-6 max-w-4xl font-display text-6xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-7xl md:text-8xl">
            Find your <span className="text-[#D4FF4F]">gym.</span><br />Train harder.
          </h1>
          <p className="mx-auto mb-10 mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400 md:text-xl">
            Discover local gyms, compare membership plans, and start training with confidence. Thousands of gyms. One platform.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/gyms" className="w-full sm:w-auto">
              <Button size="lg" className="w-full px-8 sm:w-auto">
                Find Gyms Near You
                <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
              </Button>
            </Link>
            <Link href="/gym-owner/register" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full px-8 sm:w-auto">
                List Your Gym
              </Button>
            </Link>
          </div>

          <dl className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur md:grid-cols-4">
            {[
              ['500+', 'Gyms Listed'],
              ['50+', 'Cities'],
              ['10K+', 'Athletes'],
              ['200+', 'Plans'],
            ].map(([v, l]) => (
              <div key={l} className="text-center">
                <dt className="sr-only">{l}</dt>
                <dd className="font-display text-3xl font-bold text-[#D4FF4F] md:text-4xl">{v}</dd>
                <dd className="mt-1 text-sm text-zinc-400">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Marquee */}
      <div className="overflow-hidden border-y border-white/10 bg-[#0C0C0E] py-4" aria-hidden="true">
        <div className="flex w-max animate-marquee gap-8">
          {[...marquee, ...marquee].map((m, i) => (
            <span key={i} className="flex items-center gap-8 font-display text-xl font-semibold uppercase tracking-widest text-zinc-600">
              {m} <span className="text-[#D4FF4F]">•</span>
            </span>
          ))}
        </div>
      </div>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28">
        <div className="mb-14 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4FF4F]">Why GymPlatform</p>
          <h2 className="mt-3 font-display text-4xl font-bold uppercase tracking-tight text-white md:text-5xl">Built for people who train</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
            Everything you need to find, compare, and join the best gym for your goals.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature.title} className="group transition-all duration-300 hover:-translate-y-1 hover:border-[#D4FF4F]/30">
              <CardContent className="p-6">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#D4FF4F] transition-transform duration-300 group-hover:scale-110">
                  <feature.icon className="h-6 w-6 text-black" aria-hidden="true" />
                </div>
                <h3 className="font-display text-xl font-semibold uppercase tracking-wide text-white">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-8 w-8 text-[#D4FF4F]" aria-hidden="true" />
              <div>
                <p className="font-semibold text-white">Verified listings</p>
                <p className="text-sm text-zinc-400">Every gym is reviewed by our team.</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-[#D4FF4F]" aria-hidden="true" />
              <div>
                <p className="font-semibold text-white">Real hours & pricing</p>
                <p className="text-sm text-zinc-400">No bait pricing. Updated weekly.</p>
              </div>
            </div>
          </Card>
          <Card className="border-[#D4FF4F]/30 bg-[#D4FF4F] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-2xl font-bold uppercase text-black">Start today</p>
                <p className="text-sm font-medium text-black/70">Free to browse. Easy to join.</p>
              </div>
              <Link href="/gyms">
                <Button variant="secondary" className="bg-black text-[#D4FF4F] hover:bg-zinc-900">Browse<ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-[#D4FF4F]">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 md:py-20">
          <h2 className="mx-auto max-w-3xl font-display text-4xl font-bold uppercase leading-none tracking-tight text-black md:text-6xl">Ready to start training?</h2>
          <p className="mx-auto mb-8 mt-4 max-w-2xl font-medium text-black/70">
            Join thousands of athletes who found their gym through GymPlatform.
          </p>
          <Link href="/gyms">
            <Button size="lg" className="bg-black px-10 text-[#D4FF4F] hover:bg-zinc-900">
              Browse Gyms Now
              <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Owners */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4FF4F]">For owners</p>
            <h2 className="mt-3 font-display text-4xl font-bold uppercase tracking-tight text-white md:text-5xl">List your gym. Fill your floor.</h2>
            <p className="mt-4 text-lg leading-relaxed text-zinc-400">
              Reach more athletes. Manage plans, showcase your facility, and get inquiries directly.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                'Create and manage membership plans',
                'Showcase your facility with photos',
                'Receive inquiries directly',
                'Track performance with analytics',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-zinc-300">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#D4FF4F]/15">
                    <Trophy className="h-3.5 w-3.5 text-[#D4FF4F]" aria-hidden="true" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link href="/gym-owner/register" className="mt-8 inline-block">
              <Button size="lg">Register Your Gym<ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" /></Button>
            </Link>
          </div>
          <Card className="relative overflow-hidden p-10 text-center">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#D4FF4F]/10 blur-[80px]" aria-hidden="true" />
            <Dumbbell className="mx-auto mb-5 h-16 w-16 text-[#D4FF4F]" aria-hidden="true" />
            <h3 className="font-display text-3xl font-bold uppercase text-white">Easy management</h3>
            <p className="mx-auto mt-2 max-w-xs text-zinc-400">Simple dashboard for gyms, plans, and members.</p>
            <div className="mx-auto mt-6 grid max-w-xs grid-cols-2 gap-3 text-left">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="font-display text-2xl font-bold text-[#D4FF4F]">+38%</p>
                <p className="text-xs text-zinc-400">avg. inquiries</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="font-display text-2xl font-bold text-white">5 min</p>
                <p className="text-xs text-zinc-400">to list your gym</p>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
