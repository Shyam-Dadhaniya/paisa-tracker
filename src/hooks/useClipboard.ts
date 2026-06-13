import { useCallback } from 'react';

/** Bounds for treating clipboard text as a parseable bank SMS. */
const MIN_SMS_LENGTH = 15;
const MAX_SMS_LENGTH = 1500;

export function looksLikeSms(text: string): boolean {
  if (!text || text.length < MIN_SMS_LENGTH || text.length > MAX_SMS_LENGTH) return false;
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
