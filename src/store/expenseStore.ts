import { create } from 'zustand';
import { db } from '@/services/db';
import { triggerSync } from './triggerSync';
import { uuid } from '@/utils/uuid';
import type { Expense } from '@/types';

interface ExpenseStore {
  addExpense: (
    e: Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'source' | 'type'> & {
      source?: Expense['source'];
      type?: Expense['type'];
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
      type: input.type ?? 'expense',
      ...input,
    };
    await db.expenses.add(expense);
    triggerSync();
    return expense;
  },
  deleteExpense: async (id) => {
    await db.expenses.update(id, { deleted: true, updatedAt: Date.now() });
    triggerSync();
  },
  updateExpense: async (id, patch) => {
    await db.expenses.update(id, { ...patch, updatedAt: Date.now() });
    triggerSync();
  },
  clearAll: async () => {
    await db.expenses.clear();
  },
}));
