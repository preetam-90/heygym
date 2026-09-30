'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { useCompareCount } from '@/lib/compare-store';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const compareCount = useCompareCount();
  const router = useRouter();
  const pathname = usePathname();
  const isDiscover = pathname === '/' || pathname.startsWith('/gyms');
  const isCompare = pathname.startsWith('/compare');

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    router.push('/');
    router.refresh();
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-surface-container-high bg-surface-container-lowest/80 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-[1400px] items-center justify-between gap-4 px-6">
        <div className="flex shrink-0 items-center gap-4">
          <Link href="/" className="flex items-center gap-2" aria-label="HeyGym home">
            <span className="font-headline-lg text-[28px] font-extrabold tracking-tight text-primary">
              HEY<span className="text-primary-container">GYM</span>
            </span>
          </Link>
        </div>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
          <Link
            href="/gyms"
            aria-current={isDiscover ? 'page' : undefined}
            className={`transition-colors ${
              isDiscover
                ? 'font-headline-sm text-[18px] font-semibold text-primary-container'
                : 'font-label-lg text-[14px] font-semibold text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Discover
          </Link>
          <Link
            href="/compare"
            aria-current={isCompare ? 'page' : undefined}
            className={`flex items-center gap-1.5 transition-colors ${
              isCompare
                ? 'font-headline-sm text-[18px] font-semibold text-primary-container'
                : 'font-label-lg text-[14px] font-semibold text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Compare{compareCount > 0 ? ` (${compareCount})` : ''}
          </Link>
          <Link
            href="/#how-it-works"
            className="font-label-lg text-[14px] font-semibold text-on-surface-variant transition-colors hover:text-on-surface"
          >
            How it Works
          </Link>
          {user && (user.role === 'GYM_OWNER' || user.role === 'ADMIN') && (
            <Link
              href="/gym-owner/dashboard"
              className="font-label-lg text-[14px] font-semibold text-on-surface-variant transition-colors hover:text-on-surface"
            >
              Owner dashboard
            </Link>
          )}
          {user?.role === 'ADMIN' && (
            <Link
              href="/admin/dashboard"
              className="font-label-lg text-[14px] font-semibold text-on-surface-variant transition-colors hover:text-on-surface"
            >
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/gym-owner/register"
            className="hidden items-center justify-center rounded-lg border border-surface-container-highest bg-surface-container-low px-4 py-2 font-label-lg text-[14px] font-semibold text-on-surface transition-all hover:border-primary-container hover:text-primary-container lg:inline-flex"
          >
            List Your Gym
          </Link>
          {user ? (
            <>
              <span
                className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-container font-label-md text-[12px] font-bold text-on-primary-fixed sm:inline-flex"
                title={user.name}
              >
                {user.name.charAt(0).toUpperCase()}
              </span>
              <button
                onClick={handleLogout}
                className="hidden px-1 font-label-lg text-[14px] font-semibold text-on-surface-variant transition-colors hover:text-on-surface sm:inline-block"
              >
                Log out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="hidden px-1 font-label-lg text-[14px] font-semibold text-on-surface-variant transition-colors hover:text-on-surface sm:inline-block"
            >
              Log in
            </Link>
          )}
          <Link
            href="/gyms"
            className="inline-flex items-center justify-center rounded-lg bg-primary-container px-4 py-2.5 font-label-lg text-[14px] font-bold text-on-primary-fixed shadow-[0_0_20px_rgba(202,243,0,0.25)] transition-all hover:bg-primary-fixed-dim"
          >
            Find My Gym
          </Link>
          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-[10px] text-on-surface transition-colors hover:bg-white/10 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-surface-container-high bg-surface-container-lowest/95 px-4 py-3 backdrop-blur-xl md:hidden">
          <div className="space-y-1">
            <Link href="/gyms" onClick={() => setMobileMenuOpen(false)} className="block rounded-[10px] px-3 py-3 text-[15px] font-medium text-on-surface hover:bg-white/5">
              Discover
            </Link>
            <Link href="/compare" onClick={() => setMobileMenuOpen(false)} className="block rounded-[10px] px-3 py-3 text-[15px] font-medium text-on-surface hover:bg-white/5">
              Compare{compareCount > 0 ? ` (${compareCount})` : ''}
            </Link>
            <Link href="/#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block rounded-[10px] px-3 py-3 text-[15px] font-medium text-on-surface hover:bg-white/5">
              How it Works
            </Link>
            {user ? (
              <Button variant="outline" className="mt-2 w-full" onClick={() => { setMobileMenuOpen(false); handleLogout(); }}>
                Log out
              </Button>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block rounded-[10px] px-3 py-3 text-[15px] font-medium text-on-surface hover:bg-white/5">
                  Log in
                </Link>
                <Link href="/gym-owner/register" onClick={() => setMobileMenuOpen(false)} className="block rounded-[10px] px-3 py-3 text-[15px] font-medium text-on-surface hover:bg-white/5">
                  List Your Gym
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
