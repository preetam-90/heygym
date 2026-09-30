import Link from 'next/link';

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Cities',
    links: [
      { label: 'New York', href: '/gyms' },
      { label: 'Los Angeles', href: '/gyms' },
      { label: 'Miami', href: '/gyms' },
      { label: 'London', href: '/gyms' },
      { label: 'Austin', href: '/gyms' },
    ],
  },
  {
    title: 'Amenities',
    links: [
      { label: 'Cold Plunge & Sauna', href: '/gyms' },
      { label: 'Olympic Lifting Platforms', href: '/gyms' },
      { label: '24/7 Biometric Access', href: '/gyms' },
      { label: 'Hyperbaric & Recovery', href: '/gyms' },
      { label: 'Coworking Lounges', href: '/gyms' },
    ],
  },
  {
    title: 'For Owners',
    links: [
      { label: 'List Facility', href: '/gym-owner/register' },
      { label: 'Club Partner Software', href: '/gym-owner/dashboard' },
      { label: 'Pass Verification', href: '/gym-owner/dashboard' },
      { label: 'Marketplace Insights', href: '/gym-owner/dashboard' },
    ],
  },
  {
    title: 'Platform',
    links: [
      { label: 'iOS & Android Apps', href: '/gyms' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Privacy Protocol', href: '/privacy' },
      { label: 'Verified Badging Policy', href: '/terms' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="w-full border-t border-surface-container-high bg-surface-container-lowest py-10">
      <div className="mx-auto max-w-[1400px] px-6">
        <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-6">
          <div className="space-y-4 lg:col-span-2">
            <div className="font-headline-lg text-[28px] font-extrabold tracking-tight text-primary">
              HEY<span className="text-primary-container">GYM</span>
            </div>
            <p className="max-w-sm font-body-md text-[14px] text-on-surface-variant">
              All gyms. One place. Better decisions. Curating the world&apos;s most disciplined training spaces, private
              athletics clubs, and boutique performance facilities.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-primary-container" aria-hidden="true" />
              <span className="font-label-xs-mono text-[11px] font-bold uppercase tracking-wider text-secondary">
                Live Marketplace Updates
              </span>
            </div>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="mb-4 font-label-lg text-[14px] font-semibold uppercase tracking-wider text-primary">
                {col.title}
              </h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li
                    key={link.label}
                    className="font-body-sm text-[12px] text-on-surface-variant transition-colors hover:text-on-surface"
                  >
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center justify-between gap-4 border-t border-surface-container-high pt-6 sm:flex-row">
          <div className="font-body-sm text-[12px] text-secondary">
            © 2025 HeyGym Technologies Inc. All rights reserved. Architectural fitness discovery.
          </div>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="font-label-md text-[12px] font-semibold text-on-surface-variant transition-colors hover:text-primary">
              Privacy
            </Link>
            <Link href="/terms" className="font-label-md text-[12px] font-semibold text-on-surface-variant transition-colors hover:text-primary">
              Security
            </Link>
            <Link href="/terms" className="font-label-md text-[12px] font-semibold text-on-surface-variant transition-colors hover:text-primary">
              Compliance
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
