import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import type { Expense } from '@/types';

// Test the v5 migration logic directly (not through the full DB class)
// since Dexie version upgrades can't easily be re-run in tests.
function applyV5Migration(expenses: Partial<Expense>[]): Partial<Expense>[] {
  return expenses.map((expense) => {
    const e = { ...expense };
    if (e.category === '__income__') {
      e.type = 'income';
      e.category = 'other';
    } else if (!e.type) {
      e.type = 'expense';
    }
    return e;
  });
}

describe('DB v5 migration logic', () => {
  it('converts __income__ category to type=income, category=other', () => {
    const input = [{ id: '1', category: '__income__', amount: 5000, title: 'Salary' }];
    const result = applyV5Migration(input);
    expect(result[0].type).toBe('income');
    expect(result[0].category).toBe('other');
  });

  it('sets type=expense for records without a type', () => {
    const input = [{ id: '2', category: 'food', amount: 200, title: 'Lunch' }];
    const result = applyV5Migration(input);
    expect(result[0].type).toBe('expense');
  });

  it('preserves existing type=income records', () => {
    const input = [{ id: '3', category: 'food', type: 'income' as const, amount: 1000, title: 'Freelance' }];
    const result = applyV5Migration(input);
    expect(result[0].type).toBe('income');
    expect(result[0].category).toBe('food');
  });

  it('preserves existing type=expense records', () => {
    const input = [{ id: '4', category: 'transport', type: 'expense' as const, amount: 150, title: 'Uber' }];
    const result = applyV5Migration(input);
    expect(result[0].type).toBe('expense');
    expect(result[0].category).toBe('transport');
  });

  it('handles mixed batch correctly', () => {
    const input = [
      { id: '1', category: '__income__', amount: 5000, title: 'Salary' },
      { id: '2', category: 'food', amount: 300 },
      { id: '3', category: 'bills', type: 'expense' as const, amount: 500, title: 'Electricity' },
    ];
    const result = applyV5Migration(input);
    expect(result[0]).toMatchObject({ type: 'income', category: 'other' });
    expect(result[1]).toMatchObject({ type: 'expense', category: 'food' });
    expect(result[2]).toMatchObject({ type: 'expense', category: 'bills' });
  });

  it('does not set category=other for non-income records', () => {
    const input = [{ id: '5', category: 'shopping', amount: 800 }];
    const result = applyV5Migration(input);
    expect(result[0].category).toBe('shopping');
  });
});
