import Dexie, { type Table } from 'dexie';
import { format } from 'date-fns';
import type { Expense, CustomCategory, PaymentSource } from '@/types';

type Syncable = { createdAt: number; updatedAt?: number; syncedAt?: number };

class PaisaTrackDB extends Dexie {
  expenses!: Table<Expense, string>;
  customCategories!: Table<CustomCategory, string>;
  paymentSources!: Table<PaymentSource, string>;

  constructor() {
    super('paisatrack');
    this.version(1).stores({
      expenses: 'id, date, category, createdAt, updatedAt, deleted',
    });
    this.version(2).stores({
      expenses: 'id, date, category, createdAt, updatedAt, deleted',
      customCategories: 'id, createdAt',
    });
    this.version(3).stores({
      expenses: 'id, date, category, createdAt, updatedAt, deleted',
      customCategories: 'id, createdAt',
      paymentSources: 'id, type, createdAt',
    });
    this.version(4).stores({
      expenses: 'id, date, category, createdAt, updatedAt, deleted',
      customCategories: 'id, createdAt',
      paymentSources: 'id, type, createdAt',
    }).upgrade(async (tx) => {
      await tx.table('expenses').toCollection().modify((expense: Expense) => {
        if (!expense.time) {
          expense.time = format(new Date(expense.createdAt), 'HH:mm');
        }
      });
    });
    this.version(5).stores({
      expenses: 'id, date, category, type, createdAt, updatedAt, deleted',
      customCategories: 'id, createdAt',
      paymentSources: 'id, type, createdAt',
    }).upgrade(async (tx) => {
      await tx.table('expenses').toCollection().modify((expense: Expense) => {
        if (expense.category === '__income__') {
          expense.type = 'income';
          expense.category = 'other';
        } else if (!expense.type) {
          expense.type = 'expense';
        }
      });
    });
    this.version(6).stores({
      expenses: 'id, date, category, type, createdAt, updatedAt, deleted',
      customCategories: 'id, createdAt',
      paymentSources: 'id, type, createdAt',
    }).upgrade(async (tx) => {
      // Backfill sync timestamps so existing rows are not treated as dirty.
      const backfill = (row: Syncable) => {
        if (row.updatedAt == null) row.updatedAt = row.createdAt;
        if (row.syncedAt == null) row.syncedAt = row.updatedAt;
      };
      await tx.table('customCategories').toCollection().modify(backfill);
      await tx.table('paymentSources').toCollection().modify(backfill);
    });
  }
}

export const db = new PaisaTrackDB();
