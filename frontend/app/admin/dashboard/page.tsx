'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Gym, User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Users, Dumbbell, Clock, CheckCircle, XCircle, AlertCircle, LogOut } from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [stats, setStats] = useState<{ totalUsers: number; totalGyms: number; pendingGyms: number; approvedGyms: number; rejectedGyms: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'gyms'>('stats');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const storedUser = api.getStoredUser();
      if (!storedUser) {
        router.push('/login');
        return;
      }
      if (storedUser.role !== 'ADMIN') {
        router.push('/');
        return;
      }
      await Promise.all([fetchStats(), fetchUsers(), fetchGyms()]);
    } catch (err) {
      router.push('/login');
    }
  };

  const fetchStats = async () => {
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats');
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users');
    }
  };

  const fetchGyms = async () => {
    try {
      const data = await api.getAllGyms();
      setGyms(data);
    } catch (err) {
      console.error('Failed to load gyms');
    } finally {
      setLoading(false);
    }
  };

  const handleGymStatusChange = async (gymId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await api.updateGymStatus(gymId, status);
      await fetchGyms();
      await fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update gym status');
    }
  };

  const handleLogout = async () => {
    await api.logout();
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#D4FF4F]">Control</p><h1 className="mt-1 font-display text-4xl font-bold uppercase tracking-tight text-white">Admin Dashboard</h1>
          <p className="text-zinc-400">Platform overview and management</p>
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

      {/* Tabs */}
      <div className="border-b border-white/10 mb-6">
        <nav className="flex gap-8" aria-label="Admin tabs">
          {[
            { id: 'stats', label: 'Overview', icon: AlertCircle },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'gyms', label: 'Gyms', icon: Dumbbell },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex min-h-[44px] items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[#D4FF4F] text-[#D4FF4F]'
                  : 'border-transparent text-zinc-400 hover:text-zinc-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Stats Tab */}
      {activeTab === 'stats' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#D4FF4F]/15 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-[#D4FF4F]" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">Total Users</p>
                    <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500/15 rounded-lg flex items-center justify-center">
                    <Dumbbell className="h-6 w-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">Total Gyms</p>
                    <p className="text-2xl font-bold text-white">{stats.totalGyms}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-yellow-500/15 rounded-lg flex items-center justify-center">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">Pending Approval</p>
                    <p className="text-2xl font-bold text-white">{stats.pendingGyms}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-500/15 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">Approved</p>
                    <p className="text-2xl font-bold text-white">{stats.approvedGyms}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-500/15 rounded-lg flex items-center justify-center">
                    <XCircle className="h-6 w-6 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">Rejected</p>
                    <p className="text-2xl font-bold text-white">{stats.rejectedGyms}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-zinc-400 border-b border-white/10">
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Role</th>
                    <th className="pb-3 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-white/[0.03]">
                      <td className="py-4 font-medium">{user.name}</td>
                      <td className="py-4 text-zinc-400">{user.email}</td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.role === 'ADMIN' ? 'bg-purple-500/15 text-purple-400' :
                          user.role === 'GYM_OWNER' ? 'bg-blue-500/15 text-blue-400' :
                          'bg-white/5 text-zinc-200'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-4 text-zinc-400 text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gyms Tab */}
      {activeTab === 'gyms' && (
        <Card>
          <CardHeader>
            <CardTitle>All Gyms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-zinc-400 border-b border-white/10">
                    <th className="pb-3 font-medium">Gym Name</th>
                    <th className="pb-3 font-medium">Owner</th>
                    <th className="pb-3 font-medium">City</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Plans</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {gyms.map(gym => (
                    <tr key={gym.id} className="hover:bg-white/[0.03]">
                      <td className="py-4 font-medium">{gym.name}</td>
                      <td className="py-4 text-zinc-400">{gym.owner?.name || 'N/A'}</td>
                      <td className="py-4 text-zinc-400">{gym.city}</td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          gym.status === 'APPROVED' ? 'bg-green-500/15 text-green-400' :
                          gym.status === 'PENDING' ? 'bg-yellow-500/15 text-yellow-400' :
                          'bg-red-500/15 text-red-400'
                        }`}>
                          {gym.status}
                        </span>
                      </td>
                      <td className="py-4 text-zinc-400">{gym.membershipPlans?.length || 0}</td>
                      <td className="py-4">
                        {gym.status === 'PENDING' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleGymStatusChange(gym.id, 'APPROVED')}
                              className="bg-[#D4FF4F] text-black hover:brightness-110"
                            >
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleGymStatusChange(gym.id, 'REJECTED')}
                            >
                              <XCircle className="mr-1 h-3 w-3" />
                              Reject
                            </Button>
                          </div>
                        )}
                        {gym.status !== 'PENDING' && (
                          <span className="text-sm text-zinc-400">No action needed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}