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

const STATUS_DOT: Record<string, string> = {
  APPROVED: 'bg-emerald-400',
  PENDING: 'bg-amber-400',
  REJECTED: 'bg-red-400',
};

export function GymCard({ gym }: GymCardProps) {
  const [imgError, setImgError] = useState(false);
  const minPrice = gym.membershipPlans && gym.membershipPlans.length > 0
    ? Math.min(...gym.membershipPlans.map(p => p.price))
    : null;
  const minPlan = minPrice != null ? gym.membershipPlans?.find(p => p.price === minPrice) : null;
  const coverSrc = photoSrc(gym.imageUrl);
  const showImg = !!coverSrc && !imgError;

  return (
    <Card className="card-lift group flex h-full flex-col overflow-hidden">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-zinc-800/60 to-zinc-900">
        <div className="absolute inset-0 flex items-center justify-center bg-grid opacity-60">
          <Dumbbell className="h-11 w-11 text-zinc-700/80" aria-hidden="true" />
        </div>
        {showImg && (
          <img
            src={coverSrc as string}
            alt={gym.name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent pointer-events-none" />
        {/* Status — quiet dot + label, not loud pill */}
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/55 px-2.5 py-1 text-[11px] font-medium tracking-wide text-zinc-200 backdrop-blur-md">
          <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[gym.status] ?? 'bg-zinc-400'}`} aria-hidden="true" />
          {gym.status.charAt(0) + gym.status.slice(1).toLowerCase()}
        </span>
        {minPrice != null && (
          <span className="absolute bottom-3 left-3 rounded-[8px] border border-white/10 bg-black/55 px-2.5 py-1 text-[13px] font-semibold text-white backdrop-blur-md tabular">
            ${minPrice}
            <span className="ml-1 font-normal text-zinc-300">
              {minPlan ? `/ ${minPlan.duration} mo` : 'starting'}
            </span>
          </span>
        )}
      </div>
      <CardContent className="flex-1 space-y-2.5 p-5">
        <div>
          <h3 className="text-balance text-[17px] font-semibold tracking-[-0.015em] text-zinc-50">{gym.name}</h3>
          <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-zinc-400">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden="true" />
            {gym.address}, {gym.city}
          </p>
        </div>

        {gym.description && (
          <p className="line-clamp-2 text-[13.5px] leading-relaxed text-zinc-400">{gym.description}</p>
        )}
      </CardContent>
      <CardFooter className="p-5 pt-0">
        <Link href={`/gyms/${gym.id}`} className="w-full" aria-label={`View ${gym.name}`}>
          <Button variant="secondary" className="w-full transition-colors group-hover:border-white/20 group-hover:bg-white/[0.1]">
            View details
            <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
