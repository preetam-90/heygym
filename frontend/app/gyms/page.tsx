'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Gym } from '@/types';
import { GymCard } from '@/components/gym-card';
import { Loader2, Search, Dumbbell } from 'lucide-react';

export default function GymsPage() {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const cities = Array.from(new Set(gyms.map(g => g.city))).sort();

  useEffect(() => {
    fetchGyms();
  }, []);

  const fetchGyms = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getGyms();
      setGyms(data);
    } catch (err) {
      setError('Failed to load gyms');
    } finally {
      setLoading(false);
    }
  };

  const filteredGyms = gyms.filter(gym => {
    const matchesSearch = gym.name.toLowerCase().includes(search.toLowerCase()) ||
      gym.address.toLowerCase().includes(search.toLowerCase());
    const matchesCity = !cityFilter || gym.city === cityFilter;
    return matchesSearch && matchesCity;
  });

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="mb-8">
          <div className="h-9 w-64 animate-pulse rounded-lg bg-zinc-800" />
          <div className="mt-2 h-5 w-96 max-w-full animate-pulse rounded bg-zinc-800/60" />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="overflow-hidden rounded-2xl border border-white/10 bg-[#151518]">
              <div className="aspect-[16/10] animate-pulse bg-zinc-800" />
              <div className="space-y-3 p-5">
                <div className="h-6 w-2/3 animate-pulse rounded bg-zinc-800" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-800/60" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4FF4F]">Browse</p>
        <h1 className="mt-2 font-display text-4xl font-bold uppercase tracking-tight text-white md:text-5xl">Find your perfect gym</h1>
        <p className="mt-2 text-zinc-400">Browse {gyms.length} gyms and compare membership plans</p>
      </div>

      <div className="sticky top-16 z-30 mb-8 flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#0C0C0E]/90 p-3 backdrop-blur sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search gyms by name or address..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Search gyms"
            className="h-11 w-full rounded-[10px] border border-white/10 bg-white/5 pl-10 pr-4 text-sm text-zinc-100 placeholder:text-zinc-400 focus:border-[#D4FF4F] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4FF4F]/40"
          />
        </div>
        <select
          value={cityFilter}
          onChange={e => setCityFilter(e.target.value)}
          aria-label="Filter by city"
          className="h-11 rounded-[10px] border border-white/10 bg-white/5 px-4 text-sm text-zinc-200 focus:border-[#D4FF4F] focus:outline-none [&>option]:bg-zinc-900"
        >
          <option value="">All Cities</option>
          {cities.map(city => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="py-12 text-center" role="alert">
          <p className="text-red-400">{error}</p>
          <button onClick={fetchGyms} className="mt-4 font-semibold text-[#D4FF4F] hover:underline">Retry</button>
        </div>
      )}

      {!error && filteredGyms.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#151518] px-6 py-16 text-center">
          <Dumbbell className="mx-auto mb-4 h-12 w-12 text-zinc-600" aria-hidden="true" />
          <p className="font-display text-2xl font-semibold uppercase text-white">No gyms found</p>
          <p className="mt-2 text-zinc-400">Try a different search or city.</p>
          {(search || cityFilter) && (
            <button onClick={() => { setSearch(''); setCityFilter(''); }} className="mt-4 font-semibold text-[#D4FF4F] hover:underline">Clear filters</button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredGyms.map(gym => (
          <GymCard key={gym.id} gym={gym} />
        ))}
      </div>
    </div>
  );
}
