export type CategoryId = string;

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
  syncedAt?: number;
  deleted?: boolean;
}

export interface Category {
  id: string;
  label: string;
  icon: string;
  color: string;
}

export interface CustomCategory {
  id: string;
  label: string;
  icon: string;
  color: string;
  createdAt: number;
}
