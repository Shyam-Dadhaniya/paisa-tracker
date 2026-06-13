import { create } from 'zustand';
import { db } from '@/services/db';
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
  deletePaymentSource: (id: string) => Promise<{ blocked: boolean; count: number }>;
}

export const usePaymentSourceStore = create<PaymentSourceStore>((set) => ({
  paymentSources: [],

  loadPaymentSources: async () => {
    set({ paymentSources: await reload() });
  },

  addPaymentSource: async ({ type, name, bankName }) => {
    const entry: PaymentSource = {
      id: 'ps_' + crypto.randomUUID(),
      type,
      name: name.trim(),
      bankName: bankName?.trim() || undefined,
      createdAt: Date.now(),
    };
    await db.paymentSources.add(entry);
    set({ paymentSources: await reload() });
    return entry.id;
  },

  deletePaymentSource: async (id) => {
    const linked = await db.expenses
      .filter((e) => !e.deleted && e.paymentSourceId === id)
      .count();
    if (linked > 0) {
      return { blocked: false, count: linked };
    }
    await db.paymentSources.update(id, { deleted: true });
    set({ paymentSources: await reload() });
    return { blocked: false, count: 0 };
  },
}));

export function findPaymentSource(id: string): PaymentSource | undefined {
  return usePaymentSourceStore.getState().paymentSources.find((s) => s.id === id);
}
