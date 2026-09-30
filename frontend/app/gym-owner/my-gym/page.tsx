'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft } from 'lucide-react';

const FACILITIES = [
  'Cardio',
  'Weight Training',
  'CrossFit',
  'Yoga',
  'Parking',
  'Locker',
  'Shower',
  'AC',
  'Personal Training',
] as const;

const gymFormSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(120),
    description: z.string().max(2000).optional().or(z.literal('')),
    address: z.string().min(5, 'Address is required'),
    city: z.string().min(2, 'City is required'),
    state: z.string().max(100).optional().or(z.literal('')),
    pincode: z
      .string()
      .regex(/^[1-9][0-9]{5}$/, 'Invalid pincode')
      .optional()
      .or(z.literal('')),
    latitude: z.string().optional().or(z.literal('')),
    longitude: z.string().optional().or(z.literal('')),
    phone: z
      .string()
      .regex(/^[+0-9()\-\s]{7,20}$/, 'Invalid phone number')
      .optional()
      .or(z.literal('')),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    website: z.string().url('Invalid website URL').optional().or(z.literal('')),
    facilities: z.array(z.string()),
    servicesText: z.string().optional().or(z.literal('')),
    openingTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM')
      .optional()
      .or(z.literal('')),
    closingTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM')
      .optional()
      .or(z.literal('')),
  })
  .refine((d) => !(d.openingTime && d.closingTime && d.openingTime === d.closingTime), {
    message: 'Opening and closing times must differ',
    path: ['closingTime'],
  });

type GymForm = z.infer<typeof gymFormSchema>;

const emptyValues: GymForm = {
  name: '',
  description: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  latitude: '',
  longitude: '',
  phone: '',
  email: '',
  website: '',
  facilities: [],
  servicesText: '',
  openingTime: '',
  closingTime: '',
};

