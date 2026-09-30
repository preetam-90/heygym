'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, friendlyError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function NewGymPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const gym = await api.createGym({
        name: name.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim() || undefined,
        pincode: pincode.trim() || undefined,
        phone: phone.trim() || undefined,
        description: description.trim() || undefined,
      } as never);
      router.push(`/owner/gyms/${gym.id}`);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-zinc-50">List your gym</h1>
      <p className="mt-1 text-[14px] text-zinc-400">Start with the basics — you can add facilities, plans, photos and hours next.</p>
      <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-zinc-300" htmlFor="gym-name">Gym name *</label>
          <Input id="gym-name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-zinc-300" htmlFor="gym-desc">Description</label>
          <Textarea id="gym-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-zinc-300" htmlFor="gym-address">Address *</label>
          <Input id="gym-address" value={address} onChange={(e) => setAddress(e.target.value)} required minLength={5} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-zinc-300" htmlFor="gym-city">City *</label>
            <Input id="gym-city" value={city} onChange={(e) => setCity(e.target.value)} required minLength={2} />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-zinc-300" htmlFor="gym-state">State</label>
            <Input id="gym-state" value={state} onChange={(e) => setState(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-zinc-300" htmlFor="gym-pin">Pincode</label>
            <Input id="gym-pin" value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="201301" />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-zinc-300" htmlFor="gym-phone">Phone</label>
          <Input id="gym-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        {error && <p className="text-[13px] text-red-300">{error}</p>}
        <Button type="submit" disabled={busy} className="w-full sm:w-auto">{busy ? 'Creating…' : 'Create gym'}</Button>
      </form>
    </div>
  );
}
