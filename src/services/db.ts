import Dexie, { type Table } from 'dexie';
import { format } from 'date-fns';
import type { Expense, CustomCategory, PaymentSource } from '@/types';

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
  }
}

export const db = new PaisaTrackDB();
