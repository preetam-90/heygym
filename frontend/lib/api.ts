import type { ApiResponse, AuthResponse, User, Gym, GymImage, MembershipPlan } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

const isBrowser = () => typeof window !== 'undefined';

function readStorage(key: string): string | null {
  if (!isBrowser()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage may be unavailable (private mode, SSR) — auth still works
    // in-memory for the lifetime of the page.
  }
}

function removeStorage(key: string): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;
  private refreshInFlight: Promise<string> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.accessToken = readStorage('accessToken');
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
    if (token) {
      writeStorage('accessToken', token);
    } else {
      removeStorage('accessToken');
    }
  }

  getAccessToken(): string | null {
    if (!this.accessToken) {
      // Re-sync from storage (e.g. token set before this instance
      // was constructed, or updated in another tab).
      this.accessToken = readStorage('accessToken');
    }
    return this.accessToken;
  }

  private clearAuthState() {
    this.accessToken = null;
    removeStorage('accessToken');
    removeStorage('refreshToken');
    removeStorage('user');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryOnAuth = true,
  ): Promise<ApiResponse<T>> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getAccessToken();
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
      });
    } catch {
      throw new Error('Unable to connect to the server. Please check your connection and try again.');
    }

    let data: ApiResponse<T>;
    try {
      data = await response.json();
    } catch {
      throw new Error('Received an invalid response from the server. Please try again.');
    }

    if (response.status === 401 && retryOnAuth && !endpoint.startsWith('/auth/')) {
      // Access token may have expired — try a single silent refresh, then retry once.
      try {
        await this.refreshToken();
        return this.request<T>(endpoint, options, false);
      } catch {
        this.clearAuthState();
        throw new Error('Session expired. Please log in again.');
      }
    }

    if (!response.ok) {
      const message =
        typeof data?.error?.message === 'string' && data.error.message.length > 0
          ? data.error.message
          : 'Request failed. Please try again.';
      throw new Error(message);
    }

    return data;
  }

  private storeAuthSession(auth: AuthResponse) {
    this.setAccessToken(auth.accessToken);
    writeStorage('refreshToken', auth.refreshToken);
    writeStorage('user', JSON.stringify(auth.user));
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (response.data) {
      this.storeAuthSession(response.data);
    }
    return response.data!;
  }

  async register(data: { name: string; email: string; password: string; role?: string }): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (response.data) {
      this.storeAuthSession(response.data);
    }
    return response.data!;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch {
      // Logout must always clear local state, even if the network
      // request fails — a stale token must never be left behind.
    } finally {
      this.clearAuthState();
    }
  }

  async me(): Promise<User> {
    const response = await this.request<{ user: User }>('/auth/me');
    if (response.data) {
      writeStorage('user', JSON.stringify(response.data.user));
    }
    return response.data!.user;
  }

  async refreshToken(): Promise<{ accessToken: string; refreshToken: string }> {
    if (this.refreshInFlight) {
      const accessToken = await this.refreshInFlight;
      return { accessToken, refreshToken: readStorage('refreshToken') ?? '' };
    }

    const storedRefreshToken = readStorage('refreshToken');
    if (!storedRefreshToken) throw new Error('No refresh token');

    this.refreshInFlight = (async () => {
      const response = await this.request<{ accessToken: string; refreshToken: string }>(
        '/auth/refresh',
        {
          method: 'POST',
          body: JSON.stringify({ refreshToken: storedRefreshToken }),
        },
        false,
      );
      if (response.data) {
        this.setAccessToken(response.data.accessToken);
        writeStorage('refreshToken', response.data.refreshToken);
        return response.data.accessToken;
      }
      throw new Error('Session expired. Please log in again.');
    })();

    try {
      const accessToken = await this.refreshInFlight;
      return { accessToken, refreshToken: readStorage('refreshToken') ?? '' };
    } catch (err) {
      this.clearAuthState();
      throw err;
    } finally {
      this.refreshInFlight = null;
    }
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

  async submitGym(id: string): Promise<Gym> {
    const response = await this.request<{ gym: Gym }>(`/gyms/${id}/submit`, {
      method: 'POST',
    });
    return response.data!.gym;
  }

  async uploadGymPhoto(gymId: string, file: File): Promise<GymImage> {
    const formData = new FormData();
    formData.append('file', file);
    const headers: Record<string, string> = {};
    const token = this.getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/gyms/${gymId}/photos`, {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include',
      });
    } catch {
      throw new Error('Unable to connect to the server. Please check your connection and try again.');
    }
    let data: ApiResponse<{ photo: GymImage }>;
    try {
      data = await response.json();
    } catch {
      throw new Error('Received an invalid response from the server. Please try again.');
    }
    if (!response.ok) {
      const message =
        typeof data?.error?.message === 'string' && data.error.message.length > 0
          ? data.error.message
          : 'Photo upload failed. Please try again.';
      throw new Error(message);
    }
    return data.data!.photo;
  }

  async deleteGymPhoto(gymId: string, photoId: string): Promise<void> {
    await this.request(`/gyms/${gymId}/photos/${photoId}`, { method: 'DELETE' });
  }

  async setPrimaryPhoto(gymId: string, photoId: string): Promise<GymImage> {
    const response = await this.request<{ photo: GymImage }>(`/gyms/${gymId}/photos/${photoId}/primary`, {
      method: 'PATCH',
    });
    return response.data!.photo;
  }

  async getProfile(): Promise<User> {
    const response = await this.request<{ user: User }>('/users/me');
    return response.data!.user;
  }

  async updateProfile(data: { name?: string; email?: string }): Promise<User> {
    const response = await this.request<{ user: User }>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (response.data) {
      writeStorage('user', JSON.stringify(response.data.user));
    }
    return response.data!.user;
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

  async deleteMembershipPlan(gymId: string, planId: string): Promise<void> {
    await this.request(`/gyms/${gymId}/membership-plans/${planId}`, { method: 'DELETE' });
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
    const userStr = readStorage('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as User;
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}

export const api = new ApiClient(API_URL);
