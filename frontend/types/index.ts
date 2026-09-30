export type Role = 'USER' | 'GYM_OWNER' | 'ADMIN';

export type GymStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface Gym {
  id: string;
  ownerId: string;
  name: string;
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
  facilities: string[];
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
  images?: GymImage[];
}

export interface GymImage {
  id: string;
  gymId: string;
  url: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MembershipPlan {
  id: string;
  gymId: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  createdAt: string;
  updatedAt: string;
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

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}