'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, ACCESS_DENIED_MESSAGE } from '@/lib/auth-context';

function resolveRedirectTarget(value: string | null): string {
  if (value && value.startsWith('/') && !value.startsWith('//')) return value;
  return '/gyms-pending';
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = resolveRedirectTarget(searchParams.get('redirect'));
  const errorParam = searchParams.get('error');
  const accessDeniedNotice =
    errorParam === 'forbidden' || errorParam === ACCESS_DENIED_MESSAGE
      ? ACCESS_DENIED_MESSAGE
      : errorParam;
  const { user, isLoading, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Guard: an already-signed-in ADMIN goes straight to the redirect target.
  // requireRole semantics — anyone whose role !== 'ADMIN' stays here and
  // sees access-denied instead of being redirected.
  useEffect(() => {
    if (!isLoading && user && user.role === 'ADMIN') {
      router.replace(redirectTarget);
    }
  }, [isLoading, user, router, redirectTarget]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const loggedIn = await login(email.trim(), password);
      if (loggedIn.role !== 'ADMIN') {
        // Defensive: AuthProvider already clears tokens + throws for
        // non-admins, but never redirect a non-admin anywhere privileged.
        setError(ACCESS_DENIED_MESSAGE);
        return;
      }
      router.replace(redirectTarget);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const notice = error ?? accessDeniedNotice;

  return (
    <section className="mx-auto max-w-md rounded-xl border border-white/10 bg-[#151518] p-8">
      <h1 className="text-2xl font-bold">Admin login</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Sign in with an admin account to access the approval queue.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-300">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-lg border border-white/10 bg-[#09090B] px-3 py-2 text-zinc-100 outline-none focus:border-[#D4FF4F]"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-zinc-300">Password</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-lg border border-white/10 bg-[#09090B] px-3 py-2 text-zinc-100 outline-none focus:border-[#D4FF4F]"
          />
        </label>
        {notice && (
          <div role="alert" className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {notice}
          </div>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-[#D4FF4F] px-4 py-2 text-sm font-bold text-black disabled:opacity-50"
        >
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </section>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
