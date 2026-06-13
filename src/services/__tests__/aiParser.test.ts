import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseSms } from '@/services/aiParser';

const validAiResult = {
  amount: 350,
  merchant: 'Zomato',
  category: 'food',
  note: '',
  confidence: 0.95,
};

describe('parseSms', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns AI result when API succeeds with valid data', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: validAiResult }),
    }));

    const result = await parseSms('Rs.350 debited at Zomato');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.source).toBe('ai');
      expect(result.data.amount).toBe(350);
      expect(result.data.title).toBe('Zomato');
    }
  });

  it('falls back to regex when API response is invalid (missing amount)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: { ...validAiResult, amount: 0 } }),
    }));

    const result = await parseSms('Rs.350 debited at Uber');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.source).toBe('regex');
    }
  });

  it('falls back to regex on network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    const result = await parseSms('Rs.200 paid at Starbucks on Jun 10');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.source).toBe('regex');
    }
  });

  it('falls back to regex when API returns non-ok status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    }));
    const result = await parseSms('Rs.500 paid at Amazon');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.source).toBe('regex');
    }
  });

  it('returns error when neither AI nor regex can parse', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error()));
    const result = await parseSms('Hello, your OTP is 123456');
    expect(result.ok).toBe(false);
  });

  it('validates all required fields from AI response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: { amount: 100, merchant: 'Test', category: 'food', note: '', confidence: 0.9 } }),
    }));
    const result = await parseSms('Rs.100 paid to Test');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.title).toBeDefined();
      expect(result.data.category).toBeDefined();
    }
  });
});
