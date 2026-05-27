import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/services/db';
import type { Expense } from '@/types';

export function useAllExpenses(): Expense[] {
  const data = useLiveQuery(
    () => db.expenses.orderBy('date').reverse().toArray(),
    [],
  );
  return data ?? [];
}
