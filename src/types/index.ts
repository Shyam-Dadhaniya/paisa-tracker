export type CategoryId =
  | 'food'
  | 'transport'
  | 'shopping'
  | 'bills'
  | 'entertainment'
  | 'health'
  | 'other';

export interface Expense {
  id: string;
  merchant: string;
  amount: number; // rupees (decimal)
  category: CategoryId;
  date: string; // ISO date YYYY-MM-DD
  note?: string;
  source: 'manual' | 'sms' | 'recurring';
  smsRaw?: string;
  createdAt: number;
  updatedAt: number;
  deleted?: boolean;
}

export interface Category {
  id: CategoryId;
  label: string;
  icon: string;
  color: string;
}
