'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, MapPin, SlidersHorizontal, X, Crosshair } from 'lucide-react';
import { api, friendlyError } from '@/lib/api';
import type { Facility, Gym, GymSort } from '@/types';
import { GymCard } from '@/components/gym-card';
import { EmptyState, ErrorState, LoadingSkeleton, Pagination } from '@/components/ui-states';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const SORT_OPTIONS: Array<{ value: GymSort; label: string }> = [
  { value: 'newest', label: 'Newest' },
  { value: 'rating', label: 'Rating' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'nearest', label: 'Nearest' },
];

const PAGE_SIZE = 12;

function useDebounced(value: string, delay = 400): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function DiscoveryInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [q, setQ] = useState(searchParams.get('q') ?? '');
  const [city, setCity] = useState(searchParams.get('city') ?? '');
  const [selectedFacs, setSelectedFacs] = useState<string[]>(() => {
    const f = searchParams.get('facilities');
    return f ? f.split(',').filter(Boolean) : [];
  });
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') ?? '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') ?? '');
  const [minRating, setMinRating] = useState(searchParams.get('minRating') ?? '');
  const [sort, setSort] = useState<GymSort>((searchParams.get('sort') as GymSort) || 'newest');
  const [page, setPage] = useState(Number(searchParams.get('page') ?? '1') || 1);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState(searchParams.get('radius') ?? '10');

  const debouncedQ = useDebounced(q);
  const debouncedCity = useDebounced(city);

  useEffect(() => {
    api.getFacilities().then(setFacilities).catch(() => null);
  }, []);

  const syncUrl = useCallback(
    (next: Record<string, string | undefined>) => {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(next)) if (v) params.set(k, v);
      router.replace(`/gyms${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false });
    },
    [router],
  );

  const fetchGyms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.searchGyms({
        q: debouncedQ || undefined,
        city: debouncedCity || undefined,
        facilities: selectedFacs.length ? selectedFacs : undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        minRating: minRating ? Number(minRating) : undefined,
        sort,
        page,
        pageSize: PAGE_SIZE,
        lat: coords?.lat,
        lng: coords?.lng,
        radius: coords ? Number(radius) || 10 : undefined,
      });
      setGyms(result.gyms);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, debouncedCity, selectedFacs, minPrice, maxPrice, minRating, sort, page, coords, radius]);

  useEffect(() => {
    syncUrl({
      q: debouncedQ || undefined,
      city: debouncedCity || undefined,
      facilities: selectedFacs.length ? selectedFacs.join(',') : undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      minRating: minRating || undefined,
      sort: sort !== 'newest' ? sort : undefined,
      page: page > 1 ? String(page) : undefined,
      radius: coords ? radius : undefined,
    });
    void fetchGyms();
  }, [debouncedQ, debouncedCity, selectedFacs, minPrice, maxPrice, minRating, sort, page, coords, radius, fetchGyms, syncUrl]);

  const toggleFac = (slug: string) => {
    setPage(1);
    setSelectedFacs((prev) => (prev.includes(slug) ? prev.filter((f) => f !== slug) : [...prev, slug]));
  };

  const useLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setSort('nearest');
        setPage(1);
      },
      () => null,
    );
  };

  const clearFilters = () => {
    setQ('');
    setCity('');
    setSelectedFacs([]);
    setMinPrice('');
    setMaxPrice('');
    setMinRating('');
    setSort('newest');
    setCoords(null);
    setPage(1);
  };

  const hasFilters = q || city || selectedFacs.length || minPrice || maxPrice || minRating || coords;
  const activeFacNames = useMemo(
    () => selectedFacs.map((s) => facilities.find((f) => f.slug === s)?.name ?? s),
    [selectedFacs, facilities],
  );

  const filterPanel = (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-[13px] font-semibold uppercase tracking-wider text-zinc-500">Price (₹/month)</p>
        <div className="flex items-center gap-2">
          <Input inputMode="numeric" placeholder="Min" value={minPrice} onChange={(e) => { setMinPrice(e.target.value); setPage(1); }} aria-label="Minimum price" />
          <span className="text-zinc-500">–</span>
          <Input inputMode="numeric" placeholder="Max" value={maxPrice} onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }} aria-label="Maximum price" />
        </div>
      </div>
      <div>
        <p className="mb-2 text-[13px] font-semibold uppercase tracking-wider text-zinc-500">Rating</p>
        <div className="flex flex-wrap gap-2">
          {['', '3', '4', '4.5'].map((r) => (
            <button
              key={r || 'any'}
              onClick={() => { setMinRating(r); setPage(1); }}
              className={`rounded-full border px-3 py-1.5 text-[13px] transition-colors ${minRating === r ? 'border-lime-300 bg-lime-300/10 text-lime-200' : 'border-white/10 bg-white/5 text-zinc-300 hover:border-white/20'}`}
            >
              {r ? `★ ${r}+` : 'Any'}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-[13px] font-semibold uppercase tracking-wider text-zinc-500">Facilities</p>
        <div className="flex flex-wrap gap-2">
          {facilities.map((f) => (
            <button
              key={f.slug}
              onClick={() => toggleFac(f.slug)}
              aria-pressed={selectedFacs.includes(f.slug)}
              className={`rounded-full border px-3 py-1.5 text-[13px] transition-colors ${selectedFacs.includes(f.slug) ? 'border-lime-300 bg-lime-300/10 text-lime-200' : 'border-white/10 bg-white/5 text-zinc-300 hover:border-white/20'}`}
            >
              {f.name}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-[13px] font-semibold uppercase tracking-wider text-zinc-500">Distance</p>
        {coords ? (
          <div className="flex items-center gap-2">
            <select
              value={radius}
              onChange={(e) => { setRadius(e.target.value); setPage(1); }}
              className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-[14px] text-zinc-100"
              aria-label="Search radius"
            >
              {['5', '10', '25', '50'].map((r) => (
                <option key={r} value={r}>Within {r} km</option>
              ))}
            </select>
            <Button variant="outline" onClick={() => { setCoords(null); setSort('newest'); }}>Clear</Button>
          </div>
        ) : (
          <Button variant="outline" className="w-full" onClick={useLocation}>
            <Crosshair className="mr-2 h-4 w-4" /> Use my location
          </Button>
        )}
      </div>
      {hasFilters && (
        <Button variant="ghost" className="w-full" onClick={clearFilters}>
          <X className="mr-2 h-4 w-4" /> Clear all filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 pt-28">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-50">Discover gyms</h1>
      <p className="mt-2 text-[15px] text-zinc-400">Verified partners, real pricing, real reviews.</p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden="true" />
          <Input placeholder="Gym name, area or facility…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="pl-9" aria-label="Search gyms" />
        </div>
        <div className="relative sm:w-64">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden="true" />
          <Input placeholder="City" value={city} onChange={(e) => { setCity(e.target.value); setPage(1); }} className="pl-9" aria-label="City" />
        </div>
        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value as GymSort); setPage(1); }}
          className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-[14px] text-zinc-100"
          aria-label="Sort gyms"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <Button variant="outline" className="sm:hidden" onClick={() => setFiltersOpen(true)}>
          <SlidersHorizontal className="mr-2 h-4 w-4" /> Filters{selectedFacs.length ? ` (${selectedFacs.length})` : ''}
        </Button>
      </div>

      {activeFacNames.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {activeFacNames.map((n, i) => (
            <button key={n} onClick={() => toggleFac(selectedFacs[i])} className="rounded-full bg-lime-300/10 px-3 py-1 text-[12.5px] text-lime-200">
              {n} ✕
            </button>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-28 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <h2 className="mb-4 text-[15px] font-semibold text-zinc-100">Filters</h2>
            {filterPanel}
          </div>
        </aside>
        <section aria-live="polite">
          {loading ? (
            <LoadingSkeleton lines={4} />
          ) : error ? (
            <ErrorState message={error} onRetry={fetchGyms} />
          ) : gyms.length === 0 ? (
            <EmptyState title="No gyms found" hint="Try widening the price range, removing a facility, or searching a nearby city." action={<Button variant="outline" onClick={clearFilters}>Clear filters</Button>} />
          ) : (
            <>
              <p className="mb-4 text-[13.5px] text-zinc-400">
                Showing <strong className="text-zinc-100">{gyms.length}</strong> of <strong className="text-zinc-100">{total}</strong> verified gyms
              </p>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {gyms.map((gym) => (
                  <GymCard key={gym.id} gym={gym} />
                ))}
              </div>
              <Pagination page={Number(searchParams.get('page') ?? page)} totalPages={totalPages} total={total} onPage={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
            </>
          )}
        </section>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="absolute inset-0 bg-black/70" onClick={() => setFiltersOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-white/10 bg-zinc-950 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[16px] font-semibold text-zinc-100">Filters</h2>
              <button onClick={() => setFiltersOpen(false)} aria-label="Close filters" className="rounded-lg p-2 text-zinc-400 hover:bg-white/5">
                <X className="h-5 w-5" />
              </button>
            </div>
            {filterPanel}
            <Button className="mt-6 w-full" onClick={() => setFiltersOpen(false)}>Show results</Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GymsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 pb-20 pt-28"><LoadingSkeleton lines={4} /></div>}>
      <DiscoveryInner />
    </Suspense>
  );
}
