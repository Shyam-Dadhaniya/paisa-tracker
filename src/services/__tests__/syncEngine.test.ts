import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncNow, resetSyncMeta } from '@/services/syncEngine';

// Configurable Supabase mock --------------------------------------------------
const upsertMock = vi.fn().mockResolvedValue({ error: null });
// eq() resolves the category/payment-source pull; default empty.
let eqResult: { data: unknown[]; error: unknown } = { data: [], error: null };
const eqMock = vi.fn(() => Promise.resolve(eqResult));
// gt().order() resolves the expense pull; default empty.
const orderMock = vi.fn().mockResolvedValue({ data: [], error: null });

vi.mock('@/services/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      upsert: upsertMock,
      select: vi.fn(() => ({
        eq: eqMock,
        gt: vi.fn(() => ({ order: orderMock })),
      })),
    })),
  },
}));

// Mock db ---------------------------------------------------------------------
vi.mock('@/services/db', () => {
  const tbl = () => ({
    toArray: vi.fn().mockResolvedValue([]),
    get: vi.fn().mockResolvedValue(undefined),
    put: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
  });
  return {
    db: {
      expenses: tbl(),
      customCategories: tbl(),
      paymentSources: tbl(),
      transaction: vi.fn().mockImplementation(
        async (_rw: string, _tables: unknown, fn: () => Promise<void>) => fn(),
      ),
    },
  };
});

beforeEach(() => {
  resetSyncMeta();
  vi.clearAllMocks();
  vi.stubGlobal('navigator', { onLine: true });
  eqResult = { data: [], error: null };
});

describe('syncNow', () => {
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

describe('category deletion propagation', () => {
  it('pushes a soft-deleted local category as a tombstone', async () => {
    const { db } = await import('@/services/db');
    vi.mocked(db.customCategories.toArray).mockResolvedValueOnce([
      { id: 'custom_x', label: 'Gone', icon: '🏷️', color: '#000', createdAt: 1, updatedAt: 2, syncedAt: 1, deleted: true },
    ] as never);

    await syncNow('user-123');

    const pushedCategory = upsertMock.mock.calls
      .flatMap((call) => call[0] as Array<{ id: string; deleted: boolean }>)
      .find((row) => row?.id === 'custom_x');
    expect(pushedCategory).toBeDefined();
    expect(pushedCategory!.deleted).toBe(true);
  });

  it('deletes a local category when the remote row is a newer tombstone', async () => {
    const { db } = await import('@/services/db');
    vi.mocked(db.customCategories.get).mockResolvedValue({
      id: 'custom_y', label: 'Old', icon: '🏷️', color: '#000', createdAt: 1, updatedAt: 1, syncedAt: 1,
    } as never);
    eqResult = {
      data: [
        { id: 'custom_y', user_id: 'user-123', label: 'Old', icon: '🏷️', color: '#000', created_at: 1, updated_at: 999, deleted: true },
      ],
      error: null,
    };

    await syncNow('user-123');

    expect(db.customCategories.delete).toHaveBeenCalledWith('custom_y');
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
