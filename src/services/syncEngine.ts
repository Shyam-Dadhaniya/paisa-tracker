import { supabase } from './supabase';
import { db } from './db';
import type { Expense } from '@/types';

interface RemoteRow {
  id: string;
  user_id: string;
  merchant: string;
  amount: number;
  category: string;
  date: string;
  note: string | null;
  source: string;
  sms_raw: string | null;
  created_at: number;
  updated_at: number;
  deleted: boolean;
}

function toRow(e: Expense, userId: string): RemoteRow {
  return {
    id: e.id,
    user_id: userId,
    merchant: e.merchant,
    amount: e.amount,
    category: e.category,
    date: e.date,
    note: e.note ?? null,
    source: e.source,
    sms_raw: e.smsRaw ?? null,
    created_at: e.createdAt,
    updated_at: e.updatedAt,
    deleted: e.deleted ?? false,
  };
}

function fromRow(r: RemoteRow): Expense {
  return {
    id: r.id,
    merchant: r.merchant,
    amount: Number(r.amount),
    category: r.category as Expense['category'],
    date: r.date,
    note: r.note ?? undefined,
    source: r.source as Expense['source'],
    smsRaw: r.sms_raw ?? undefined,
    createdAt: Number(r.created_at),
    updatedAt: Number(r.updated_at),
    deleted: r.deleted,
    syncedAt: Number(r.updated_at),
  };
}

const META_KEY = 'paisatrack-sync-meta';
interface SyncMeta {
  lastPulledAt: number;
}
function readMeta(): SyncMeta {
  try {
    const parsed = JSON.parse(localStorage.getItem(META_KEY) ?? '{}');
    return { lastPulledAt: Number(parsed.lastPulledAt) || 0 };
  } catch {
    return { lastPulledAt: 0 };
  }
}
function writeMeta(m: SyncMeta) {
  localStorage.setItem(META_KEY, JSON.stringify(m));
}

export interface SyncResult {
  pushed: number;
  pulled: number;
  error?: string;
}

export async function syncNow(userId: string): Promise<SyncResult> {
  if (!navigator.onLine) return { pushed: 0, pulled: 0, error: 'offline' };

  // 1) Push local dirty rows (syncedAt missing or stale)
  const all = await db.expenses.toArray();
  const dirty = all.filter((e) => !e.syncedAt || e.syncedAt < e.updatedAt);
  let pushed = 0;
  if (dirty.length > 0) {
    const rows = dirty.map((e) => toRow(e, userId));
    const { error } = await supabase.from('expenses').upsert(rows, { onConflict: 'id' });
    if (error) return { pushed: 0, pulled: 0, error: error.message };
    pushed = dirty.length;
    const now = Date.now();
    await db.transaction('rw', db.expenses, async () => {
      for (const e of dirty) {
        await db.expenses.update(e.id, { syncedAt: e.updatedAt });
      }
    });
    void now;
  }

  // 2) Pull remote changes since lastPulledAt
  const meta = readMeta();
  const { data, error: pullErr } = await supabase
    .from('expenses')
    .select('*')
    .gt('updated_at', meta.lastPulledAt)
    .order('updated_at', { ascending: true });

  if (pullErr) return { pushed, pulled: 0, error: pullErr.message };

  let pulled = 0;
  let newest = meta.lastPulledAt;
  if (data && data.length > 0) {
    await db.transaction('rw', db.expenses, async () => {
      for (const row of data as RemoteRow[]) {
        if (row.updated_at > newest) newest = row.updated_at;
        const local = await db.expenses.get(row.id);
        if (!local || row.updated_at > local.updatedAt) {
          const merged = fromRow(row);
          if (row.deleted) {
            await db.expenses.delete(row.id);
          } else {
            await db.expenses.put(merged);
          }
          pulled++;
        }
      }
    });
    writeMeta({ lastPulledAt: newest });
  }

  return { pushed, pulled };
}

export function resetSyncMeta() {
  localStorage.removeItem(META_KEY);
}
