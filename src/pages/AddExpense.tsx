import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ChevronLeft, ChevronDown } from 'lucide-react';
import { useCategoryStore } from '@/store/categoryStore';
import { findCategory } from '@/store/categoryStore';
import { useExpenseStore } from '@/store/expenseStore';
import { todayISO, formatDate } from '@/utils/format';
import ItemsTable from '@/components/ItemsTable';
import CategorySheet from '@/components/CategorySheet';
import type { CategoryId, ExpenseItem } from '@/types';

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
  const [items, setItems] = useState<ExpenseItem[]>([]);
  const [catOpen, setCatOpen] = useState(false);

  useCategoryStore((s) => s.categories);
  const { register, handleSubmit, watch, setValue, formState } = useForm<FormValues>({
    defaultValues: { date: todayISO(), category: 'food' },
  });
  const selectedCat = watch('category');
  const selectedCategory = findCategory(selectedCat ?? 'food');

  const itemsTotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const hasItems = items.length > 0;

  useEffect(() => {
    if (hasItems && itemsTotal > 0) {
      setValue('amount', itemsTotal, { shouldValidate: true });
    } else if (!hasItems) {
      setValue('amount', 0 as unknown as number);
    }
  }, [itemsTotal, hasItems, setValue]);

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true);
    await addExpense({
      amount: hasItems ? itemsTotal : Number(data.amount),
      merchant: data.merchant.trim(),
      category: data.category,
      date: data.date,
      note: data.note?.trim() || undefined,
      items: items.length > 0 ? items : undefined,
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
            {hasItems && (
              <span className="ml-2 text-[10px] text-primary normal-case tracking-normal font-normal">
                auto from items
              </span>
            )}
          </label>
          <input
            {...register('amount', { required: true, min: 0.01 })}
            type="number"
            inputMode="decimal"
            step="0.01"
            autoFocus={!hasItems}
            placeholder="0"
            readOnly={hasItems}
            className={`w-full bg-surface border border-border rounded-2xl px-4 py-4 text-3xl font-bold tabular-nums focus:outline-none focus:border-primary transition ${
              hasItems ? 'opacity-60 cursor-default' : ''
            }`}
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
          <button
            type="button"
            onClick={() => setCatOpen(true)}
            className="w-full flex items-center gap-3 bg-surface border border-border rounded-xl px-4 py-3 text-left active:scale-[0.98] transition"
          >
            <span className="text-2xl">{selectedCategory.icon}</span>
            <span className="font-medium flex-1">{selectedCategory.label}</span>
            <ChevronDown size={18} className="text-muted" />
          </button>
        </div>

        <ItemsTable items={items} onChange={setItems} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted uppercase tracking-wider mb-2 block">
              Date
            </label>
            <div className="relative w-full">
              <div className="w-full bg-surface border border-border rounded-xl px-3 py-3 pointer-events-none select-none">
                {watch('date') ? formatDate(watch('date'), 'd MMM yyyy') : 'Select date'}
              </div>
              <input
                {...register('date', { required: true })}
                type="date"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
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

      <CategorySheet
        open={catOpen}
        onClose={() => setCatOpen(false)}
        selected={selectedCat}
        onSelect={(id) => setValue('category', id, { shouldValidate: true })}
      />
    </main>
  );
}
