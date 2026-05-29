import Dexie, { type Table } from 'dexie';
import type { Expense, CustomCategory } from '@/types';

class PaisaTrackDB extends Dexie {
  expenses!: Table<Expense, string>;
  customCategories!: Table<CustomCategory, string>;

  constructor() {
    super('paisatrack');
    this.version(1).stores({
      expenses: 'id, date, category, createdAt, updatedAt, deleted',
    });
    this.version(2).stores({
      expenses: 'id, date, category, createdAt, updatedAt, deleted',
      customCategories: 'id, createdAt',
    });
  }
}

export const db = new PaisaTrackDB();
