import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFilteredExpenses } from '@/hooks/useFilteredExpenses';
import type { Expense } from '@/types';

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: crypto.randomUUID(),
    title: 'Test',
    amount: 100,
    category: 'food',
    date: '2026-06-01',
    time: '12:00',
    type: 'expense',
    source: 'manual',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

const expenses: Expense[] = [
  makeExpense({ id: '1', category: 'food', date: '2026-06-01', paymentMode: 'cash', type: 'expense' }),
  makeExpense({ id: '2', category: 'transport', date: '2026-06-01', paymentMode: 'online', type: 'expense' }),
  makeExpense({ id: '3', category: 'food', date: '2026-05-15', paymentMode: 'cash', type: 'expense' }),
  makeExpense({ id: '4', category: 'bills', date: '2026-06-02', paymentMode: 'credit_card', type: 'income' }),
];

describe('useFilteredExpenses', () => {
  it('returns all expenses with no filters', () => {
    const { result } = renderHook(() => useFilteredExpenses(expenses, {}));
    expect(result.current).toHaveLength(4);
  });

  it('filters by month', () => {
    const { result } = renderHook(() => useFilteredExpenses(expenses, { month: '2026-06' }));
    expect(result.current).toHaveLength(3);
  });

  it('filters by category', () => {
    const { result } = renderHook(() => useFilteredExpenses(expenses, { categories: ['food'] }));
    expect(result.current).toHaveLength(2);
  });

  it('filters by payment mode', () => {
    const { result } = renderHook(() => useFilteredExpenses(expenses, { paymentModes: ['cash'] }));
    expect(result.current).toHaveLength(2);
  });

  it('filters by type income', () => {
    const { result } = renderHook(() => useFilteredExpenses(expenses, { type: 'income' }));
    expect(result.current).toHaveLength(1);
    expect(result.current[0].id).toBe('4');
  });

  it('filters by type expense', () => {
    const { result } = renderHook(() => useFilteredExpenses(expenses, { type: 'expense' }));
    expect(result.current).toHaveLength(3);
  });

  it('combines month and category filters', () => {
    const { result } = renderHook(() =>
      useFilteredExpenses(expenses, { month: '2026-06', categories: ['food'] })
    );
    expect(result.current).toHaveLength(1);
    expect(result.current[0].id).toBe('1');
  });

  it('returns empty when no expenses match', () => {
    const { result } = renderHook(() => useFilteredExpenses(expenses, { categories: ['health'] }));
    expect(result.current).toHaveLength(0);
  });
});
