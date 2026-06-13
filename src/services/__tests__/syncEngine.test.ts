import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncNow, resetSyncMeta } from '@/services/syncEngine';

// Mock Supabase
vi.mock('@/services/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
        }),
        gt: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    }),
  },
}));

// Mock db
vi.mock('@/services/db', () => ({
  db: {
    expenses: {
      toArray: vi.fn().mockResolvedValue([]),
      get: vi.fn().mockResolvedValue(undefined),
      put: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      update: vi.fn().mockResolvedValue(undefined),
      transaction: vi.fn().mockResolvedValue(undefined),
    },
    customCategories: {
      toArray: vi.fn().mockResolvedValue([]),
      put: vi.fn().mockResolvedValue(undefined),
    },
    paymentSources: {
      filter: vi.fn().mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }),
      put: vi.fn().mockResolvedValue(undefined),
    },
    transaction: vi.fn().mockImplementation(async (_rw: string, _tables: unknown[], fn: () => Promise<void>) => fn()),
  },
}));

describe('syncNow', () => {
  beforeEach(() => {
    resetSyncMeta();
    vi.stubGlobal('navigator', { onLine: true });
  });

  it('returns offline error when navigator is offline', async () => {
    vi.stubGlobal('navigator', { onLine: false });
    const result = await syncNow('user-123');
    expect(result.error).toBe('offline');
    expect(result.pushed).toBe(0);
    expect(result.pulled).toBe(0);
  });

  it('returns pushed=0, pulled=0 when no dirty records and no remote changes', async () => {
    const result = await syncNow('user-123');
    expect(result.error).toBeUndefined();
    expect(result.pushed).toBe(0);
    expect(result.pulled).toBe(0);
  });

  it('returns a SyncResult with pushed/pulled counts', async () => {
    const result = await syncNow('user-123');
    expect(typeof result.pushed).toBe('number');
    expect(typeof result.pulled).toBe('number');
  });
});

describe('syncNow timeout', () => {
  it('returns timeout error when sync exceeds 10s', async () => {
    vi.stubGlobal('navigator', { onLine: true });
    const { db } = await import('@/services/db');
    vi.mocked(db.expenses.toArray).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([] as never), 15_000)) as never
    );

    vi.useFakeTimers();
    const syncPromise = syncNow('user-123');
    vi.advanceTimersByTime(10_001);
    const result = await syncPromise;
    expect(result.error).toContain('timed out');
    vi.useRealTimers();
  });
});
