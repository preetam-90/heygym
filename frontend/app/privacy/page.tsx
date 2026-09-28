import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy - GymPlatform',
  description: 'How GymPlatform collects, uses, and protects your personal data.',
};

const sections = [
  {
    title: '1. Information We Collect',
    body: [
      'Account information: name, email address, password (hashed), and role (member, gym owner, admin) when you register.',
      'Gym listings: gym name, location, contact details, photos, amenities, and membership plan pricing provided by gym owners.',
      'Usage data: pages visited, searches performed, device type, and approximate location to improve discovery and performance.',
    ],
  },
  {
    title: '2. How We Use Your Information',
    body: [
      'To operate the platform: authentication, gym discovery, membership plan comparison, and owner dashboards.',
      'To communicate: account updates, inquiry notifications, and support responses. We do not sell your personal data.',
      'To improve: aggregated analytics to understand which features and gyms perform best.',
    ],
  },
  {
    title: '3. Sharing & Disclosure',
    body: [
      'With gyms you contact: when you submit an inquiry, your name and contact details are shared with that gym so they can respond.',
      'With service providers: hosting, database (Supabase), and analytics providers who process data only on our instructions.',
      'For legal reasons: if required by law, to protect rights, or to prevent fraud or abuse.',
    ],
  },
  {
    title: '4. Cookies & Tracking',
    body: [
      'We use essential cookies for authentication and session management.',
      'We may use privacy-friendly analytics to measure traffic. You can disable non-essential cookies in your browser settings.',
    ],
  },
  {
    title: '5. Data Retention & Security',
    body: [
      'We retain account data while your account is active and delete or anonymize it upon verified deletion requests, subject to legal retention obligations.',
      'Passwords are hashed, traffic is encrypted over HTTPS, and access to production data is restricted to authorized personnel.',
    ],
  },
  {
    title: '6. Your Rights',
    body: [
      'Access, correct, or delete your personal data from your account settings or by contacting us.',
      'Withdraw consent for marketing communications at any time.',
      'Lodge a complaint with your local data protection authority if you believe your rights have been violated.',
    ],
  },
  {
    title: '7. Children',
    body: [
      'GymPlatform is not directed at children under 13 (or the minimum age in your jurisdiction). We do not knowingly collect data from children.',
    ],
  },
  {
    title: '8. Contact & Changes',
    body: [
      'Questions about this policy: support@gymplatform.example. We will post updates on this page with a revised Last updated date.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="bg-[#09090B]">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 md:py-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 transition-colors hover:text-[#D4FF4F]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to home
        </Link>

        <div className="mt-6 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#D4FF4F]">
            <ShieldCheck className="h-6 w-6 text-black" aria-hidden="true" />
          </span>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4FF4F]">Legal</p>
        </div>
        <h1 className="mt-3 font-display text-4xl font-bold uppercase tracking-tight text-white md:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-zinc-500">Last updated: September 28, 2026</p>
        <p className="mt-6 text-lg leading-relaxed text-zinc-400">
          GymPlatform helps athletes discover gyms and helps owners grow their business.
          This policy explains what data we collect, why, and the choices you have.
        </p>

        <div className="mt-10 space-y-8">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8"
            >
              <h2 className="font-display text-xl font-semibold uppercase tracking-wide text-white">
                {section.title}
              </h2>
              <ul className="mt-4 space-y-3">
                {section.body.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-relaxed text-zinc-400">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#D4FF4F]" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-[#D4FF4F]/20 bg-[#D4FF4F]/5 p-6 text-sm leading-relaxed text-zinc-300">
          Related:{' '}
          <Link href="/terms" className="font-semibold text-[#D4FF4F] hover:underline">
            Terms of Service
          </Link>{' '}
          · <Link href="/gyms" className="font-semibold text-[#D4FF4F] hover:underline">Find gyms</Link>
        </div>
      </div>
    </div>
  );
}
