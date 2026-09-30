'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, Dumbbell, ArrowRight, Star, Heart } from 'lucide-react';
import type { Gym } from '@/types';
import { facilityNames, gymPhotos, planDuration } from '@/types';
import { photoSrc } from '@/lib/gym-owner';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GymStatusBadge } from '@/components/status-badge';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface GymCardProps {
  gym: Gym;
  showStatus?: boolean;
}

export function GymCard({ gym, showStatus }: GymCardProps) {
  const { user } = useAuth();
  const [imgError, setImgError] = useState(false);
  const [favBusy, setFavBusy] = useState(false);
  const [favError, setFavError] = useState<string | null>(null);

  const plans = gym.membershipPlans ?? [];
  const minPrice = plans.length > 0 ? Math.min(...plans.map((p) => p.price)) : null;
  const minPlan = minPrice != null ? plans.find((p) => p.price === minPrice) : null;
  const photos = gymPhotos(gym);
  const coverSrc = photoSrc(gym.imageUrl ?? photos[0]?.url);
  const showImg = !!coverSrc && !imgError;
  const names = facilityNames(gym);
  const link = `/gyms/${gym.slug || gym.id}`;

  const toggleFavorite = async () => {
    if (!user || favBusy) return;
    setFavBusy(true);
    setFavError(null);
    try {
      await api.addFavorite(gym.id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed';
      if (msg.includes('Already')) {
        try {
          await api.removeFavorite(gym.id);
        } catch {
          setFavError(msg);
        }
      } else {
        setFavError(msg);
      }
    } finally {
      setFavBusy(false);
    }
  };

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
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
        {showStatus ? (
          <span className="absolute left-3 top-3">
            <GymStatusBadge status={gym.status} />
          </span>
        ) : (
          gym.distanceKm != null && (
            <span className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/55 px-2.5 py-1 text-[11px] font-medium text-zinc-200 backdrop-blur-md">
              {gym.distanceKm} km away
            </span>
          )
        )}
        {user && (
          <button
            onClick={toggleFavorite}
            disabled={favBusy}
            aria-label="Save to favorites"
            title={favError ?? 'Save to favorites'}
            className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/55 text-zinc-200 backdrop-blur-md transition-colors hover:text-red-300 disabled:opacity-50"
          >
            <Heart className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
        {minPrice != null && (
          <span className="tabular absolute bottom-3 left-3 rounded-[8px] border border-white/10 bg-black/55 px-2.5 py-1 text-[13px] font-semibold text-white backdrop-blur-md">
            ₹{minPrice.toLocaleString('en-IN')}
            <span className="ml-1 font-normal text-zinc-300">
              {minPlan ? `/ ${planDuration(minPlan)} days` : 'starting'}
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
        {(gym.averageRating != null || (gym.reviewCount ?? 0) > 0) && (
          <p className="flex items-center gap-1.5 text-[13px] text-zinc-300">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
            <strong>{gym.averageRating?.toFixed(1) ?? '—'}</strong>
            <span className="text-zinc-500">({gym.reviewCount ?? 0} reviews)</span>
          </p>
        )}
        {names.length > 0 && (
          <p className="line-clamp-1 text-[12.5px] text-zinc-500">{names.slice(0, 4).join(' · ')}</p>
        )}
        {gym.description && (
          <p className="line-clamp-2 text-[13.5px] leading-relaxed text-zinc-400">{gym.description}</p>
        )}
      </CardContent>
      <CardFooter className="p-5 pt-0">
        <Link href={link} className="w-full" aria-label={`View ${gym.name}`}>
          <Button variant="secondary" className="w-full transition-colors group-hover:border-white/20 group-hover:bg-white/[0.1]">
            View details
            <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
