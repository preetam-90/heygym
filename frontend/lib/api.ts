import type { ApiResponse, AuthResponse, User, Gym, MembershipPlan } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken');
    }
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('accessToken', token);
      } else {
        localStorage.removeItem('accessToken');
      }
    }
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message ?? 'Request failed');
    }

    return data;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (response.data) {
      this.setAccessToken(response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data!;
  }

  async register(data: { name: string; email: string; password: string; role?: string }): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (response.data) {
      this.setAccessToken(response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data!;
  }

  async logout(): Promise<void> {
    await this.request('/auth/logout', { method: 'POST' });
    this.setAccessToken(null);
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  async me(): Promise<User> {
    const response = await this.request<{ user: User }>('/auth/me');
    if (response.data) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data!.user;
  }

  async refreshToken(): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('No refresh token');
    
    const response = await this.request<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
    if (response.data) {
      this.setAccessToken(response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
    }
    return response.data!;
  }

  async getGyms(): Promise<Gym[]> {
    const response = await this.request<{ gyms: Gym[] }>('/gyms');
    return response.data!.gyms;
  }

  async getGymById(id: string): Promise<Gym> {
    const response = await this.request<{ gym: Gym }>(`/gyms/${id}`);
    return response.data!.gym;
  }

  async getMyGyms(): Promise<Gym[]> {
    const response = await this.request<{ gyms: Gym[] }>('/gyms/my');
    return response.data!.gyms;
  }

  async createGym(data: Partial<Gym>): Promise<Gym> {
    const response = await this.request<{ gym: Gym }>('/gyms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data!.gym;
  }

  async updateGym(id: string, data: Partial<Gym>): Promise<Gym> {
    const response = await this.request<{ gym: Gym }>(`/gyms/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.data!.gym;
  }

  async getMembershipPlans(gymId: string): Promise<MembershipPlan[]> {
    const response = await this.request<{ plans: MembershipPlan[] }>(`/gyms/${gymId}/membership-plans`);
    return response.data!.plans;
  }

  async createMembershipPlan(gymId: string, data: Partial<MembershipPlan>): Promise<MembershipPlan> {
    const response = await this.request<{ plan: MembershipPlan }>(`/gyms/${gymId}/membership-plans`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data!.plan;
  }

  async updateMembershipPlan(gymId: string, planId: string, data: Partial<MembershipPlan>): Promise<MembershipPlan> {
    const response = await this.request<{ plan: MembershipPlan }>(`/gyms/${gymId}/membership-plans/${planId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.data!.plan;
  }

  async getUsers(): Promise<User[]> {
    const response = await this.request<{ users: User[] }>('/admin/users');
    return response.data!.users;
  }

  async getAllGyms(): Promise<Gym[]> {
    const response = await this.request<{ gyms: Gym[] }>('/admin/gyms');
    return response.data!.gyms;
  }

  async getStats(): Promise<{ totalUsers: number; totalGyms: number; pendingGyms: number; approvedGyms: number; rejectedGyms: number }> {
    const response = await this.request<{ stats: any }>('/admin/stats');
    return response.data!.stats;
  }

  async updateGymStatus(id: string, status: 'APPROVED' | 'REJECTED'): Promise<Gym> {
    const response = await this.request<{ gym: Gym }>(`/admin/gyms/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return response.data!.gym;
  }

  getStoredUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }
}

export const api = new ApiClient(API_URL);