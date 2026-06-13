import { useMemo } from 'react';
import type { Expense } from '@/types';
import { monthKey } from '@/utils/format';

interface DashboardStats {
  todayTotal: number;
  monthTotal: number;
  byCat: Record<string, number>;
}

export function useDashboardStats(expenses: Expense[], today: string, thisMonth: string): DashboardStats {
  return useMemo(() => {
    let todayTotal = 0;
    let monthTotal = 0;
    const byCat: Record<string, number> = {};
    for (const e of expenses) {
      if ((e.type ?? 'expense') === 'expense') {
        if (e.date === today) todayTotal += e.amount;
        if (monthKey(e.date) === thisMonth) {
          monthTotal += e.amount;
          byCat[e.category] = (byCat[e.category] ?? 0) + e.amount;
        }
      }
    }
    return { todayTotal, monthTotal, byCat };
  }, [expenses, today, thisMonth]);
}
