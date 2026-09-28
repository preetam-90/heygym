'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { photoSrc } from '@/lib/gym-owner';
import { Gym } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Phone, Mail, DollarSign, ArrowLeft, Dumbbell } from 'lucide-react';
import Link from 'next/link';

export default function GymDetailPage() {
  const params = useParams();
  const gymId = params.id as string;
  const [gym, setGym] = useState<Gym | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const coverSrc = photoSrc(gym?.imageUrl);

  useEffect(() => {
    fetchGym();
  }, [gymId]);

  const fetchGym = async () => {
    try {
      setLoading(true);
      const data = await api.getGymById(gymId);
      setGym(data);
    } catch (err) {
      setError('Failed to load gym details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="flex justify-center" role="status" aria-label="Loading">
          <Loader2 className="h-8 w-8 animate-spin text-[#D4FF4F]" />
        </div>
      </div>
    );
  }

  if (error || !gym) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6" role="alert">
        <p className="text-red-400">{error || 'Gym not found'}</p>
        <Link href="/gyms" className="mt-4 inline-flex items-center gap-2 font-semibold text-[#D4FF4F] hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Gyms
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <Link href="/gyms" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-zinc-400 transition-colors hover:text-[#D4FF4F]">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Gyms
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-800 to-zinc-900">
            {coverSrc && !imgError ? (
              <img src={coverSrc} alt={gym.name} onError={() => setImgError(true)} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-grid">
                <Dumbbell className="h-16 w-16 text-zinc-700" aria-hidden="true" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>

          <div>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-4xl font-bold uppercase tracking-tight text-white md:text-5xl">{gym.name}</h1>
                <p className="mt-2 flex items-center gap-2 text-zinc-400">
                  <MapPin className="h-5 w-5 text-[#D4FF4F]" aria-hidden="true" />
                  {gym.address}, {gym.city}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                gym.status === 'APPROVED' ? 'bg-[#D4FF4F] text-black' :
                gym.status === 'PENDING' ? 'bg-yellow-400 text-black' :
                'bg-red-500 text-white'
              }`}>
                {gym.status}
              </span>
            </div>

            {gym.description && (
              <p className="max-w-none leading-relaxed text-zinc-300">{gym.description}</p>
            )}

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {gym.phone && (
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#151518] p-4">
                  <Phone className="h-5 w-5 text-[#D4FF4F]" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium text-zinc-400">Phone</p>
                    <p className="text-zinc-100">{gym.phone}</p>
                  </div>
                </div>
              )}
              {gym.email && (
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#151518] p-4">
                  <Mail className="h-5 w-5 text-[#D4FF4F]" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-medium text-zinc-400">Email</p>
                    <p className="text-zinc-100">{gym.email}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="mb-4 font-display text-3xl font-bold uppercase tracking-tight text-white">Membership Plans</h2>
            {gym.membershipPlans && gym.membershipPlans.length > 0 ? (
              <div className="grid gap-4">
                {gym.membershipPlans.map(plan => (
                  <Card key={plan.id} className="transition-colors hover:border-[#D4FF4F]/30">
                    <CardContent className="p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                          {plan.description && (
                            <p className="mt-1 text-sm text-zinc-400">{plan.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-display text-3xl font-bold text-[#D4FF4F]">${plan.price}</p>
                            <p className="text-sm text-zinc-400">per {plan.duration} month{plan.duration > 1 ? 's' : ''}</p>
                          </div>
                          <Button>Select Plan</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-10 text-center">
                  <DollarSign className="mx-auto mb-4 h-12 w-12 text-zinc-600" aria-hidden="true" />
                  <h3 className="text-lg font-medium text-white">No Membership Plans</h3>
                  <p className="mt-2 text-zinc-400">This gym hasn&apos;t added any membership plans yet.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-xl uppercase tracking-wide">Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 shrink-0 text-[#D4FF4F]" aria-hidden="true" />
                <div>
                  <p className="text-sm text-zinc-400">Location</p>
                  <p className="text-zinc-100">{gym.address}, {gym.city}</p>
                </div>
              </div>
              {gym.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 shrink-0 text-[#D4FF4F]" aria-hidden="true" />
                  <div>
                    <p className="text-sm text-zinc-400">Phone</p>
                    <p className="text-zinc-100">{gym.phone}</p>
                  </div>
                </div>
              )}
              {gym.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 shrink-0 text-[#D4FF4F]" aria-hidden="true" />
                  <div>
                    <p className="text-sm text-zinc-400">Email</p>
                    <p className="text-zinc-100">{gym.email}</p>
                  </div>
                </div>
              )}
              <Button className="w-full">Join This Gym</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-xl uppercase tracking-wide">Gym Owner</CardTitle>
            </CardHeader>
            <CardContent>
              {gym.owner ? (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D4FF4F]">
                    <span className="font-bold text-black">
                      {gym.owner.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-white">{gym.owner.name}</p>
                    <p className="text-sm text-zinc-400">{gym.owner.email}</p>
                  </div>
                </div>
              ) : (
                <p className="text-zinc-400">Owner information not available</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
