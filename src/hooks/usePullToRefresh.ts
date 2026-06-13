import { useEffect, useRef, useState } from 'react';

const TRIGGER = 70; // px pulled before a refresh fires
const MAX = 110; // clamp for the visual indicator

interface PullToRefresh {
  /** Current pull distance in px (already damped & clamped). */
  distance: number;
  refreshing: boolean;
  /** Progress 0–1 toward the trigger threshold. */
  progress: number;
}

/** Pull-down-to-refresh on the window scroll. Fires `onRefresh` (awaited) when
 *  the user pulls past the threshold from the top of the page. */
export function usePullToRefresh(onRefresh: () => void | Promise<void>): PullToRefresh {
  const [distance, setDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const startY = useRef<number | null>(null);
  const distanceRef = useRef(0);
  const refreshingRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    const atTop = () => (window.scrollY || document.documentElement.scrollTop || 0) <= 0;

    const setDist = (d: number) => {
      distanceRef.current = d;
      setDistance(d);
    };

    const onTouchStart = (e: TouchEvent) => {
      startY.current = !refreshingRef.current && atTop() ? e.touches[0].clientY : null;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (startY.current === null || refreshingRef.current) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta <= 0 || !atTop()) {
        setDist(0);
        return;
      }
      setDist(Math.min(delta * 0.5, MAX)); // rubber-band damping
    };

    const onTouchEnd = async () => {
      if (startY.current === null) return;
      startY.current = null;
      if (distanceRef.current >= TRIGGER && !refreshingRef.current) {
        refreshingRef.current = true;
        setRefreshing(true);
        setDist(TRIGGER);
        try {
          await onRefreshRef.current();
        } finally {
          refreshingRef.current = false;
          setRefreshing(false);
          setDist(0);
        }
      } else {
        setDist(0);
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  return { distance, refreshing, progress: Math.min(distance / TRIGGER, 1) };
}
