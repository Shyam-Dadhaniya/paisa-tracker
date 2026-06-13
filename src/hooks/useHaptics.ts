type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning';

const PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 8,
  medium: 15,
  heavy: 25,
  success: [10, 40, 10],
  warning: [20, 60, 20],
};

/** Guarded haptic feedback. No-ops on devices without the Vibration API. */
export function useHaptics() {
  const vibrate = (pattern: HapticPattern = 'light') => {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(PATTERNS[pattern]);
      } catch {
        /* ignore unsupported */
      }
    }
  };
  return vibrate;
}
