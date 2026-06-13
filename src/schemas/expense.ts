import { z } from 'zod';

export const expenseFormSchema = z.object({
  amount: z.number({ error: 'Amount must be a number' }).positive('Amount must be greater than 0'),
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  category: z.string().min(1),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  note: z.string().max(500).optional(),
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;
