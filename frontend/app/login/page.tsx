'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2, Dumbbell, ShieldCheck, ArrowRight } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const redirect = searchParams.get('redirect') ?? '/';
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setError(null);
    try {
      await login(data.email, data.password);
      router.push(redirect);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden">
      <div className="absolute left-1/2 top-0 h-[320px] w-[620px] -translate-x-1/2 rounded-full bg-[#D4FF4F]/[0.06] blur-[120px]" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-5xl items-stretch gap-5 px-4 py-12 sm:px-6 md:grid-cols-[1.05fr_0.95fr] md:py-16">
        {/* Form */}
        <Card className="surface-premium w-full rounded-[20px]">
          <CardHeader className="pb-2 pt-7 text-left">
            <CardTitle className="text-[24px] tracking-[-0.02em]">Welcome back</CardTitle>
            <CardDescription className="mt-1.5 text-[14px]">Sign in to continue training.</CardDescription>
          </CardHeader>
          <CardContent className="pb-7 pt-5">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2.5 rounded-[12px] border border-red-500/25 bg-red-500/[0.08] p-3.5 text-[13.5px] text-red-300" role="alert">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...register('email')}
                  disabled={loading}
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <p className="text-[13px] text-red-400">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/forgot-password" className="text-[13px] font-medium text-zinc-400 transition-colors hover:text-[#D4FF4F]">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...register('password')}
                  disabled={loading}
                  aria-invalid={!!errors.password}
                />
                {errors.password && (
                  <p className="text-[13px] text-red-400">{errors.password.message}</p>
                )}
              </div>

              <Button type="submit" className="h-[48px] w-full text-[15px]" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>
            <div className="mt-6 space-y-2.5 border-t border-white/[0.07] pt-6 text-center">
              <p className="text-[13.5px] text-zinc-500">
                New here?{' '}
                <Link href="/register" className="font-semibold text-zinc-200 hover:text-[#D4FF4F]">
                  Create an account
                </Link>
              </p>
              <p className="text-[13px] text-zinc-600">
                Own a gym?{' '}
                <Link href="/gym-owner/register" className="font-medium text-zinc-400 hover:text-[#D4FF4F]">
                  List your facility
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Proof side — tinted neutral, one asset (auth recipe) */}
        <aside className="relative hidden overflow-hidden rounded-[20px] border border-white/[0.08] bg-gradient-to-b from-white/[0.05] to-white/[0.015] bg-[#101013] p-8 md:flex md:flex-col md:justify-between">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#D4FF4F]/[0.08] blur-[70px]" aria-hidden="true" />
          <div className="absolute inset-0 bg-grid opacity-70" aria-hidden="true" />
          <div className="relative">
            <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#D4FF4F]">
              <Dumbbell className="h-5 w-5 text-black" aria-hidden="true" />
            </span>
            <p className="mt-6 font-display text-[30px] font-semibold leading-[1.05] tracking-[-0.02em] text-white">
              “Found my gym in one evening. Joined the next morning.”
            </p>
            <p className="mt-3 text-[13.5px] text-zinc-400">— Amara, member since 2024 · 4.9 rated gym in Austin</p>
          </div>
          <div className="relative mt-8 space-y-3">
            <div className="flex items-center gap-3 rounded-[14px] border border-white/[0.08] bg-black/30 p-4 backdrop-blur">
              <ShieldCheck className="h-5 w-5 shrink-0 text-[#D4FF4F]" aria-hidden="true" />
              <p className="text-[13px] leading-relaxed text-zinc-300">Verified listings · honest pricing · no hidden fees</p>
            </div>
            <Link href="/gyms" className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-zinc-300 hover:text-[#D4FF4F]">
              Browse gyms first <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-[#D4FF4F]" /></div>}>
      <LoginPageContent />
    </Suspense>
  );
}
