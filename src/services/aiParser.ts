import type { ParsedSms } from './smsRegex';
import { parseSmsRegex } from './smsRegex';
import { SMS_CATEGORY_LIST } from '@/constants/smsPatterns';

export type ParseResult =
  | { ok: true; data: ParsedSms; source: 'ai' | 'regex' }
  | { ok: false; error: string };

function isValidParsedSms(v: unknown): v is ParsedSms {
  if (!v || typeof v !== 'object') return false;
  const obj = v as Record<string, unknown>;
  return (
    typeof obj.amount === 'number' &&
    obj.amount > 0 &&
    typeof obj.title === 'string' &&
    obj.title.length > 0 &&
    (SMS_CATEGORY_LIST as readonly string[]).includes(obj.category as string) &&
    typeof obj.note === 'string' &&
    typeof obj.confidence === 'number'
  );
}

export async function parseSms(smsText: string): Promise<ParseResult> {
  try {
    const res = await fetch('/api/parse-sms', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ smsText }),
    });
    if (res.ok) {
      const json = (await res.json()) as { result?: unknown };
      const raw = json.result;
      if (raw && typeof raw === 'object') {
        // AI returns merchant field; map to title
        const mapped = { ...(raw as Record<string, unknown>), title: (raw as Record<string, unknown>).merchant ?? (raw as Record<string, unknown>).title };
        if (isValidParsedSms(mapped)) {
          return { ok: true, data: mapped as ParsedSms, source: 'ai' };
        }
      }
    }
  } catch {
    // network/offline — fall through to regex
  }

  const fallback = parseSmsRegex(smsText);
  if (fallback) return { ok: true, data: fallback, source: 'regex' };
  return { ok: false, error: 'Could not extract expense from this message' };
}