export default function MyGymPage() {
  const router = useRouter();
  const [gymId, setGymId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const form = useForm<GymForm>({ resolver: zodResolver(gymFormSchema), defaultValues: emptyValues });

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = async () => {
    try {
      const gyms = await api.getMyGyms();
      const gym = gyms[0];
      if (gym) {
        setGymId(gym.id);
        form.reset({
          name: gym.name ?? '',
          description: gym.description ?? '',
          address: gym.address ?? '',
          city: gym.city ?? '',
          state: gym.state ?? '',
          pincode: gym.pincode ?? '',
          latitude: gym.latitude != null ? String(gym.latitude) : '',
          longitude: gym.longitude != null ? String(gym.longitude) : '',
          phone: gym.phone ?? '',
          email: gym.email ?? '',
          website: gym.website ?? '',
          facilities: gym.facilities ?? [],
          servicesText: (gym.services ?? []).join(', '),
          openingTime: gym.openingTime ?? '',
          closingTime: gym.closingTime ?? '',
        });
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'Session expired. Please log in again.') {
        router.push('/login?redirect=/gym-owner/my-gym');
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to load gym');
    } finally {
      setLoading(false);
    }
  };

  const toggleFacility = (facility: string) => {
    const current = form.getValues('facilities');
    form.setValue('facilities', current.includes(facility) ? current.filter((f) => f !== facility) : [...current, facility], {
      shouldDirty: true,
    });
  };

  const onSubmit = async (values: GymForm) => {
    setSaving(true);
    setError(null);
    setNotice(null);
    const optional = (v: string | undefined) => (v && v.trim() !== '' ? v.trim() : undefined);
    const payload: Record<string, unknown> = {
      name: values.name.trim(),
      address: values.address.trim(),
      city: values.city.trim(),
      description: optional(values.description),
      state: optional(values.state),
      pincode: optional(values.pincode),
      phone: optional(values.phone),
      email: optional(values.email),
      website: optional(values.website),
      facilities: values.facilities,
      services: (values.servicesText ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 30),
      openingTime: optional(values.openingTime),
      closingTime: optional(values.closingTime),
    };
    const lat = optional(values.latitude);
    const lng = optional(values.longitude);
    if (lat !== undefined) {
      const n = Number(lat);
      if (!Number.isFinite(n) || n < -90 || n > 90) {
        setError('Latitude must be between -90 and 90');
        setSaving(false);
        return;
      }
      payload.latitude = n;
    }
    if (lng !== undefined) {
      const n = Number(lng);
      if (!Number.isFinite(n) || n < -180 || n > 180) {
        setError('Longitude must be between -180 and 180');
        setSaving(false);
        return;
      }
      payload.longitude = n;
    }
    try {
      if (gymId) {
        await api.updateGym(gymId, payload);
        setNotice('Gym updated.');
      } else {
        const created = await api.createGym(payload);
        setGymId(created.id);
        setNotice('Gym created. Now add photos to complete your profile.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save gym');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container px-4 py-16">
        <div className="flex justify-center" role="status" aria-label="Loading">
          <Loader2 className="h-8 w-8 animate-spin text-[#D4FF4F]" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link href="/gym-owner/dashboard" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-[#D4FF4F]">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Dashboard
      </Link>
      <h1 className="font-display text-4xl font-bold uppercase tracking-tight text-white">
        {gymId ? 'Manage Gym' : 'Add Your Gym'}
      </h1>
      <p className="mt-1 text-zinc-400">Basic information, location, facilities, services, and hours.</p>

      {error && (
        <div className="mt-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-400" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="mt-6 rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-green-400" role="status">
          {notice}{' '}
          {gymId && (
            <Link href="/gym-owner/my-gym/photos" className="font-semibold underline">
              Manage photos
            </Link>
          )}
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Gym name *</Label>
              <Input id="name" {...form.register('name')} placeholder="ABC Fitness" />
              {form.formState.errors.name && <p className="text-sm text-red-400">{form.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={4} {...form.register('description')} placeholder="About your gym..." />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...form.register('phone')} placeholder="+91 98765 43210" />
                {form.formState.errors.phone && <p className="text-sm text-red-400">{form.formState.errors.phone.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...form.register('email')} placeholder="info@gym.com" />
                {form.formState.errors.email && <p className="text-sm text-red-400">{form.formState.errors.email.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website (optional)</Label>
              <Input id="website" {...form.register('website')} placeholder="https://example.com" />
              {form.formState.errors.website && <p className="text-sm text-red-400">{form.formState.errors.website.message}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Input id="address" {...form.register('address')} placeholder="123 Fitness Street" />
              {form.formState.errors.address && <p className="text-sm text-red-400">{form.formState.errors.address.message}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input id="city" {...form.register('city')} placeholder="Meerut" />
                {form.formState.errors.city && <p className="text-sm text-red-400">{form.formState.errors.city.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" {...form.register('state')} placeholder="Uttar Pradesh" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode</Label>
                <Input id="pincode" {...form.register('pincode')} placeholder="250001" />
                {form.formState.errors.pincode && <p className="text-sm text-red-400">{form.formState.errors.pincode.message}</p>}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude (for future map)</Label>
                <Input id="latitude" inputMode="decimal" {...form.register('latitude')} placeholder="28.66" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude (for future map)</Label>
                <Input id="longitude" inputMode="decimal" {...form.register('longitude')} placeholder="77.71" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gym Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Facilities (select all that apply)</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {FACILITIES.map((facility) => {
                  const active = form.watch('facilities').includes(facility);
                  return (
                    <button
                      key={facility}
                      type="button"
                      onClick={() => toggleFacility(facility)}
                      aria-pressed={active}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                        active ? 'border-[#D4FF4F] bg-[#D4FF4F]/15 text-[#D4FF4F]' : 'border-white/15 text-zinc-300 hover:bg-white/5'
                      }`}
                    >
                      {facility}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="servicesText">Services (comma-separated)</Label>
              <Input id="servicesText" {...form.register('servicesText')} placeholder="Personal Training, Yoga, Diet Plans" />
              <p className="text-xs text-zinc-500">Separate each service with a comma.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="openingTime">Opening time</Label>
                <Input id="openingTime" type="time" {...form.register('openingTime')} />
                {form.formState.errors.openingTime && <p className="text-sm text-red-400">{form.formState.errors.openingTime.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="closingTime">Closing time</Label>
                <Input id="closingTime" type="time" {...form.register('closingTime')} />
                {form.formState.errors.closingTime && <p className="text-sm text-red-400">{form.formState.errors.closingTime.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {gymId ? 'Save Changes' : 'Create Gym'}
          </Button>
          <Link href="/gym-owner/dashboard">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
