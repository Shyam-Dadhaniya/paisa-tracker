import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ChevronLeft } from 'lucide-react';
import { CATEGORIES } from '@/utils/categories';
import { useExpenseStore } from '@/store/expenseStore';
import { todayISO } from '@/utils/format';
import type { CategoryId } from '@/types';

interface FormValues {
  amount: number;
  merchant: string;
  category: CategoryId;
  date: string;
  note?: string;
}

export default function AddExpense() {
  const navigate = useNavigate();
  const addExpense = useExpenseStore((s) => s.addExpense);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, watch, setValue, formState } = useForm<FormValues>({
    defaultValues: { date: todayISO(), category: 'food' },
  });
  const selectedCat = watch('category');

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true);
    await addExpense({
      amount: Number(data.amount),
      merchant: data.merchant.trim(),
      category: data.category,
      date: data.date,
      note: data.note?.trim() || undefined,
    });
    navigate('/');
  };

  return (
    <main className="safe-top safe-bottom max-w-md mx-auto px-4">
      <header className="flex items-center gap-2 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-muted active:scale-95"
          aria-label="Back"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Add expense</h1>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="text-xs text-muted uppercase tracking-wider mb-2 block">
            Amount (₹)
          </label>
          <input
            {...register('amount', { required: true, min: 0.01 })}
            type="number"
            inputMode="decimal"
            step="0.01"
            autoFocus
            placeholder="0"
            className="w-full bg-surface border border-border rounded-2xl px-4 py-4 text-3xl font-bold tabular-nums focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="text-xs text-muted uppercase tracking-wider mb-2 block">
            Merchant
          </label>
          <input
            {...register('merchant', { required: true })}
            placeholder="e.g. Zomato"
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="text-xs text-muted uppercase tracking-wider mb-2 block">
            Category
          </label>
          <div className="grid grid-cols-4 gap-2">
            {CATEGORIES.map((c) => {
              const active = selectedCat === c.id;
              return (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setValue('category', c.id, { shouldValidate: true })}
                  className={`flex flex-col items-center gap-1 py-3 rounded-xl border transition active:scale-95 ${
                    active
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-surface'
                  }`}
                >
                  <span className="text-2xl">{c.icon}</span>
                  <span className="text-[11px]">{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted uppercase tracking-wider mb-2 block">
              Date
            </label>
            <input
              {...register('date', { required: true })}
              type="date"
              className="w-full bg-surface border border-border rounded-xl px-3 py-3 focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs text-muted uppercase tracking-wider mb-2 block">
              Note
            </label>
            <input
              {...register('note')}
              placeholder="Optional"
              className="w-full bg-surface border border-border rounded-xl px-3 py-3 focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || !formState.isValid}
          className="w-full bg-primary text-white font-semibold py-4 rounded-2xl shadow-lg shadow-primary/30 active:scale-[0.98] transition disabled:opacity-50"
        >
          {submitting ? 'Saving…' : 'Save expense'}
        </button>
      </form>
    </main>
  );
}
