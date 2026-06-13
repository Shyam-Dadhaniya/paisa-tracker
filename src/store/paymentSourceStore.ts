import { create } from 'zustand';
import { db } from '@/services/db';
import { triggerSync } from './triggerSync';
import { uuid } from '@/utils/uuid';
import type { PaymentSource } from '@/types';

async function reload(): Promise<PaymentSource[]> {
  return db.paymentSources
    .orderBy('createdAt')
    .filter((s) => !s.deleted)
    .toArray();
}

interface PaymentSourceStore {
  paymentSources: PaymentSource[];
  loadPaymentSources: () => Promise<void>;
  addPaymentSource: (data: {
    type: 'bank' | 'credit_card';
    name: string;
    bankName?: string;
  }) => Promise<string>;
  /** Resolves with the count of expenses still linked to this source. A
   *  non-zero count means deletion was skipped — the caller should warn. */
  deletePaymentSource: (id: string) => Promise<{ linkedCount: number }>;
}

export const usePaymentSourceStore = create<PaymentSourceStore>((set) => ({
  paymentSources: [],

  loadPaymentSources: async () => {
    set({ paymentSources: await reload() });
  },

  addPaymentSource: async ({ type, name, bankName }) => {
    const now = Date.now();
    const entry: PaymentSource = {
      id: 'ps_' + uuid(),
      type,
      name: name.trim(),
      bankName: bankName?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };
    await db.paymentSources.add(entry);
    set({ paymentSources: await reload() });
    triggerSync();
    return entry.id;
  },

  deletePaymentSource: async (id) => {
    const linked = await db.expenses
      .filter((e) => !e.deleted && e.paymentSourceId === id)
      .count();
    if (linked > 0) {
      return { linkedCount: linked };
    }
    // Soft-delete so the tombstone propagates to the cloud and other devices.
    await db.paymentSources.update(id, { deleted: true, updatedAt: Date.now() });
    set({ paymentSources: await reload() });
    triggerSync();
    return { linkedCount: 0 };
  },
}));

export function findPaymentSource(id: string): PaymentSource | undefined {
  return usePaymentSourceStore.getState().paymentSources.find((s) => s.id === id);
}
