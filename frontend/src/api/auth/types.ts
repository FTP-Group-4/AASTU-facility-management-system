export interface LoginRequest {
  email: string;
  password: string;
  device_id?: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    user: User;
  };
}

export interface RefreshTokenResponse {
  success: boolean;
  data: {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
  };
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  phone?: string;
  department?: string;
  permissions: string[];
  created_at?: string;
  stats?: UserStats;
  assigned_blocks?: Array<{
    block_id: number;
    block_name: string;
  }>;
  location_not_specified?: boolean;
  specialization?: string;
  team?: string;
  system_stats?: {
    total_users: number;
    active_reports: number;
    system_uptime: string;
  };
}

export type UserRole = 'reporter' | 'coordinator' | 'electrical_fixer' | 'mechanical_fixer' | 'admin';

export interface UserStats {
  reports_submitted?: number;
  reports_pending?: number;
  avg_rating_given?: number;
  pending_approvals?: number;
  approved_today?: number;
  sla_compliance?: number;
  jobs_completed?: number;
  jobs_in_progress?: number;
  avg_completion_time?: string;
  avg_rating?: number;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export const ROLES = {
  REPORTER: 'reporter',
  COORDINATOR: 'coordinator',
  ELECTRICAL_FIXER: 'electrical_fixer',
  MECHANICAL_FIXER: 'mechanical_fixer',
  ADMIN: 'admin',
} as const;

export const ROLE_PERMISSIONS = {
  reporter: ['report:create', 'report:view_own', 'report:rate'],
  coordinator: ['report:view_assigned', 'report:approve', 'report:reject', 'report:assign_priority'],
  electrical_fixer: ['job:view_assigned', 'job:update_status', 'job:complete'],
  mechanical_fixer: ['job:view_assigned', 'job:update_status', 'job:complete'],
  admin: ['*', 'user:manage', 'block:manage', 'system:configure', 'report:view_all'],
} as const;