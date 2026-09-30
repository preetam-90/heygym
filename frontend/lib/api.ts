import type {
  AdminStats,
  ApiResponse,
  AuthResponse,
  Enquiry,
  EnquiryStatus,
  Facility,
  Favorite,
  Gym,
  GymHours,
  GymPhoto,
  GymSearchMeta,
  GymSearchParams,
  GymSearchResult,
  MembershipPlan,
  Notification,
  Review,
  User,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
const API_ORIGIN = API_URL.replace(/\/api\/v1\/?$/, '');

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
    // ignore (private mode / SSR)
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

/** Map backend error codes to user-friendly messages. */
export function friendlyError(err: unknown, fallback = 'Request failed. Please try again.'): string {
  const message = err instanceof Error ? err.message : fallback;
  return message || fallback;
}

export const ERROR_HINTS: Record<string, string> = {
  EMAIL_ALREADY_EXISTS: 'An account with this email already exists. Try logging in.',
  INVALID_CREDENTIALS: 'Incorrect email or password.',
  RATE_LIMITED: 'Too many attempts. Please wait a minute and try again.',
  UNAUTHORIZED: 'Please log in to continue.',
  FORBIDDEN: 'You do not have permission to do that.',
  GYM_NOT_FOUND: 'Gym not found. It may have been removed.',
  FAVORITE_EXISTS: 'Already in your favorites.',
  REVIEW_EXISTS: 'You have already reviewed this gym.',
};

class ApiClient {
  private baseUrl: string;
  /** In-memory access token only (never persisted refresh tokens). Cookies carry the session for web. */
  private accessToken: string | null = null;
  private refreshInFlight: Promise<string> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  private clearAuthState() {
    this.accessToken = null;
    removeStorage('user');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryOnAuth = true,
  ): Promise<ApiResponse<T>> {
    const isForm = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const headers: Record<string, string> = {
      ...((options.headers as Record<string, string> | undefined) ?? {}),
    };
    if (!isForm && !(options.method === 'GET' || options.method === 'HEAD')) {
      headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
    }

    const token = this.getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

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
      try {
        await this.refreshToken();
        return this.request<T>(endpoint, options, false);
      } catch {
        this.clearAuthState();
        throw new Error('Session expired. Please log in again.');
      }
    }

    if (!response.ok) {
      const code = data?.error?.code;
      const raw =
        typeof data?.error?.message === 'string' && data.error.message.length > 0
          ? data.error.message
          : 'Request failed. Please try again.';
      const err = new Error(ERROR_HINTS[code ?? ''] ?? raw);
      (err as { code?: string }).code = code;
      throw err;
    }

    return data;
  }

  private storeAuthSession(auth: AuthResponse) {
    // Web session lives in HttpOnly cookies; keep access token in memory for
    // Authorization header + mobile compat. Never persist refresh tokens.
    this.setAccessToken(auth.accessToken);
    writeStorage('user', JSON.stringify(auth.user));
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (response.data) this.storeAuthSession(response.data);
    return response.data!;
  }

  async register(data: { name: string; email: string; password: string; phone?: string; role?: string }): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (response.data) this.storeAuthSession(response.data);
    return response.data!;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST', body: JSON.stringify({}) });
    } catch {
      // always clear local state
    } finally {
      this.clearAuthState();
    }
  }

  async me(): Promise<User> {
    const response = await this.request<{ user: User }>('/auth/me');
    if (response.data) writeStorage('user', JSON.stringify(response.data.user));
    return response.data!.user;
  }

  /** Cookie-based silent refresh (no refresh token in JS). */
  async refreshToken(): Promise<{ accessToken: string }> {
    if (this.refreshInFlight) {
      const accessToken = await this.refreshInFlight;
      return { accessToken };
    }
    this.refreshInFlight = (async () => {
      const response = await this.request<{ accessToken: string; refreshToken: string }>(
        '/auth/refresh',
        { method: 'POST', body: JSON.stringify({}) },
        false,
      );
      if (response.data) {
        this.setAccessToken(response.data.accessToken);
        return response.data.accessToken;
      }
      throw new Error('Session expired. Please log in again.');
    })();
    try {
      const accessToken = await this.refreshInFlight;
      return { accessToken };
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

  async searchGyms(params: GymSearchParams = {}): Promise<GymSearchResult> {
    const query = new URLSearchParams();
    if (params.q) query.set('q', params.q);
    if (params.city) query.set('city', params.city);
    for (const facility of params.facilities ?? []) query.append('facilities', facility);
    if (params.minPrice != null) query.set('minPrice', String(params.minPrice));
    if (params.maxPrice != null) query.set('maxPrice', String(params.maxPrice));
    if (params.minRating != null) query.set('minRating', String(params.minRating));
    if (params.sort) query.set('sort', params.sort);
    if (params.page != null) query.set('page', String(params.page));
    if (params.pageSize != null) query.set('pageSize', String(params.pageSize));
    if (params.lat != null) query.set('lat', String(params.lat));
    if (params.lng != null) query.set('lng', String(params.lng));
    const radius = params.radius ?? params.radiusKm;
    if (radius != null) query.set('radius', String(radius));

    const suffix = query.toString();
    const response = await this.request<{ gyms: (Gym & { distanceKm?: number })[]; meta: GymSearchMeta }>(
      `/gyms${suffix ? `?${suffix}` : ''}`,
    );
    const data = response.data!;
    return { ...data.meta, gyms: data.gyms };
  }

  async getGymById(idOrSlug: string): Promise<Gym> {
    const response = await this.request<{ gym: Gym }>(`/gyms/${encodeURIComponent(idOrSlug)}`);
    return response.data!.gym;
  }

  async getFacilities(): Promise<Facility[]> {
    const response = await this.request<{ facilities: Facility[] }>('/gyms/facilities');
    return response.data!.facilities;
  }

  async getGymHours(gymId: string): Promise<GymHours[]> {
    const response = await this.request<{ hours: GymHours[] }>(`/gyms/${gymId}/hours`);
    return response.data!.hours;
  }

  // Owner (canonical) + compat aliases
  async getMyGyms(): Promise<Gym[]> {
    try {
      const response = await this.request<{ gyms: Gym[] }>('/owner/gyms');
      return response.data!.gyms;
    } catch {
      const fallback = await this.request<{ gyms: Gym[] }>('/gyms/my');
      return fallback.data!.gyms;
    }
  }

  async createGym(data: Partial<Gym>): Promise<Gym> {
    const response = await this.request<{ gym: Gym }>('/owner/gyms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data!.gym;
  }

  async updateGym(id: string, data: Partial<Gym>): Promise<Gym> {
    const response = await this.request<{ gym: Gym }>(`/owner/gyms/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.data!.gym;
  }

  async deleteGym(id: string): Promise<void> {
    await this.request(`/owner/gyms/${id}`, { method: 'DELETE' });
  }

  async submitGym(id: string): Promise<Gym> {
    const response = await this.request<{ gym: Gym }>(`/owner/gyms/${id}/submit`, {
      method: 'POST',
    });
    return response.data!.gym;
  }

  async setGymFacilities(gymId: string, facilityIds: string[]): Promise<Gym> {
    const response = await this.request<{ gym: Gym }>(`/owner/gyms/${gymId}/facilities`, {
      method: 'POST',
      body: JSON.stringify({ facilityIds }),
    });
    return response.data!.gym;
  }

  async addGymFacility(gymId: string, facilityId: string): Promise<Facility> {
    const response = await this.request<{ facility: Facility }>(`/gyms/${gymId}/facilities`, {
      method: 'POST',
      body: JSON.stringify({ facilityId }),
    });
    return response.data!.facility;
  }

  async removeGymFacility(gymId: string, facilityId: string): Promise<void> {
    await this.request(`/gyms/${gymId}/facilities/${facilityId}`, { method: 'DELETE' });
  }

  async setGymHours(gymId: string, hours: Array<{ dayOfWeek: number; openTime?: string | null; closeTime?: string | null; isClosed?: boolean }>): Promise<GymHours[]> {
    const response = await this.request<{ hours: GymHours[] }>(`/gyms/${gymId}/hours`, {
      method: 'PUT',
      body: JSON.stringify({ hours }),
    });
    return response.data!.hours;
  }

  async uploadGymPhoto(gymId: string, file: File): Promise<GymPhoto> {
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
    let data: ApiResponse<{ photo: GymPhoto }>;
    try {
      data = await response.json();
    } catch {
      throw new Error('Received an invalid response from the server. Please try again.');
    }
    if (!response.ok) {
      throw new Error(data?.error?.message || 'Photo upload failed. Please try again.');
    }
    return data.data!.photo;
  }

  async deleteGymPhoto(gymId: string, photoId: string): Promise<void> {
    await this.request(`/gyms/${gymId}/photos/${photoId}`, { method: 'DELETE' });
  }

  async setPrimaryPhoto(gymId: string, photoId: string): Promise<GymPhoto> {
    const response = await this.request<{ photo: GymPhoto }>(`/gyms/${gymId}/photos/${photoId}/primary`, {
      method: 'PATCH',
    });
    return response.data!.photo;
  }

  async updateGymPhoto(gymId: string, photoId: string, data: { altText?: string | null; sortOrder?: number }): Promise<GymPhoto> {
    const response = await this.request<{ photo: GymPhoto }>(`/gyms/${gymId}/photos/${photoId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.data!.photo;
  }

  async getProfile(): Promise<User> {
    const response = await this.request<{ user: User }>('/users/me');
    return response.data!.user;
  }

  async updateProfile(data: { name?: string; email?: string; phone?: string | null; avatarUrl?: string | null }): Promise<User> {
    const response = await this.request<{ user: User }>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (response.data) writeStorage('user', JSON.stringify(response.data.user));
    return response.data!.user;
  }

  async uploadAvatar(file: File): Promise<User> {
    const formData = new FormData();
    formData.append('file', file);
    const headers: Record<string, string> = {};
    const token = this.getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/users/me/avatar`, {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include',
      });
    } catch {
      throw new Error('Unable to connect to the server. Please check your connection and try again.');
    }
    let data: ApiResponse<{ user: User }>;
    try {
      data = await response.json();
    } catch {
      throw new Error('Received an invalid response from the server. Please try again.');
    }
    if (!response.ok) {
      throw new Error(data?.error?.message || 'Avatar upload failed. Please try again.');
    }
    if (data.data) writeStorage('user', JSON.stringify(data.data.user));
    return data.data!.user;
  }

  async getMembershipPlans(gymId: string): Promise<MembershipPlan[]> {
    const response = await this.request<{ plans: MembershipPlan[] }>(`/gyms/${gymId}/membership-plans`);
    return response.data!.plans;
  }

  async createMembershipPlan(gymId: string, data: Partial<MembershipPlan> & { durationDays?: number }): Promise<MembershipPlan> {
    const response = await this.request<{ plan: MembershipPlan }>(`/gyms/${gymId}/membership-plans`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data!.plan;
  }

  async updateMembershipPlan(gymId: string, planId: string, data: Partial<MembershipPlan> & { durationDays?: number }): Promise<MembershipPlan> {
    const response = await this.request<{ plan: MembershipPlan }>(`/gyms/${gymId}/membership-plans/${planId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.data!.plan;
  }

  async deleteMembershipPlan(gymId: string, planId: string): Promise<void> {
    await this.request(`/gyms/${gymId}/membership-plans/${planId}`, { method: 'DELETE' });
  }

  // Favorites
  async addFavorite(gymId: string): Promise<Favorite> {
    const response = await this.request<{ favorite: Favorite }>(`/users/me/favorites/${gymId}`, { method: 'POST' });
    return response.data!.favorite;
  }

  async removeFavorite(gymId: string): Promise<void> {
    await this.request(`/users/me/favorites/${gymId}`, { method: 'DELETE' });
  }

  async listFavorites(page = 1, pageSize = 20): Promise<{ favorites: Favorite[]; meta: GymSearchMeta }> {
    const response = await this.request<{ favorites: Favorite[]; meta: GymSearchMeta }>(
      `/users/me/favorites?page=${page}&pageSize=${pageSize}`,
    );
    return response.data!;
  }

  // Enquiries
  async sendEnquiry(gymId: string, message: string): Promise<Enquiry> {
    const response = await this.request<{ enquiry: Enquiry }>(`/gyms/${gymId}/enquiries`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
    return response.data!.enquiry;
  }

  async listMyEnquiries(page = 1, pageSize = 20): Promise<{ enquiries: Enquiry[]; meta: GymSearchMeta }> {
    const response = await this.request<{ enquiries: Enquiry[]; meta: GymSearchMeta }>(
      `/users/me/enquiries?page=${page}&pageSize=${pageSize}`,
    );
    return response.data!;
  }

  async listOwnerEnquiries(params: { page?: number; pageSize?: number; status?: string; gymId?: string } = {}): Promise<{ enquiries: Enquiry[]; meta: GymSearchMeta }> {
    const q = new URLSearchParams();
    if (params.page) q.set('page', String(params.page));
    if (params.pageSize) q.set('pageSize', String(params.pageSize));
    if (params.status) q.set('status', params.status);
    if (params.gymId) q.set('gymId', params.gymId);
    const s = q.toString();
    const response = await this.request<{ enquiries: Enquiry[]; meta: GymSearchMeta }>(`/owner/enquiries${s ? `?${s}` : ''}`);
    return response.data!;
  }

  async getOwnerEnquiry(id: string): Promise<Enquiry> {
    const response = await this.request<{ enquiry: Enquiry }>(`/owner/enquiries/${id}`);
    return response.data!.enquiry;
  }

  async updateOwnerEnquiry(id: string, data: { status?: EnquiryStatus; response?: string | null }): Promise<Enquiry> {
    const response = await this.request<{ enquiry: Enquiry }>(`/owner/enquiries/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.data!.enquiry;
  }

  // Reviews
  async listReviews(gymId: string, page = 1, pageSize = 20): Promise<{ reviews: Review[]; averageRating: number | null; reviewCount: number; meta: GymSearchMeta }> {
    const response = await this.request<{ reviews: Review[]; averageRating: number | null; reviewCount: number; meta: GymSearchMeta }>(
      `/gyms/${gymId}/reviews?page=${page}&pageSize=${pageSize}`,
    );
    return response.data!;
  }

  async createReview(gymId: string, data: { rating: number; title?: string; comment?: string }): Promise<Review> {
    const response = await this.request<{ review: Review }>(`/gyms/${gymId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data!.review;
  }

  async updateReview(id: string, data: { rating?: number; title?: string | null; comment?: string | null }): Promise<Review> {
    const response = await this.request<{ review: Review }>(`/reviews/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.data!.review;
  }

  async deleteReview(id: string): Promise<void> {
    await this.request(`/reviews/${id}`, { method: 'DELETE' });
  }

  // Notifications
  async listNotifications(page = 1, pageSize = 20, unreadOnly = false): Promise<{ notifications: Notification[]; unreadCount: number; meta: GymSearchMeta }> {
    const response = await this.request<{ notifications: Notification[]; unreadCount: number; meta: GymSearchMeta }>(
      `/users/me/notifications?page=${page}&pageSize=${pageSize}${unreadOnly ? '&unread=true' : ''}`,
    );
    return response.data!;
  }

  async markNotificationRead(id: string): Promise<void> {
    await this.request(`/users/me/notifications/${id}/read`, { method: 'POST' });
  }

  async markAllNotificationsRead(): Promise<void> {
    await this.request('/users/me/notifications/read-all', { method: 'POST' });
  }

  // Admin
  async getUsers(page = 1, pageSize = 20, search?: string): Promise<{ users: User[]; meta: GymSearchMeta }> {
    const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (search) q.set('search', search);
    const response = await this.request<{ users: User[]; meta: GymSearchMeta }>(`/admin/users?${q.toString()}`);
    return response.data!;
  }

  async getAllGyms(page = 1, pageSize = 20, status?: string): Promise<{ gyms: Gym[]; meta: GymSearchMeta }> {
    const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (status) q.set('status', status);
    const response = await this.request<{ gyms: Gym[]; meta: GymSearchMeta }>(`/admin/gyms?${q.toString()}`);
    return response.data!;
  }

  async getPendingGyms(page = 1, pageSize = 20): Promise<{ gyms: Gym[]; meta: GymSearchMeta }> {
    const response = await this.request<{ gyms: Gym[]; meta: GymSearchMeta }>(`/admin/gyms/pending?page=${page}&pageSize=${pageSize}`);
    return response.data!;
  }

  async approveGym(id: string): Promise<Gym> {
    const response = await this.request<{ gym: Gym }>(`/admin/gyms/${id}/approve`, { method: 'POST' });
    return response.data!.gym;
  }

  async rejectGym(id: string, reason: string): Promise<Gym> {
    const response = await this.request<{ gym: Gym }>(`/admin/gyms/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    return response.data!.gym;
  }

  async suspendGym(id: string, reason?: string): Promise<Gym> {
    const response = await this.request<{ gym: Gym }>(`/admin/gyms/${id}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    return response.data!.gym;
  }

  async restoreGym(id: string): Promise<Gym> {
    const response = await this.request<{ gym: Gym }>(`/admin/gyms/${id}/restore`, { method: 'POST' });
    return response.data!.gym;
  }

  async getStats(): Promise<AdminStats> {
    const response = await this.request<{ stats: AdminStats }>('/admin/stats');
    return response.data!.stats;
  }

  async listAdminReviews(page = 1, pageSize = 20): Promise<{ reviews: Review[]; meta: GymSearchMeta }> {
    const response = await this.request<{ reviews: Review[]; meta: GymSearchMeta }>(`/admin/reviews?page=${page}&pageSize=${pageSize}`);
    return response.data!;
  }

  async hideReview(id: string): Promise<void> {
    await this.request(`/admin/reviews/${id}/hide`, { method: 'POST' });
  }

  async restoreReview(id: string): Promise<void> {
    await this.request(`/admin/reviews/${id}/restore`, { method: 'POST' });
  }

  async listAdminEnquiries(page = 1, pageSize = 20): Promise<{ enquiries: Enquiry[]; meta: GymSearchMeta }> {
    const response = await this.request<{ enquiries: Enquiry[]; meta: GymSearchMeta }>(`/admin/enquiries?page=${page}&pageSize=${pageSize}`);
    return response.data!;
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
    return !!this.getAccessToken() || !!this.getStoredUser();
  }

  static origin(): string {
    return API_ORIGIN;
  }
}

export const api = new ApiClient(API_URL);
