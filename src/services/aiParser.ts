import type { ParsedSms } from './smsRegex';
import { parseSmsRegex } from './smsRegex';

export type ParseResult =
  | { ok: true; data: ParsedSms; source: 'ai' | 'regex' }
  | { ok: false; error: string };

export async function parseSms(smsText: string): Promise<ParseResult> {
  try {
    const res = await fetch('/api/parse-sms', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ smsText }),
    });
    if (res.ok) {
      const json = (await res.json()) as { result?: ParsedSms };
      if (json.result && typeof json.result.amount === 'number') {
        return { ok: true, data: json.result, source: 'ai' };
      }
    }
  } catch {
    // network/offline — fall through to regex
  }

  const fallback = parseSmsRegex(smsText);
  if (fallback) return { ok: true, data: fallback, source: 'regex' };
  return { ok: false, error: 'Could not extract expense from this message' };
}
