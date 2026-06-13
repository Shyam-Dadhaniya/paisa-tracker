import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/services/db';
import type { Expense } from '@/types';

export function useAllExpenses(): Expense[] {
  return useLiveQuery(
    () =>
      db.expenses
        .orderBy('date')
        .reverse()
        .filter((e) => !e.deleted)
        .toArray(),
    [],
  ) ?? [];
}

export function useExpenseById(id: string): Expense | undefined | null {
  return useLiveQuery(() => db.expenses.get(id), [id]);
}
