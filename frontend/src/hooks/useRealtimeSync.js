import { useEffect, useState } from 'react';
import api from '../api';

function getToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

export function useRealtimeSync() {
  const [state, setState] = useState(getToken() ? 'connecting' : 'offline');

  useEffect(() => {
    let stopped = false;
    let retryDelay = 1000;
    let controller = null;

    const connect = async () => {
      while (!stopped) {
        const token = getToken();
        if (!token) {
          setState('offline');
          // Wait for token to become available via login event instead of exiting loop
          await new Promise((resolve) => {
            const onAuth = () => {
              window.removeEventListener('campus:auth-changed', onAuth);
              resolve();
            };
            window.addEventListener('campus:auth-changed', onAuth);
            setTimeout(onAuth, 2000);
          });
          continue;
        }

        controller = new AbortController();
        try {
          setState('connecting');
          const base = api.defaults.baseURL.replace(/\/$/, '');
          const response = await fetch(`${base}/events`, {
            headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
            signal: controller.signal,
          });

          if (!response.ok || !response.body) {
            throw new Error(`Live sync returned ${response.status}`);
          }

          retryDelay = 1000;
          setState('connected');
          window.dispatchEvent(new CustomEvent('campus:reconnected'));

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let pending = '';

          while (!stopped) {
            const { value, done } = await reader.read();
            if (done) break;
            pending += decoder.decode(value, { stream: true });
            const blocks = pending.split(/\r?\n\r?\n/);
            pending = blocks.pop() || '';
            for (const block of blocks) {
              const event = block.match(/^event:\s*(.+)$/m)?.[1];
              const data = block.match(/^data:\s*(.+)$/m)?.[1];

              // Mark as live whenever ready/keepalive/campus event arrives
              if (event === 'ready' || event === 'campus' || block.includes('keepalive')) {
                setState('connected');
              }

              if (event === 'campus' && data) {
                try {
                  window.dispatchEvent(new CustomEvent('campus:data-changed', { detail: JSON.parse(data) }));
                } catch {
                  /* ignore malformed payload */
                }
              }
            }
          }
        } catch (error) {
          if (stopped) return;
          const currentToken = getToken();
          setState(currentToken ? 'reconnecting' : 'offline');
        }

        if (!stopped) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          retryDelay = Math.min(retryDelay * 2, 15000);
        }
      }
    };

    connect();

    const onOnline = () => {
      controller?.abort();
      setState('connecting');
    };

    const onAuthChanged = () => {
      controller?.abort();
      setState(getToken() ? 'connecting' : 'offline');
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('campus:auth-changed', onAuthChanged);

    return () => {
      stopped = true;
      controller?.abort();
      window.removeEventListener('online', onOnline);
      window.removeEventListener('campus:auth-changed', onAuthChanged);
    };
  }, []);

  return state;
}
