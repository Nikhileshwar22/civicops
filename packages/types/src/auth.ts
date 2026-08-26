// ============================================================
// Authentication & Authorization Types
// ============================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  tenantId?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tenantId: string;
  tenantName: string;
  roles: string[];
  permissions: string[];
  scope: UserScope;
}

export interface UserScope {
  type: ScopeType;
  zoneIds?: string[];
  circleIds?: string[];
  wardIds?: string[];
  departmentIds?: string[];
}

export enum ScopeType {
  GLOBAL = 'GLOBAL',
  TENANT = 'TENANT',
  ZONE = 'ZONE',
  CIRCLE = 'CIRCLE',
  WARD = 'WARD',
  ASSIGNED_ONLY = 'ASSIGNED_ONLY',
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  password: string;
}

export interface SessionInfo {
  id: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
}
