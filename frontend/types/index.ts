export type Role = 'USER' | 'GYM_OWNER' | 'ADMIN';

export type GymStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'SUSPENDED';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  role: Role;
  status?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Facility {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  isActive: boolean;
}

export interface Gym {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description: string | null;
  address: string;
  city: string;
  state: string | null;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  /** Backward-compat facility names; canonical data is facilitiesDetailed. */
  facilities: string[];
  facilitiesDetailed?: Facility[];
  services: string[];
  openingTime: string | null;
  closingTime: string | null;
  imageUrl: string | null;
  status: GymStatus;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  owner?: User;
  membershipPlans?: MembershipPlan[];
  /** Canonical photos; images kept as alias. */
  photos?: GymPhoto[];
  images?: GymPhoto[];
  hours?: GymHours[];
  averageRating?: number | null;
  reviewCount?: number;
  distanceKm?: number;
}

export interface GymPhoto {
  id: string;
  gymId: string;
  url: string;
  altText?: string | null;
  isPrimary: boolean;
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

/** Legacy alias kept for existing imports. */
export type GymImage = GymPhoto;

export interface MembershipPlan {
  id: string;
  gymId: string;
  name: string;
  description: string | null;
  price: number;
  durationDays: number;
  /** Legacy alias for durationDays. */
  duration: number;
  features: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GymHours {
  id: string;
  gymId: string;
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
}

export type EnquiryStatus = 'NEW' | 'READ' | 'RESPONDED' | 'CLOSED';

export interface Enquiry {
  id: string;
  gymId: string;
  userId: string;
  message: string;
  response?: string | null;
  status: EnquiryStatus;
  createdAt: string;
  updatedAt: string;
  gym?: Pick<Gym, 'id' | 'name' | 'slug'>;
  user?: Pick<User, 'id' | 'name' | 'email'>;
}

export interface Review {
  id: string;
  gymId: string;
  userId: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
  user?: Pick<User, 'id' | 'name'>;
  gym?: Pick<Gym, 'id' | 'name'>;
}

export interface Favorite {
  id: string;
  userId: string;
  gymId: string;
  createdAt: string;
  gym?: Gym;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  readAt: string | null;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export type GymSort = 'nearest' | 'rating' | 'price_low' | 'price_high' | 'newest';

export interface GymSearchParams {
  q?: string;
  city?: string;
  facilities?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sort?: GymSort;
  page?: number;
  pageSize?: number;
  lat?: number;
  lng?: number;
  radius?: number;
  radiusKm?: number;
}

export interface GymSearchMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

export interface GymSearchResult extends GymSearchMeta {
  gyms: (Gym & { distanceKm?: number })[];
}

export interface AdminStats {
  totalUsers: number;
  totalGyms: number;
  pendingGyms: number;
  approvedGyms: number;
  rejectedGyms: number;
  draftGyms?: number;
  suspendedGyms?: number;
  totalEnquiries?: number;
  totalReviews?: number;
  totalFavorites?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const GYM_STATUS_LABEL: Record<GymStatus, string> = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'Pending approval',
  APPROVED: 'Published',
  SUSPENDED: 'Suspended',
};

export function facilityNames(gym: Gym): string[] {
  if (gym.facilities?.length) return gym.facilities;
  return (gym.facilitiesDetailed ?? []).map((f) => f.name);
}

export function gymPhotos(gym: Gym): GymPhoto[] {
  return gym.photos ?? gym.images ?? [];
}

export function planDuration(plan: MembershipPlan): number {
  return plan.durationDays ?? plan.duration;
}
