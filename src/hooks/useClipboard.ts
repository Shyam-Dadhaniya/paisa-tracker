import { useCallback } from 'react';

export function looksLikeSms(text: string): boolean {
  if (!text || text.length < 15 || text.length > 1500) return false;
  return /(?:rs\.?|inr|₹)\s*[0-9]/i.test(text) && /(debited|credited|spent|paid|purchase|txn|upi|a\/c|account)/i.test(text);
}

export function useReadClipboard() {
  return useCallback(async (): Promise<string | null> => {
    try {
      if (!navigator.clipboard?.readText) return null;
      const text = await navigator.clipboard.readText();
      return text?.trim() || null;
    } catch {
      return null;
    }
  }, []);
}
