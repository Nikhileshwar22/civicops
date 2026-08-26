/**
 * Auth token management utilities
 * Handles localStorage token persistence and auto-refresh
 */

const ACCESS_TOKEN_KEY = 'civicops_access_token';
const REFRESH_TOKEN_KEY = 'civicops_refresh_token';
const USER_KEY = 'civicops_user';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  roles: string[];
  permissions: string[];
  scope: {
    type: string;
    zoneIds?: string[];
    circleIds?: string[];
    wardIds?: string[];
    departmentIds?: string[];
  };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function setTokens(tokens: AuthTokens) {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export function setUser(user: AuthUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function hasPermission(user: AuthUser | null, permission: string): boolean {
  if (!user) return false;
  return user.permissions.includes(permission);
}

export function hasRole(user: AuthUser | null, role: string): boolean {
  if (!user) return false;
  return user.roles.includes(role);
}

export function hasAnyRole(user: AuthUser | null, roles: string[]): boolean {
  if (!user) return false;
  return roles.some((role) => user.roles.includes(role));
}

/**
 * Determines the dashboard path based on the user's primary role
 */
export function getDashboardPath(user: AuthUser): string {
  const roles = user.roles;

  if (roles.includes('SUPER_ADMIN') || roles.includes('COMMISSIONER') || roles.includes('ADDITIONAL_COMMISSIONER')) {
    return '/commissioner/dashboard';
  }
  if (roles.includes('ZONAL_COMMISSIONER') || roles.includes('DEPUTY_COMMISSIONER')) {
    return '/commissioner/dashboard';
  }
  if (roles.includes('WARD_OFFICER') || roles.includes('ASSISTANT_MUNICIPAL_COMMISSIONER')) {
    return '/officer/dashboard';
  }
  if (roles.includes('FIELD_SUPERVISOR') || roles.includes('FIELD_WORKER')) {
    return '/worker/dashboard';
  }
  return '/citizen/dashboard';
}
