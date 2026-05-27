import { create } from 'zustand';
import { db } from '@/services/db';
import type { Expense } from '@/types';

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface ExpenseStore {
  addExpense: (
    e: Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'source'> & {
      source?: Expense['source'];
    },
  ) => Promise<Expense>;
  deleteExpense: (id: string) => Promise<void>;
  updateExpense: (id: string, patch: Partial<Expense>) => Promise<void>;
  clearAll: () => Promise<void>;
}

export const useExpenseStore = create<ExpenseStore>(() => ({
  addExpense: async (input) => {
    const now = Date.now();
    const expense: Expense = {
      id: uuid(),
      createdAt: now,
      updatedAt: now,
      source: input.source ?? 'manual',
      ...input,
    };
    await db.expenses.add(expense);
    return expense;
  },
  deleteExpense: async (id) => {
    await db.expenses.delete(id);
  },
  updateExpense: async (id, patch) => {
    await db.expenses.update(id, { ...patch, updatedAt: Date.now() });
  },
  clearAll: async () => {
    await db.expenses.clear();
  },
}));
