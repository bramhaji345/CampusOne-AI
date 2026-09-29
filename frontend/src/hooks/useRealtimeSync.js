import { useEffect, useState } from 'react';
import api from '../api';

export function useRealtimeSync() {
  const [state, setState] = useState('connecting');

  useEffect(() => {
    let stopped = false;
    let retryDelay = 1000;
    let controller;

    const connect = async () => {
      while (!stopped) {
        const token = localStorage.getItem('token');
        if (!token) { setState('offline'); return; }
        controller = new AbortController();
        try {
          const base = api.defaults.baseURL.replace(/\/$/, '');
          const response = await fetch(`${base}/events`, {
            headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
            signal: controller.signal,
          });
          if (!response.ok || !response.body) throw new Error(`Live sync returned ${response.status}`);
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
              if (event === 'campus' && data) {
                try { window.dispatchEvent(new CustomEvent('campus:data-changed', { detail: JSON.parse(data) })); } catch { /* ignore malformed event */ }
              }
            }
          }
        } catch (error) {
          if (stopped) return;
          setState('reconnecting');
        }
        if (!stopped) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          retryDelay = Math.min(retryDelay * 2, 20000);
        }
      }
    };

    connect();
    const onOnline = () => { controller?.abort(); setState('reconnecting'); };
    window.addEventListener('online', onOnline);
    return () => {
      stopped = true;
      controller?.abort();
      window.removeEventListener('online', onOnline);
    };
  }, []);

  return state;
}
