import type { AdminStats, ApiResponse, AuthResponse, Gym, GymStatus, User } from './types';

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
    const response = await this.request<{ gyms: Gym[] }>('/admin/gyms');
    return response.data!.gyms;
  }

  async getUsers(): Promise<User[]> {
    const response = await this.request<{ users: User[] }>('/admin/users');
    return response.data!.users;
  }

  async getStats(): Promise<AdminStats> {
    const response = await this.request<{ stats: AdminStats }>('/admin/stats');
    return response.data!.stats;
  }

  async getPendingGyms(): Promise<Gym[]> {
    const gyms = await this.getGyms();
    // Client-side status filter: the backend returns all gyms, so the
    // pending queue narrows to PENDING here, oldest first.
    return gyms
      .filter((gym) => gym.status === 'PENDING')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async updateGymStatus(id: string, status: Extract<GymStatus, 'APPROVED' | 'REJECTED'>): Promise<Gym> {
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
