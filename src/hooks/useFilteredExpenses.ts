import { useMemo } from 'react';
import type { Expense, CategoryId, PaymentMode } from '@/types';
import { monthKey } from '@/utils/format';

interface Filters {
  month?: string;
  categories?: CategoryId[];
  paymentModes?: PaymentMode[];
  type?: 'income' | 'expense';
}

export function useFilteredExpenses(expenses: Expense[], filters: Filters): Expense[] {
  return useMemo(
    () =>
      expenses
        .filter((e) => !filters.month || monthKey(e.date) === filters.month)
        .filter((e) => !filters.categories?.length || filters.categories.includes(e.category))
        .filter((e) => !filters.paymentModes?.length || filters.paymentModes.includes(e.paymentMode as PaymentMode))
        .filter((e) => !filters.type || (e.type ?? 'expense') === filters.type),
    [expenses, filters.month, filters.categories, filters.paymentModes, filters.type],
  );
}
