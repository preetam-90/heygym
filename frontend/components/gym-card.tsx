'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Gym } from '@/types';
import { photoSrc } from '@/lib/gym-owner';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Dumbbell, ArrowRight } from 'lucide-react';

interface GymCardProps {
  gym: Gym;
}

export function GymCard({ gym }: GymCardProps) {
  const [imgError, setImgError] = useState(false);
  const minPrice = gym.membershipPlans && gym.membershipPlans.length > 0
    ? Math.min(...gym.membershipPlans.map(p => p.price))
    : null;
  const minPlan = minPrice != null ? gym.membershipPlans?.find(p => p.price === minPrice) : null;
  const coverSrc = photoSrc(gym.imageUrl);
  const showImg = !!coverSrc && !imgError;

  return (
    <Card className="group flex h-full flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-[#D4FF4F]/30 hover:shadow-[0_16px_50px_rgba(0,0,0,0.5)]">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-900">
        <div className="absolute inset-0 flex items-center justify-center bg-grid">
          <Dumbbell className="h-12 w-12 text-zinc-700" aria-hidden="true" />
        </div>
        {showImg && (
          <img
            src={coverSrc as string}
            alt={gym.name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
        {minPrice != null && (
          <span className="absolute left-3 top-3 rounded-full bg-[#D4FF4F] px-3 py-1 text-xs font-bold text-black">
            From ${minPrice}{minPlan ? `/${minPlan.duration}mo` : ''}
          </span>
        )}
        <span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
          gym.status === 'APPROVED' ? 'bg-[#D4FF4F] text-black' :
          gym.status === 'PENDING' ? 'bg-yellow-400 text-black' :
          'bg-red-500 text-white'
        }`}>
          {gym.status}
        </span>
      </div>
      <CardContent className="flex-1 space-y-3 p-5">
        <div>
          <h3 className="font-display text-2xl font-semibold uppercase tracking-wide text-white">{gym.name}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-400">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-[#D4FF4F]" aria-hidden="true" />
            {gym.address}, {gym.city}
          </p>
        </div>

        {gym.description && (
          <p className="line-clamp-2 text-sm leading-relaxed text-zinc-400">{gym.description}</p>
        )}
      </CardContent>
      <CardFooter className="p-5 pt-0">
        <Link href={`/gyms/${gym.id}`} className="w-full">
          <Button className="w-full">
            View Details
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
