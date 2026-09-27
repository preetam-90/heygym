export type Role = 'USER' | 'GYM_OWNER' | 'ADMIN';

export type GymStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

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
  phone: string | null;
  email: string | null;
  imageUrl: string | null;
  status: GymStatus;
  createdAt: string;
  updatedAt: string;
  owner?: User;
  membershipPlans?: MembershipPlan[];
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