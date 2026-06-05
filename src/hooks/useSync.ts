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

export function useSync() {
  const user = useAuthStore((s) => s.user);
  const [state, setState] = useState<State>({ status: 'signed-out', lastSyncedAt: null, error: null });
  const runningRef = useRef(false);

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
    const result = await syncNow(user.id);
    runningRef.current = false;
    if (result.error) {
      setState({ status: result.error === 'offline' ? 'offline' : 'error', lastSyncedAt: null, error: result.error });
    } else {
      setState({ status: 'synced', lastSyncedAt: Date.now(), error: null });
      // Reload stores in case new/updated records were pulled from remote
      await useCategoryStore.getState().loadCustomCategories();
      await usePaymentSourceStore.getState().loadPaymentSources();
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setState({ status: 'signed-out', lastSyncedAt: null, error: null });
      return;
    }
    run();
    const interval = setInterval(run, 5 * 60 * 1000);
    const onOnline = () => run();
    const onVisible = () => {
      if (document.visibilityState === 'visible') run();
    };
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [user, run]);

  return { ...state, syncNow: run };
}
