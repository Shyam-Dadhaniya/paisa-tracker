import { describe, it, expect } from 'vitest';
import { expenseFormSchema } from '@/schemas/expense';

const validInput = {
  amount: 350,
  title: 'Zomato order',
  category: 'food',
  date: '2026-06-01',
  time: '13:00',
  note: 'Lunch',
};

describe('expenseFormSchema', () => {
  it('accepts valid expense data', () => {
    const result = expenseFormSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('rejects zero amount', () => {
    const result = expenseFormSchema.safeParse({ ...validInput, amount: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects negative amount', () => {
    const result = expenseFormSchema.safeParse({ ...validInput, amount: -100 });
    expect(result.success).toBe(false);
  });

  it('rejects missing title', () => {
    const result = expenseFormSchema.safeParse({ ...validInput, title: '' });
    expect(result.success).toBe(false);
  });

  it('rejects title longer than 100 chars', () => {
    const result = expenseFormSchema.safeParse({ ...validInput, title: 'A'.repeat(101) });
    expect(result.success).toBe(false);
  });

  it('rejects missing date', () => {
    const result = expenseFormSchema.safeParse({ ...validInput, date: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing time', () => {
    const result = expenseFormSchema.safeParse({ ...validInput, time: '' });
    expect(result.success).toBe(false);
  });

  it('allows optional note to be absent', () => {
    const { note: _, ...withoutNote } = validInput;
    const result = expenseFormSchema.safeParse(withoutNote);
    expect(result.success).toBe(true);
  });

  it('rejects note longer than 500 chars', () => {
    const result = expenseFormSchema.safeParse({ ...validInput, note: 'A'.repeat(501) });
    expect(result.success).toBe(false);
  });

  it('accepts decimal amounts', () => {
    const result = expenseFormSchema.safeParse({ ...validInput, amount: 12.50 });
    expect(result.success).toBe(true);
  });
});
