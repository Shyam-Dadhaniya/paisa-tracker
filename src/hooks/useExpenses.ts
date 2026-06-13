import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/services/db';
import type { Expense } from '@/types';

const allExpensesQuery = () =>
  db.expenses
    .orderBy('date')
    .reverse()
    .filter((e) => !e.deleted)
    .toArray();

export function useAllExpenses(): Expense[] {
  return useLiveQuery(allExpensesQuery, []) ?? [];
}

/** Like useAllExpenses but exposes the initial loading state (undefined from
 *  Dexie before the first result), so callers can show skeletons. */
export function useAllExpensesState(): { expenses: Expense[]; loading: boolean } {
  const result = useLiveQuery(allExpensesQuery, []);
  return { expenses: result ?? [], loading: result === undefined };
}

export function useExpenseById(id: string): Expense | undefined | null {
  return useLiveQuery(() => db.expenses.get(id), [id]);
}
