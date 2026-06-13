export type CategoryId = string;

export type PaymentMode = 'cash' | 'online' | 'credit_card';

export interface PaymentSource {
  id: string;
  type: 'bank' | 'credit_card';
  name: string;
  bankName?: string;
  createdAt: number;
  updatedAt?: number;
  syncedAt?: number;
  deleted?: boolean;
}

export interface ExpenseItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

export interface Expense {
  id: string;
  title: string;
  amount: number; // rupees (decimal)
  category: CategoryId;
  date: string; // ISO date YYYY-MM-DD
  time?: string; // HH:MM — transaction time; defaults to time of entry creation
  type: 'income' | 'expense';
  note?: string;
  source: 'manual' | 'sms' | 'recurring';
  smsRaw?: string;
  items?: ExpenseItem[];
  createdAt: number;
  updatedAt: number;
  syncedAt?: number;
  deleted?: boolean;
  paymentMode?: PaymentMode;
  paymentSourceId?: string;
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
  updatedAt?: number;
  syncedAt?: number;
  deleted?: boolean;
}
