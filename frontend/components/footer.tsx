import Link from 'next/link';
import { Dumbbell } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0C0C0E]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5 text-xl font-bold text-white">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#D4FF4F]">
                <Dumbbell className="h-5 w-5 text-black" aria-hidden="true" />
              </span>
              <span className="font-display text-2xl uppercase tracking-wide">Gym<span className="text-[#D4FF4F]">Platform</span></span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-zinc-400">
              Train harder. Find the best gyms, compare membership plans, and achieve your goals.
            </p>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-zinc-300">Discover</h3>
            <ul className="mt-4 space-y-2.5">
              <li><Link href="/gyms" className="text-sm text-zinc-400 transition-colors hover:text-[#D4FF4F]">Find Gyms</Link></li>
              <li><Link href="/gyms" className="text-sm text-zinc-400 transition-colors hover:text-[#D4FF4F]">Membership Plans</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-zinc-300">For Owners</h3>
            <ul className="mt-4 space-y-2.5">
              <li><Link href="/gym-owner/register" className="text-sm text-zinc-400 transition-colors hover:text-[#D4FF4F]">Register Your Gym</Link></li>
              <li><Link href="/gym-owner/dashboard" className="text-sm text-zinc-400 transition-colors hover:text-[#D4FF4F]">Owner Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-zinc-300">Legal</h3>
            <ul className="mt-4 space-y-2.5">
              <li><Link href="#" className="text-sm text-zinc-400 transition-colors hover:text-[#D4FF4F]">Privacy Policy</Link></li>
              <li><Link href="#" className="text-sm text-zinc-400 transition-colors hover:text-[#D4FF4F]">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-8 text-center text-sm text-zinc-500">
          <p>&copy; {new Date().getFullYear()} GymPlatform. All rights reserved. Built for athletes.</p>
        </div>
      </div>
    </footer>
  );
}
