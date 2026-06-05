import { supabase } from './supabase';
import { db } from './db';
import type { Expense, ExpenseItem } from '@/types';

interface RemoteCatRow {
  id: string;
  user_id: string;
  label: string;
  icon: string;
  color: string;
  created_at: number;
}

async function syncCustomCategories(userId: string): Promise<string | undefined> {
  // Push local → remote
  const local = await db.customCategories.toArray();
  if (local.length > 0) {
    const rows: RemoteCatRow[] = local.map((c) => ({
      id: c.id,
      user_id: userId,
      label: c.label,
      icon: c.icon,
      color: c.color,
      created_at: c.createdAt,
    }));
    const { error } = await supabase
      .from('custom_categories')
      .upsert(rows, { onConflict: 'id' });
    if (error) return error.message;
  }

  // Pull remote → local (add any missing)
  const { data, error: pullErr } = await supabase
    .from('custom_categories')
    .select('*')
    .eq('user_id', userId);
  if (pullErr) return pullErr.message;
  if (data && data.length > 0) {
    await db.transaction('rw', db.customCategories, async () => {
      for (const row of data as RemoteCatRow[]) {
        const exists = await db.customCategories.get(row.id);
        if (!exists) {
          await db.customCategories.add({
            id: row.id,
            label: row.label,
            icon: row.icon,
            color: row.color,
            createdAt: row.created_at,
          });
        }
      }
    });
  }
}

interface RemoteRow {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  type: string; // 'expense' | 'income'
  note: string | null;
  source: string;
  sms_raw: string | null;
  created_at: number;
  updated_at: number;
  deleted: boolean;
  items: ExpenseItem[] | null;
}

function toRow(e: Expense, userId: string): RemoteRow {
  return {
    id: e.id,
    user_id: userId,
    title: e.title,
    amount: e.amount,
    category: e.category,
    date: e.date,
    type: e.type ?? 'expense',
    note: e.note ?? null,
    source: e.source,
    sms_raw: e.smsRaw ?? null,
    created_at: e.createdAt,
    updated_at: e.updatedAt,
    deleted: e.deleted ?? false,
    items: e.items ?? null,
  };
}

function fromRow(r: RemoteRow): Expense {
  return {
    id: r.id,
    title: r.title,
    amount: Number(r.amount),
    category: r.category as Expense['category'],
    date: r.date,
    type: (r.type ?? 'expense') as Expense['type'],
    note: r.note ?? undefined,
    source: r.source as Expense['source'],
    smsRaw: r.sms_raw ?? undefined,
    createdAt: Number(r.created_at),
    updatedAt: Number(r.updated_at),
    deleted: r.deleted,
    syncedAt: Number(r.updated_at),
    items: r.items ?? undefined,
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

  // 0) Sync custom categories first — runs independently of expense sync
  const catError = await syncCustomCategories(userId);
  if (catError) console.warn('Custom category sync error:', catError);

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
