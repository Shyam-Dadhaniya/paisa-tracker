import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/services/db';
import type { Expense } from '@/types';

export function useAllExpenses(): Expense[] {
  const data = useLiveQuery(
    () => db.expenses.orderBy('date').reverse().filter((e) => !e.deleted).toArray(),
    [],
  );
  if (!data) return [];
  return [...data].sort((a, b) => {
    const aKey = `${a.date}T${a.time ?? '00:00'}`;
    const bKey = `${b.date}T${b.time ?? '00:00'}`;
    return bKey.localeCompare(aKey);
  });
}

export function useExpenseById(id: string): Expense | undefined | null {
  return useLiveQuery(() => db.expenses.get(id), [id]);
}
