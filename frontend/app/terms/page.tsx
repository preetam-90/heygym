import type { Metadata } from 'next';
import Link from 'next/link';
import { FileText, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service - GymPlatform',
  description: 'Rules and conditions for using GymPlatform as a member or gym owner.',
};

const sections = [
  {
    title: '1. Acceptance & Eligibility',
    body: [
      'By accessing GymPlatform you agree to these terms. If you do not agree, do not use the platform.',
      'You must be at least 13 years old (or the minimum age in your jurisdiction) and able to enter a binding agreement.',
    ],
  },
  {
    title: '2. What GymPlatform Provides',
    body: [
      'A discovery marketplace: browse gyms, compare membership plans, and send inquiries to gyms.',
      'Owner tools: register a gym, manage listings, plans, and respond to inquiries via the owner dashboard.',
      'We are not a gym operator. Contracts for memberships are between you and the gym directly.',
    ],
  },
  {
    title: '3. Accounts & Responsibilities',
    body: [
      'Keep your credentials confidential. You are responsible for activity under your account.',
      'Provide accurate information when registering, listing a gym, or submitting inquiries.',
      'Notify us promptly of unauthorized access at support@gymplatform.example.',
    ],
  },
  {
    title: '4. Rules For Gym Owners',
    body: [
      'Only list gyms you are authorized to represent. Listings, photos, hours, and pricing must be truthful and up to date.',
      'Do not post misleading bait pricing, fake reviews, or content you do not own or have rights to.',
      'Respond to inquiries honestly. We may suspend listings that generate repeated complaints of fraud or misrepresentation.',
    ],
  },
  {
    title: '5. Acceptable Use',
    body: [
      'No scraping, spamming, harassing other users, or attempting to disrupt the platform.',
      'No uploading malware, infringing content, or unlawful material.',
      'We may suspend or terminate accounts that violate these rules.',
    ],
  },
  {
    title: '6. Memberships, Payments & Refunds',
    body: [
      'GymPlatform displays plan prices provided by gyms. Actual billing is handled by the gym unless stated otherwise.',
      'Verify price, duration, freeze/cancellation terms, and trial conditions with the gym before paying.',
      'Refund disputes must be resolved with the gym. We will reasonably assist with inquiry records on request.',
    ],
  },
  {
    title: '7. Intellectual Property',
    body: [
      'The platform, branding, and design are owned by GymPlatform. Gym photos and logos remain property of their respective owners.',
      'By uploading content you grant us a non-exclusive license to display it on GymPlatform for discovery purposes.',
    ],
  },
  {
    title: '8. Disclaimers & Liability',
    body: [
      'The service is provided “as is” without warranties of any kind to the maximum extent permitted by law.',
      'We do not guarantee gym availability, results, or uninterrupted service. Verify health and safety suitability with the gym and your physician.',
      'To the maximum extent permitted by law, GymPlatform is not liable for indirect, incidental, or consequential damages arising from gym memberships or third-party conduct.',
    ],
  },
  {
    title: '9. Termination & Changes',
    body: [
      'You may delete your account at any time. We may suspend or terminate access for violations or to protect the platform.',
      'We may update these terms and will post the revised version here with a new Last updated date. Continued use after changes constitutes acceptance.',
    ],
  },
  {
    title: '10. Contact & Governing Law',
    body: [
      'Questions: support@gymplatform.example.',
      'Unless otherwise required by local law, these terms are governed by the laws of India, with disputes subject to the courts of Bengaluru, Karnataka.',
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="bg-[#09090B]">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 md:py-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 transition-colors hover:text-volt"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to home
        </Link>

        <div className="mt-6 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-volt">
            <FileText className="h-6 w-6 text-black" aria-hidden="true" />
          </span>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-volt">Legal</p>
        </div>
        <h1 className="mt-3 font-display text-4xl font-bold uppercase tracking-tight text-white md:text-5xl">
          Terms of Service
        </h1>
        <p className="mt-3 text-sm text-zinc-500">Last updated: September 28, 2026</p>
        <p className="mt-6 text-lg leading-relaxed text-zinc-400">
          These terms govern your use of GymPlatform, whether you are finding a gym
          or listing one. Please read them carefully.
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
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-volt" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-volt/20 bg-volt/5 p-6 text-sm leading-relaxed text-zinc-300">
          Related:{' '}
          <Link href="/privacy" className="font-semibold text-volt hover:underline">
            Privacy Policy
          </Link>{' '}
          · <Link href="/gym-owner/register" className="font-semibold text-volt hover:underline">List your gym</Link>
        </div>
      </div>
    </div>
  );
}
