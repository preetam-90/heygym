'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Menu, X, Dumbbell } from 'lucide-react';

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    router.push('/');
    router.refresh();
  };

  const navLinks = [
    { href: '/gyms', label: 'Find Gyms' },
  ];

  const authLinks = user
    ? [
        { href: '/gym-owner/dashboard', label: 'Owner Dashboard', roles: ['GYM_OWNER', 'ADMIN'] },
        { href: '/admin/dashboard', label: 'Admin Dashboard', roles: ['ADMIN'] },
      ].filter(link => link.roles.includes(user.role))
    : [
        { href: '/login', label: 'Login' },
        { href: '/register', label: 'Register' },
        { href: '/gym-owner/register', label: 'Gym Owner Register' },
      ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#09090B]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 text-xl font-bold text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#D4FF4F]">
            <Dumbbell className="h-5 w-5 text-black" aria-hidden="true" />
          </span>
          <span className="font-display text-2xl uppercase tracking-wide">Gym<span className="text-[#D4FF4F]">Platform</span></span>
        </Link>

        <div className="hidden md:flex md:items-center md:gap-8">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} className="text-sm font-medium text-zinc-400 transition-colors hover:text-white">
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex md:items-center md:gap-3">
          {authLinks.map(link => (
            link.href.includes('register') ? (
              <Link key={link.href} href={link.href}>
                <Button size="sm">{link.label}</Button>
              </Link>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-zinc-400 transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            )
          ))}
          {user && (
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          )}
        </div>

        <div className="flex md:hidden">
          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-zinc-300 hover:bg-white/10"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-white/10 bg-[#0C0C0E] px-4 py-4 md:hidden">
          <div className="space-y-1">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)} className="block rounded-lg px-3 py-3 text-sm font-medium text-zinc-300 hover:bg-white/5 hover:text-white">
                {link.label}
              </Link>
            ))}
            {authLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-3 text-sm font-medium text-zinc-300 hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <Button variant="outline" className="mt-2 w-full" onClick={() => { setMobileMenuOpen(false); handleLogout(); }}>
                Logout
              </Button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
