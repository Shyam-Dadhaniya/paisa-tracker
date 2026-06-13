import { syncNow } from '@/services/syncEngine';
import { useAuthStore } from './authStore';

/**
 * Fire-and-forget cloud sync. No-op when signed out or offline.
 * The sync engine handles its own errors.
 */
export function triggerSync() {
  const user = useAuthStore.getState().user;
  if (!user || !navigator.onLine) return;
  void syncNow(user.id);
}
