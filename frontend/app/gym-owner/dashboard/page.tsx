'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Gym, MembershipPlan, User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Edit, Dumbbell, Users, DollarSign, Calendar, LogOut, ChevronDown, ChevronUp } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const createGymSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
});

type CreateGymForm = z.infer<typeof createGymSchema>;

const createPlanSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  duration: z.number().int().positive('Duration must be positive'),
});

type CreatePlanForm = z.infer<typeof createPlanSchema>;

export default function GymOwnerDashboardPage() {
  const router = useRouter();
  const { user: authUser, logout } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateGym, setShowCreateGym] = useState(false);
  const [expandedGymId, setExpandedGymId] = useState<string | null>(null);
  const [creatingPlanForGym, setCreatingPlanForGym] = useState<string | null>(null);

  const createGymForm = useForm<CreateGymForm>({
    resolver: zodResolver(createGymSchema),
    defaultValues: { name: '', address: '', city: '', description: '', phone: '', email: '' },
  });

  const createPlanForm = useForm<CreatePlanForm>({
    resolver: zodResolver(createPlanSchema),
    defaultValues: { name: '', description: '', price: 0, duration: 1 },
  });

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    try {
      // Verify the session with the server — never trust localStorage alone.
      let current = authUser;
      if (!current) {
        try {
          current = await api.me();
        } catch {
          current = null;
        }
      }
      if (!current) {
        router.push('/login?redirect=/gym-owner/dashboard');
        return;
      }
      if (current.role !== 'GYM_OWNER' && current.role !== 'ADMIN') {
        router.push('/');
        return;
      }
      setUser(current);
      await fetchGyms();
    } catch (err) {
      router.push('/login?redirect=/gym-owner/dashboard');
    }
  };

  const fetchGyms = async () => {
    try {
      const data = await api.getMyGyms();
      setGyms(data);
    } catch (err) {
      setError('Failed to load gyms');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGym = async (data: CreateGymForm) => {
    try {
      await api.createGym(data);
      createGymForm.reset();
      setShowCreateGym(false);
      await fetchGyms();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create gym');
    }
  };

  const handleCreatePlan = async (gymId: string, data: CreatePlanForm) => {
    try {
      await api.createMembershipPlan(gymId, data);
      createPlanForm.reset();
      setCreatingPlanForGym(null);
      await fetchGyms();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create plan');
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="container px-4 py-16">
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#D4FF4F]" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4FF4F]">Manage</p><h1 className="mt-1 font-display text-4xl font-bold uppercase tracking-tight text-white">Owner Dashboard</h1>
          <p className="text-zinc-400">Manage your gyms and membership plans</p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#D4FF4F]/15 rounded-lg flex items-center justify-center">
                <Dumbbell className="h-6 w-6 text-[#D4FF4F]" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">Total Gyms</p>
                <p className="text-2xl font-bold text-white">{gyms.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/15 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">Total Plans</p>
                <p className="text-2xl font-bold text-white">
                  {gyms.reduce((acc, gym) => acc + (gym.membershipPlans?.length || 0), 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/15 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">Approved Gyms</p>
                <p className="text-2xl font-bold text-white">
                  {gyms.filter(g => g.status === 'APPROVED').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Gym Form */}
      {showCreateGym && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New Gym</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createGymForm.handleSubmit(handleCreateGym)} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Gym Name</Label>
                  <Input
                    id="name"
                    {...createGymForm.register('name')}
                    placeholder="FitLife Gym"
                  />
                  {createGymForm.formState.errors.name && (
                    <p className="text-sm text-red-400">{createGymForm.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    {...createGymForm.register('city')}
                    placeholder="New York"
                  />
                  {createGymForm.formState.errors.city && (
                    <p className="text-sm text-red-400">{createGymForm.formState.errors.city.message}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  {...createGymForm.register('address')}
                  placeholder="123 Fitness Street"
                />
                {createGymForm.formState.errors.address && (
                  <p className="text-sm text-red-400">{createGymForm.formState.errors.address.message}</p>
                )}
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (Optional)</Label>
                  <Input id="phone" {...createGymForm.register('phone')} placeholder="+1 (555) 123-4567" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input id="email" type="email" {...createGymForm.register('email')} placeholder="info@gym.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <textarea
                  id="description"
                  rows={3}
                  {...createGymForm.register('description')}
                  placeholder="Describe your gym..."
                  className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-4">
                <Button type="submit">Create Gym</Button>
                <Button type="button" variant="outline" onClick={() => { setShowCreateGym(false); createGymForm.reset(); }}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Gyms List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-white">Your Gyms</h2>
          <Button onClick={() => setShowCreateGym(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Gym
          </Button>
        </div>

        {gyms.length === 0 && !showCreateGym && (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Dumbbell className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white">No Gyms Yet</h3>
              <p className="mt-2 text-zinc-400">Get started by adding your first gym.</p>
              <Button className="mt-4" onClick={() => setShowCreateGym(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Gym
              </Button>
            </CardContent>
          </Card>
        )}

        {gyms.map(gym => (
          <Card key={gym.id} className="overflow-hidden">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{gym.name}</CardTitle>
                  <p className="text-sm text-zinc-400">{gym.address}, {gym.city}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    gym.status === 'APPROVED' ? 'bg-green-500/15 text-green-400' :
                    gym.status === 'PENDING' ? 'bg-yellow-500/15 text-yellow-400' :
                    'bg-red-500/15 text-red-400'
                  }`}>
                    {gym.status}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setExpandedGymId(expandedGymId === gym.id ? null : gym.id)}
                  >
                    {expandedGymId === gym.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardHeader>

            {expandedGymId === gym.id && (
              <CardContent className="pt-0">
                <div className="space-y-6">
                  {/* Membership Plans */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Membership Plans</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCreatingPlanForGym(creatingPlanForGym === gym.id ? null : gym.id)}
                      >
                        <Plus className="mr-1 h-4 w-4" />
                        Add Plan
                      </Button>
                    </div>

                    {creatingPlanForGym === gym.id && (
                      <form onSubmit={createPlanForm.handleSubmit(d => handleCreatePlan(gym.id, d))} className="space-y-4 p-4 bg-white/[0.03] rounded-lg mb-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`plan-name-${gym.id}`}>Plan Name</Label>
                            <Input
                              id={`plan-name-${gym.id}`}
                              {...createPlanForm.register('name')}
                              placeholder="Basic Monthly"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`plan-duration-${gym.id}`}>Duration (months)</Label>
                            <Input
                              id={`plan-duration-${gym.id}`}
                              type="number"
                              {...createPlanForm.register('duration', { valueAsNumber: true })}
                              placeholder="1"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`plan-price-${gym.id}`}>Price ($)</Label>
                          <Input
                            id={`plan-price-${gym.id}`}
                            type="number"
                            step="0.01"
                            {...createPlanForm.register('price', { valueAsNumber: true })}
                            placeholder="49.99"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`plan-description-${gym.id}`}>Description (Optional)</Label>
                          <textarea
                            id={`plan-description-${gym.id}`}
                            rows={2}
                            {...createPlanForm.register('description')}
                            placeholder="Plan details..."
                            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit" size="sm">Create Plan</Button>
                          <Button type="button" variant="outline" size="sm" onClick={() => { setCreatingPlanForGym(null); createPlanForm.reset(); }}>
                            Cancel
                          </Button>
                        </div>
                      </form>
                    )}

                    {gym.membershipPlans && gym.membershipPlans.length > 0 ? (
                      <div className="space-y-3">
                        {gym.membershipPlans.map(plan => (
                          <div key={plan.id} className="flex items-center justify-between p-4 bg-white/[0.03] rounded-lg">
                            <div>
                              <p className="font-medium text-white">{plan.name}</p>
                              {plan.description && <p className="text-sm text-zinc-400">{plan.description}</p>}
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="font-semibold text-[#D4FF4F]">${plan.price}</p>
                                <p className="text-sm text-zinc-400">per {plan.duration} month{plan.duration > 1 ? 's' : ''}</p>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => alert('Edit not implemented yet')}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-zinc-400 text-center py-4">No membership plans yet. Click "Add Plan" to create one.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}