import Dexie, { type Table } from 'dexie';
import type { Expense } from '@/types';

class PaisaTrackDB extends Dexie {
  expenses!: Table<Expense, string>;

  constructor() {
    super('paisatrack');
    this.version(1).stores({
      expenses: 'id, date, category, createdAt, updatedAt, deleted',
    });
  }
}

export const db = new PaisaTrackDB();
