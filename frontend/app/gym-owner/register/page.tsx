'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';

const gymOwnerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  gymName: z.string().min(2, 'Gym name must be at least 2 characters'),
  gymAddress: z.string().min(5, 'Address is required'),
  gymCity: z.string().min(2, 'City is required'),
  gymPhone: z.string().optional(),
  gymEmail: z.string().email().optional().or(z.literal('')),
  gymDescription: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type GymOwnerForm = z.infer<typeof gymOwnerSchema>;

export default function GymOwnerRegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GymOwnerForm>({
    resolver: zodResolver(gymOwnerSchema),
  });

  const onSubmit = async (data: GymOwnerForm) => {
    setLoading(true);
    setError(null);
    try {
      // Register user as GYM_OWNER
      const authResponse = await api.register({
        name: data.name,
        email: data.email,
        password: data.password,
        role: 'GYM_OWNER',
      });

      // Create gym
      await api.createGym({
        name: data.gymName,
        address: data.gymAddress,
        city: data.gymCity,
        phone: data.gymPhone,
        email: data.gymEmail || undefined,
        description: data.gymDescription,
      });

      router.push('/gym-owner/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-200px)] flex items-center justify-center overflow-hidden py-12 px-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Register as Gym Owner</CardTitle>
          <CardDescription>Create your account and list your gym</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Your Account</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    {...register('name')}
                    disabled={loading}
                    aria-invalid={!!errors.name}
                  />
                  {errors.name && <p className="text-sm text-red-400">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    {...register('email')}
                    disabled={loading}
                    aria-invalid={!!errors.email}
                  />
                  {errors.email && <p className="text-sm text-red-400">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...register('password')}
                    disabled={loading}
                    aria-invalid={!!errors.password}
                  />
                  {errors.password && <p className="text-sm text-red-400">{errors.password.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    {...register('confirmPassword')}
                    disabled={loading}
                    aria-invalid={!!errors.confirmPassword}
                  />
                  {errors.confirmPassword && <p className="text-sm text-red-400">{errors.confirmPassword.message}</p>}
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Gym Information</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gymName">Gym Name</Label>
                  <Input
                    id="gymName"
                    type="text"
                    placeholder="FitLife Gym"
                    {...register('gymName')}
                    disabled={loading}
                    aria-invalid={!!errors.gymName}
                  />
                  {errors.gymName && <p className="text-sm text-red-400">{errors.gymName.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gymCity">City</Label>
                  <Input
                    id="gymCity"
                    type="text"
                    placeholder="New York"
                    {...register('gymCity')}
                    disabled={loading}
                    aria-invalid={!!errors.gymCity}
                  />
                  {errors.gymCity && <p className="text-sm text-red-400">{errors.gymCity.message}</p>}
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="gymAddress">Address</Label>
                  <Input
                    id="gymAddress"
                    type="text"
                    placeholder="123 Fitness Street"
                    {...register('gymAddress')}
                    disabled={loading}
                    aria-invalid={!!errors.gymAddress}
                  />
                  {errors.gymAddress && <p className="text-sm text-red-400">{errors.gymAddress.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gymPhone">Phone (Optional)</Label>
                  <Input
                    id="gymPhone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    {...register('gymPhone')}
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gymEmail">Email (Optional)</Label>
                  <Input
                    id="gymEmail"
                    type="email"
                    placeholder="info@fitlifegym.com"
                    {...register('gymEmail')}
                    disabled={loading}
                    aria-invalid={!!errors.gymEmail}
                  />
                  {errors.gymEmail && <p className="text-sm text-red-400">{errors.gymEmail.message}</p>}
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="gymDescription">Description (Optional)</Label>
                  <textarea
                    id="gymDescription"
                    rows={3}
                    placeholder="Describe your gym facilities, equipment, classes, etc."
                    {...register('gymDescription')}
                    disabled={loading}
                    className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4FF4F]/40 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading} size="lg">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                'Register Gym & Account'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <p className="text-center text-sm text-zinc-400">
            Already have an account?{' '}
            <Link href="/login" className="text-[#D4FF4F] hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}