import { useEffect, useRef, useState, useCallback } from 'react';
import { API_BASE_URL } from '../api/axiosInstance';
import { Notification } from '../types/index';

const RECONNECT_DELAY_MS = 5000;

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setError('No auth token available for notifications.');
      return;
    }

    try {
      const sseUrl = `${API_BASE_URL.replace(/\/$/, '')}/notifications/stream`;
      const params = new URLSearchParams({ access_token: token });
      const source = new EventSource(`${sseUrl}?${params.toString()}`);
      sourceRef.current = source;

      source.onopen = () => {
        setConnected(true);
        setError(null);
        if (reconnectTimer.current) {
          clearTimeout(reconnectTimer.current);
          reconnectTimer.current = null;
        }
      };

      source.addEventListener('connected', () => {
        setConnected(true);
        setError(null);
      });

      source.addEventListener('notification', (event: Event) => {
        try {
          const messageEvent = event as MessageEvent;
          const notification: Notification = JSON.parse(messageEvent.data);
          setNotifications((prev) => [notification, ...prev].slice(0, 20));
        } catch (err) {
          console.error('Failed to parse notification event', err);
        }
      });

      source.onerror = () => {
        setConnected(false);
        setError('Notification connection lost. Reconnecting...');
        if (sourceRef.current) {
          sourceRef.current.close();
          sourceRef.current = null;
        }

        if (!reconnectTimer.current) {
          reconnectTimer.current = setTimeout(() => {
            reconnectTimer.current = null;
            connect();
          }, RECONNECT_DELAY_MS);
        }
      };
    } catch (err) {
      console.error('Failed to connect to notifications:', err);
      setError('Failed to connect to notifications service');
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (sourceRef.current) {
        sourceRef.current.close();
        sourceRef.current = null;
      }
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
    };
  }, [connect]);

  return {
    notifications,
    connected,
    error,
  };
}
