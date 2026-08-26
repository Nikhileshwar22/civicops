'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './use-socket';
import { useAuth } from './use-auth';
import { getAccessToken } from '@/lib/auth';

const API_URL = '';  // Use relative URL - Next.js rewrites proxy to backend

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  referenceType?: string;
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const { on, isConnected } = useSocket({ enabled: !!user });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/v1/notifications?limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const result = data.data || data;
        setNotifications(result.data || []);
        setUnreadCount(result.unreadCount || 0);
      }
    } catch {
      // Silently fail
    }
  }, []);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/v1/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const result = data.data || data;
        setUnreadCount(result.count || 0);
      }
    } catch {
      // Silently fail
    }
  }, []);

  // Mark as read
  const markAsRead = useCallback(async (id: string) => {
    const token = getAccessToken();
    if (!token) return;

    try {
      await fetch(`${API_URL}/api/v1/notifications/${id}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Silently fail
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;

    try {
      await fetch(`${API_URL}/api/v1/notifications/read-all`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Silently fail
    }
  }, []);

  // Listen for real-time notifications via WebSocket
  useEffect(() => {
    if (!isConnected) return;

    const cleanup = on('notification', (data: Notification) => {
      setNotifications((prev) => [data, ...prev].slice(0, 20));
      setUnreadCount((prev) => prev + 1);
    });

    return cleanup;
  }, [isConnected, on]);

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isConnected,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
  };
}
