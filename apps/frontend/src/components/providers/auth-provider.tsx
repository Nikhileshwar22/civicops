'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  AuthUser,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  setTokens,
  setUser,
  clearAuth,
  getDashboardPath,
} from '@/lib/auth';
import { AuthContext, RegisterData } from '@/hooks/use-auth';

const API_URL = '';  // Use relative URL - Next.js rewrites proxy to backend

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedUser = getStoredUser();
    const accessToken = getAccessToken();

    if (storedUser && accessToken) {
      setUserState(storedUser);
      // Verify token is still valid by fetching /auth/me
      verifyToken(accessToken).then((valid) => {
        if (!valid) {
          // Try refresh
          attemptRefresh();
        }
      });
    }
    setIsLoading(false);
  }, []);

  const verifyToken = async (token: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const userData = data.data || data;
        setUserState(userData);
        setUser(userData);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const attemptRefresh = async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearAuth();
      setUserState(null);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (res.ok) {
        const data = await res.json();
        const tokens = data.data || data;
        setTokens(tokens);
        // Re-verify with new token
        await verifyToken(tokens.accessToken);
      } else {
        clearAuth();
        setUserState(null);
      }
    } catch {
      clearAuth();
      setUserState(null);
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || 'Login failed');
    }

    const data = await res.json();
    const result = data.data || data;

    setTokens({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
    });
    setUser(result.user);
    setUserState(result.user);

    // Redirect to appropriate dashboard
    const dashboardPath = getDashboardPath(result.user);
    router.push(dashboardPath);
  }, [router]);

  const register = useCallback(async (registerData: RegisterData) => {
    const res = await fetch(`${API_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerData),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || 'Registration failed');
    }

    const data = await res.json();
    const result = data.data || data;

    setTokens({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
    });
    setUser(result.user);
    setUserState(result.user);

    router.push('/citizen/dashboard');
  }, [router]);

  const logout = useCallback(async () => {
    const accessToken = getAccessToken();
    try {
      if (accessToken) {
        await fetch(`${API_URL}/api/v1/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch {
      // Ignore errors during logout
    } finally {
      clearAuth();
      setUserState(null);
      router.push('/login');
    }
  }, [router]);

  const refreshUser = useCallback(async () => {
    const token = getAccessToken();
    if (token) {
      await verifyToken(token);
    }
  }, []);

  // Auto-refresh token before expiry (every 12 minutes for a 15-min token)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      attemptRefresh();
    }, 12 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
