import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { syncNow } from '@/services/syncEngine';
import { useCategoryStore } from '@/store/categoryStore';
import { usePaymentSourceStore } from '@/store/paymentSourceStore';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline' | 'signed-out';

interface State {
  status: SyncStatus;
  lastSyncedAt: number | null;
  error: string | null;
}

const RETRY_DELAYS = [1000, 2000, 4000]; // exponential backoff
const SYNC_INTERVAL_MS = 5 * 60 * 1000; // background re-sync cadence

function friendlyError(msg: string): string {
  if (msg === 'offline') return 'No internet connection';
  if (msg.includes('JWT') || msg.includes('auth')) return 'Session expired — please sign in again';
  if (msg.includes('timed out')) return 'Sync timed out — will retry';
  if (msg.includes('network') || msg.includes('fetch')) return 'Network error — will retry';
  return 'Sync failed — will retry';
}

export function useSync() {
  const user = useAuthStore((s) => s.user);
  const [state, setState] = useState<State>({ status: 'signed-out', lastSyncedAt: null, error: null });
  const runningRef = useRef(false);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback(async () => {
    if (!user) {
      setState((s) => ({ ...s, status: 'signed-out' }));
      return;
    }
    if (runningRef.current) return;
    if (!navigator.onLine) {
      setState((s) => ({ ...s, status: 'offline' }));
      return;
    }
    runningRef.current = true;
    setState((s) => ({ ...s, status: 'syncing', error: null }));

    try {
      const result = await syncNow(user.id);
      runningRef.current = false;

      if (result.error && result.error !== 'offline') {
        const delay = RETRY_DELAYS[retryCountRef.current];
        if (delay !== undefined) {
          retryCountRef.current++;
          retryTimerRef.current = setTimeout(() => run(), delay);
        }
        setState({ status: 'error', lastSyncedAt: null, error: friendlyError(result.error) });
      } else if (result.error === 'offline') {
        setState({ status: 'offline', lastSyncedAt: null, error: null });
      } else {
        retryCountRef.current = 0;
        setState({ status: 'synced', lastSyncedAt: Date.now(), error: null });
        await useCategoryStore.getState().loadCustomCategories();
        await usePaymentSourceStore.getState().loadPaymentSources();
      }
    } catch (e) {
      runningRef.current = false;
      const delay = RETRY_DELAYS[retryCountRef.current];
      if (delay !== undefined) {
        retryCountRef.current++;
        retryTimerRef.current = setTimeout(() => run(), delay);
      }
      setState({ status: 'error', lastSyncedAt: null, error: friendlyError(String(e)) });
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setState({ status: 'signed-out', lastSyncedAt: null, error: null });
      return;
    }
    run();
    const interval = setInterval(run, SYNC_INTERVAL_MS);
    const onOnline = () => { retryCountRef.current = 0; run(); };
    const onVisible = () => {
      if (document.visibilityState === 'visible') run();
    };
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [user, run]);

  return { ...state, syncNow: run };
}
