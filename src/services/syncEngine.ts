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

  // Pull remote → local (upsert so renamed/updated categories sync correctly)
  const { data, error: pullErr } = await supabase
    .from('custom_categories')
    .select('*')
    .eq('user_id', userId);
  if (pullErr) return pullErr.message;
  if (data && data.length > 0) {
    await db.transaction('rw', db.customCategories, async () => {
      for (const row of data as RemoteCatRow[]) {
        await db.customCategories.put({
          id: row.id,
          label: row.label,
          icon: row.icon,
          color: row.color,
          createdAt: row.created_at,
        });
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
  time: string | null;
  type: string;
  note: string | null;
  source: string;
  sms_raw: string | null;
  created_at: number;
  updated_at: number;
  deleted: boolean;
  items: ExpenseItem[] | null;
  payment_mode: string | null;
  payment_source_id: string | null;
}

function toRow(e: Expense, userId: string): RemoteRow {
  return {
    id: e.id,
    user_id: userId,
    title: e.title || '',
    amount: e.amount ?? 0,
    category: e.category || 'other',
    date: e.date || new Date().toISOString().slice(0, 10),
    time: e.time ?? null,
    type: e.type ?? 'expense',
    note: e.note ?? null,
    source: e.source ?? 'manual',
    sms_raw: e.smsRaw ?? null,
    created_at: e.createdAt,
    updated_at: e.updatedAt,
    deleted: e.deleted ?? false,
    items: e.items ?? null,
    payment_mode: e.paymentMode ?? null,
    payment_source_id: e.paymentSourceId ?? null,
  };
}

function fromRow(r: RemoteRow): Expense {
  return {
    id: r.id,
    title: r.title,
    amount: Number(r.amount),
    category: r.category as Expense['category'],
    date: r.date,
    time: r.time ?? undefined,
    type: r.type === 'income' ? 'income' : 'expense',
    note: r.note ?? undefined,
    source: r.source as Expense['source'],
    smsRaw: r.sms_raw ?? undefined,
    createdAt: Number(r.created_at),
    updatedAt: Number(r.updated_at),
    deleted: r.deleted,
    syncedAt: Number(r.updated_at),
    items: r.items ?? undefined,
    paymentMode: (r.payment_mode as Expense['paymentMode']) ?? undefined,
    paymentSourceId: r.payment_source_id ?? undefined,
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

interface RemotePaymentSourceRow {
  id: string;
  user_id: string;
  type: string;
  name: string;
  bank_name: string | null;
  created_at: number;
}

async function syncPaymentSources(userId: string): Promise<string | undefined> {
  try {
    const local = await db.paymentSources.filter((s) => !s.deleted).toArray();
    if (local.length > 0) {
      const rows: RemotePaymentSourceRow[] = local.map((s) => ({
        id: s.id,
        user_id: userId,
        type: s.type,
        name: s.name,
        bank_name: s.bankName ?? null,
        created_at: s.createdAt,
      }));
      const { error } = await supabase
        .from('payment_sources')
        .upsert(rows, { onConflict: 'id' });
      if (error) return error.message;
    }

    const { data, error: pullErr } = await supabase
      .from('payment_sources')
      .select('*')
      .eq('user_id', userId);
    if (pullErr) return pullErr.message;
    if (data && data.length > 0) {
      await db.transaction('rw', db.paymentSources, async () => {
        for (const row of data as RemotePaymentSourceRow[]) {
          await db.paymentSources.put({
            id: row.id,
            type: row.type as 'bank' | 'credit_card',
            name: row.name,
            bankName: row.bank_name ?? undefined,
            createdAt: row.created_at,
          });
        }
      });
    }
  } catch (e) {
    return String(e);
  }
}

const SYNC_TIMEOUT_MS = 10_000;

async function runSync(userId: string): Promise<SyncResult> {
  // 0) Sync custom categories and payment sources — run independently of expense sync
  try {
    const catError = await syncCustomCategories(userId);
    if (catError) console.warn('Custom category sync error:', catError);
  } catch (e) { console.warn('Category sync failed:', e); }
  try {
    const psError = await syncPaymentSources(userId);
    if (psError) console.warn('Payment source sync error:', psError);
  } catch (e) { console.warn('Payment source sync failed:', e); }

  // 1) Push local dirty rows (syncedAt missing or stale)
  const all = await db.expenses.toArray();
  const dirty = all.filter((e) => !e.syncedAt || e.syncedAt < e.updatedAt);
  let pushed = 0;
  if (dirty.length > 0) {
    const rows = dirty.map((e) => toRow(e, userId));
    const { error } = await supabase.from('expenses').upsert(rows, { onConflict: 'id' });
    if (error) return { pushed: 0, pulled: 0, error: error.message };
    pushed = dirty.length;
    await db.transaction('rw', db.expenses, async () => {
      for (const e of dirty) {
        await db.expenses.update(e.id, { syncedAt: e.updatedAt });
      }
    });
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

export async function syncNow(userId: string): Promise<SyncResult> {
  if (!navigator.onLine) return { pushed: 0, pulled: 0, error: 'offline' };

  return Promise.race([
    runSync(userId),
    new Promise<SyncResult>((resolve) =>
      setTimeout(() => resolve({ pushed: 0, pulled: 0, error: 'Sync timed out' }), SYNC_TIMEOUT_MS),
    ),
  ]);
}

export function resetSyncMeta() {
  localStorage.removeItem(META_KEY);
}
