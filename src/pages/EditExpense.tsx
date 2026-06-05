import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ChevronLeft, ChevronDown } from 'lucide-react';
import { useCategoryStore } from '@/store/categoryStore';
import { findCategory } from '@/store/categoryStore';
import { useExpenseStore } from '@/store/expenseStore';
import { usePaymentSourceStore } from '@/store/paymentSourceStore';
import { useExpenseById } from '@/hooks/useExpenses';
import { formatDate } from '@/utils/format';
import { PAYMENT_MODE_META, resolveSourceLabel } from '@/utils/paymentSources';
import ItemsTable from '@/components/ItemsTable';
import CategorySheet from '@/components/CategorySheet';
import PaymentSourcePickerSheet from '@/components/PaymentSourcePickerSheet';
import type { CategoryId, ExpenseItem, PaymentMode } from '@/types';

interface FormValues {
  amount: number;
  title: string;
  category: CategoryId;
  date: string;
  note?: string;
}

export default function EditExpense() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  useCategoryStore((s) => s.categories);
  const updateExpense = useExpenseStore((s) => s.updateExpense);
  const deleteExpense = useExpenseStore((s) => s.deleteExpense);
  const expense = useExpenseById(id!);
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState<ExpenseItem[]>([]);
  const [catOpen, setCatOpen] = useState(false);
  const [entryType, setEntryType] = useState<'expense' | 'income'>('expense');
  const [selectedMode, setSelectedMode] = useState<PaymentMode | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState<string | undefined>(undefined);
  const [sourcePickerOpen, setSourcePickerOpen] = useState(false);

  const paymentSources = usePaymentSourceStore((s) => s.paymentSources);

  const { register, handleSubmit, watch, setValue, reset, formState } = useForm<FormValues>();
  const selectedCat = watch('category');
  const selectedCategory = findCategory(selectedCat ?? 'food');

  useEffect(() => {
    if (expense) {
      reset({
        amount: expense.amount,
        title: expense.title,
        category: expense.category,
        date: expense.date,
        note: expense.note ?? '',
      });
      setItems(expense.items ?? []);
      setEntryType(expense.type ?? 'expense');
      setSelectedMode(expense.paymentMode ?? null);
      setSelectedSourceId(expense.paymentSourceId);
    }
  }, [expense, reset]);

  const itemsTotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const hasItems = items.length > 0;

  useEffect(() => {
    if (hasItems && itemsTotal > 0) {
      setValue('amount', itemsTotal, { shouldValidate: true });
    } else if (!hasItems && expense) {
      setValue('amount', expense.amount, { shouldValidate: true });
    }
  }, [itemsTotal, hasItems, setValue, expense]);

  const handleDelete = async () => {
    if (confirm('Delete this entry?')) {
      await deleteExpense(id!);
      navigate('/history');
    }
  };

  function handleModeSelect(mode: PaymentMode) {
    if (selectedMode === mode) {
      setSelectedMode(null);
      setSelectedSourceId(undefined);
    } else {
      setSelectedMode(mode);
      setSelectedSourceId(undefined);
    }
  }

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true);
    await updateExpense(id!, {
      amount: hasItems && entryType === 'expense' ? itemsTotal : Number(data.amount),
      title: data.title.trim(),
      category: entryType === 'income' ? '__income__' : data.category,
      date: data.date,
      type: entryType,
      note: data.note?.trim() || undefined,
      items: entryType === 'expense' && items.length > 0 ? items : undefined,
      paymentMode: selectedMode ?? undefined,
      paymentSourceId: selectedSourceId,
    });
    navigate('/history');
  };

  if (expense === null) {
    return (
      <main className="safe-top safe-bottom max-w-md mx-auto px-4">
        <p className="text-center text-muted mt-12">Entry not found.</p>
      </main>
    );
  }

  if (expense === undefined) {
    return null;
  }

  const isIncome = entryType === 'income';

  return (
    <main className="safe-top flex flex-col h-[100dvh] max-w-md mx-auto">
      <header className="flex items-center gap-2 px-4 py-4 shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-muted active:scale-95"
          aria-label="Back"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">{isIncome ? 'Edit income' : 'Edit expense'}</h1>
      </header>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
        {/* Scrollable fields */}
        <div className="flex-1 overflow-y-auto px-4 space-y-5 pb-4">
          {/* Expense / Income toggle */}
          <div className="flex rounded-xl overflow-hidden border border-border">
            <button
              type="button"
              onClick={() => setEntryType('income')}
              className={`flex-1 py-2 text-sm font-medium transition ${
                isIncome ? 'bg-green-500 text-white' : 'bg-surface text-muted'
              }`}
            >
              Income
            </button>
            <button
              type="button"
              onClick={() => setEntryType('expense')}
              className={`flex-1 py-2 text-sm font-medium transition ${
                !isIncome ? 'bg-primary text-white' : 'bg-surface text-muted'
              }`}
            >
              Expense
            </button>
          </div>

          <div>
            <label className="text-xs text-muted uppercase tracking-wider mb-2 block">
              Amount (₹)
              {hasItems && !isIncome && (
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
              readOnly={hasItems && !isIncome}
              onFocus={(e) => e.target.select()}
              className={`w-full bg-surface border border-border rounded-2xl px-4 py-4 text-3xl font-bold tabular-nums focus:outline-none focus:border-primary transition ${
                hasItems && !isIncome ? 'opacity-60 cursor-default' : ''
              }`}
            />
          </div>

          <div>
            <label className="text-xs text-muted uppercase tracking-wider mb-2 block">
              {isIncome ? 'Source' : 'Title'}
            </label>
            <input
              {...register('title', { required: true })}
              placeholder={isIncome ? 'e.g. Salary' : 'e.g. Zomato, Milk, Coffee'}
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary"
            />
          </div>

          {!isIncome && (
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
          )}

          {!isIncome && (
            <div>
              <label className="text-xs text-muted uppercase tracking-wider mb-2 block">
                Payment Mode
              </label>
              <div className="flex gap-2">
                {(['cash', 'online', 'credit_card'] as PaymentMode[]).map((mode) => {
                  const meta = PAYMENT_MODE_META[mode];
                  const active = selectedMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => handleModeSelect(mode)}
                      className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-medium transition active:scale-95 ${
                        active
                          ? 'bg-primary/20 border-primary text-primary'
                          : 'bg-surface border-border text-muted'
                      }`}
                    >
                      <span className="text-base">{meta.icon}</span>
                      <span className="leading-tight text-center">{meta.label}</span>
                    </button>
                  );
                })}
              </div>
              {(selectedMode === 'online' || selectedMode === 'credit_card') && (
                <button
                  type="button"
                  onClick={() => setSourcePickerOpen(true)}
                  className="mt-2 w-full flex items-center gap-3 bg-surface border border-border rounded-xl px-4 py-3 text-left active:scale-[0.98] transition"
                >
                  <span className="text-lg">
                    {selectedMode === 'online' ? '🏦' : '💳'}
                  </span>
                  <span className={`flex-1 text-sm ${selectedSourceId ? '' : 'text-muted'}`}>
                    {selectedSourceId
                      ? resolveSourceLabel(selectedSourceId, paymentSources)
                      : selectedMode === 'online'
                      ? 'Select Bank'
                      : 'Select Card'}
                  </span>
                  <ChevronDown size={16} className="text-muted" />
                </button>
              )}
            </div>
          )}

          {!isIncome && <ItemsTable items={items} onChange={setItems} />}

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
        </div>

        {/* Sticky footer — always visible */}
        <div className="px-4 pt-3 pb-6 bg-bg border-t border-border/40 shrink-0 space-y-2">
          <button
            type="submit"
            disabled={submitting || !formState.isValid}
            className={`w-full text-white font-semibold py-4 rounded-2xl shadow-lg active:scale-[0.98] transition disabled:opacity-50 ${
              isIncome
                ? 'bg-green-500 shadow-green-500/30'
                : 'bg-primary shadow-primary/30'
            }`}
          >
            {submitting ? 'Saving…' : 'Save changes'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="w-full text-danger text-sm font-medium py-3 active:scale-[0.98] transition"
          >
            Delete entry
          </button>
        </div>
      </form>

      {!isIncome && (
        <CategorySheet
          open={catOpen}
          onClose={() => setCatOpen(false)}
          selected={selectedCat}
          onSelect={(id) => setValue('category', id, { shouldValidate: true })}
        />
      )}
      {!isIncome && (selectedMode === 'online' || selectedMode === 'credit_card') && (
        <PaymentSourcePickerSheet
          open={sourcePickerOpen}
          onClose={() => setSourcePickerOpen(false)}
          type={selectedMode === 'online' ? 'bank' : 'credit_card'}
          selectedId={selectedSourceId}
          onSelect={(s) => setSelectedSourceId(s.id)}
        />
      )}
    </main>
  );
}
