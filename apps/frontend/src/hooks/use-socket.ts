'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getAccessToken } from '@/lib/auth';

/**
 * Resolve the WebSocket backend URL at runtime.
 * - In dev: backend is on localhost:4000
 * - In prod (EC2): backend is exposed on the same host, port 4000
 */
function resolveWsUrl(): string {
  if (typeof window === 'undefined') return 'http://localhost:4000';
  const { protocol, hostname } = window.location;
  // localhost dev
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:4000';
  }
  // production: backend exposed on same host, port 4000
  return `${protocol}//${hostname}:4000`;
}

interface UseSocketOptions {
  enabled?: boolean;
}

export function useSocket(options: UseSocketOptions = {}) {
  const { enabled = true } = options;
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const token = getAccessToken();
    if (!token) return;

    const socket = io(`${resolveWsUrl()}/ws`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('error', (err) => {
      console.error('[WS] Error:', err.message);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [enabled]);

  const on = useCallback((event: string, handler: (data: any) => void) => {
    socketRef.current?.on(event, handler);
    return () => {
      socketRef.current?.off(event, handler);
    };
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    socketRef.current?.emit(event, data);
  }, []);

  const joinRoom = useCallback((room: string) => {
    socketRef.current?.emit('join:room', { room });
  }, []);

  const leaveRoom = useCallback((room: string) => {
    socketRef.current?.emit('leave:room', { room });
  }, []);

  return { socket: socketRef.current, isConnected, on, emit, joinRoom, leaveRoom };
}
