import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown } from 'lucide-react';
import { findCategory } from '@/store/categoryStore';
import { usePaymentSourceStore } from '@/store/paymentSourceStore';
import { todayISO, currentTimeHHMM } from '@/utils/format';
import { useHaptics } from '@/hooks/useHaptics';
import ItemsTrigger from './ItemsTrigger';
import ItemsSheet from './ItemsSheet';
import CategorySheet from './CategorySheet';
import DateTimePicker from './DateTimePicker';
import PaymentModeSelector from './PaymentModeSelector';
import { expenseFormSchema, type ExpenseFormValues } from '@/schemas/expense';
import type { Expense, ExpenseItem, PaymentMode, PaymentSource } from '@/types';

export type { ExpenseFormValues };

interface Props {
  initialData?: Expense;
  onSubmit: (data: ExpenseFormValues, extra: {
    entryType: 'expense' | 'income';
    items: ExpenseItem[];
    selectedMode: PaymentMode | null;
    selectedSourceId: string | undefined;
  }) => Promise<void>;
  submitLabel?: string;
  children?: React.ReactNode;
}

export default function ExpenseForm({ initialData, onSubmit, submitLabel, children }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState<ExpenseItem[]>(initialData?.items ?? []);
  const [catOpen, setCatOpen] = useState(false);
  const [entryType, setEntryType] = useState<'expense' | 'income'>(initialData?.type ?? 'expense');
  const [selectedMode, setSelectedMode] = useState<PaymentMode | null>(initialData?.paymentMode ?? null);
  const [selectedSourceId, setSelectedSourceId] = useState<string | undefined>(initialData?.paymentSourceId);
  const [sourcePickerOpen, setSourcePickerOpen] = useState(false);
  const [itemsSheetOpen, setItemsSheetOpen] = useState(false);

  const paymentSources = usePaymentSourceStore((s) => s.paymentSources);
  const haptic = useHaptics();

  const { register, handleSubmit, watch, setValue, reset, formState } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: initialData
      ? {
          amount: initialData.amount,
          title: initialData.title,
          category: initialData.category,
          date: initialData.date,
          time: initialData.time ?? currentTimeHHMM(),
          note: initialData.note ?? '',
        }
      : { date: todayISO(), time: currentTimeHHMM(), category: 'food' },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        amount: initialData.amount,
        title: initialData.title,
        category: initialData.category,
        date: initialData.date,
        time: initialData.time ?? currentTimeHHMM(),
        note: initialData.note ?? '',
      });
      setItems(initialData.items ?? []);
      setEntryType(initialData.type ?? 'expense');
      setSelectedMode(initialData.paymentMode ?? null);
      setSelectedSourceId(initialData.paymentSourceId);
    }
  }, [initialData, reset]);

  const selectedCat = watch('category');
  const selectedCategory = findCategory(selectedCat ?? 'food');
  const itemsTotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const hasItems = items.length > 0;

  useEffect(() => {
    if (hasItems && itemsTotal > 0) {
      setValue('amount', itemsTotal, { shouldValidate: true });
    } else if (!hasItems && initialData) {
      setValue('amount', initialData.amount, { shouldValidate: true });
    }
  }, [itemsTotal, hasItems, setValue, initialData]);

  function handleModeSelect(mode: PaymentMode) {
    if (selectedMode === mode) {
      setSelectedMode(null);
      setSelectedSourceId(undefined);
    } else {
      setSelectedMode(mode);
      setSelectedSourceId(undefined);
    }
  }

  function handleSourceSelect(source: PaymentSource) {
    setSelectedSourceId(source.id);
  }

  const handleFormSubmit = async (data: ExpenseFormValues) => {
    setSubmitting(true);
    haptic('success');
    try {
      await onSubmit(data, { entryType, items, selectedMode, selectedSourceId });
    } finally {
      setSubmitting(false);
    }
  };

  const isIncome = entryType === 'income';
  const date = watch('date');
  const time = watch('time');

  const defaultSubmitLabel = submitting
    ? 'Saving…'
    : isIncome
    ? (submitLabel ?? 'Save income')
    : (submitLabel ?? 'Save expense');

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 space-y-5 pb-4">
        {/* Expense / Income toggle */}
        <div className="flex gap-1.5 rounded-2xl p-1.5 bg-surface border border-border">
          <button
            type="button"
            onClick={() => { setEntryType('income'); haptic('light'); }}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition active:scale-[0.97] ${
              isIncome ? 'bg-success text-white shadow-soft' : 'text-muted'
            }`}
          >
            Income
          </button>
          <button
            type="button"
            onClick={() => { setEntryType('expense'); haptic('light'); }}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition active:scale-[0.97] ${
              !isIncome ? 'bg-brand-gradient text-white shadow-soft' : 'text-muted'
            }`}
          >
            Expense
          </button>
        </div>

        {/* Amount — hero */}
        <div className="text-center pt-2">
          <label className="text-xs text-muted uppercase tracking-wider mb-1 block">
            Amount
            {hasItems && !isIncome && (
              <span className="ml-2 text-[10px] text-primary normal-case tracking-normal font-normal">
                auto from items
              </span>
            )}
          </label>
          <div className="flex items-center justify-center gap-1">
            <span className="text-3xl font-bold text-muted">₹</span>
            <input
              {...register('amount', { valueAsNumber: true })}
              type="number"
              inputMode="decimal"
              step="0.01"
              autoFocus={!hasItems}
              placeholder="0"
              readOnly={hasItems && !isIncome}
              onFocus={(e) => e.target.select()}
              className={`w-full max-w-[16rem] bg-transparent text-center text-5xl font-bold tabular-nums caret-primary placeholder:text-muted/40 focus:outline-none transition ${
                isIncome ? 'text-success' : 'text-gradient'
              } ${hasItems && !isIncome ? 'opacity-70 cursor-default' : ''}`}
            />
          </div>
        </div>

        {/* Title */}
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

        {/* Category — only for expenses */}
        {!isIncome && (
          <div>
            <label className="text-xs text-muted uppercase tracking-wider mb-2 block">Category</label>
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

        {/* Payment mode — only for expenses */}
        {!isIncome && (
          <PaymentModeSelector
            selectedMode={selectedMode}
            selectedSourceId={selectedSourceId}
            paymentSources={paymentSources}
            sourcePickerOpen={sourcePickerOpen}
            onModeSelect={handleModeSelect}
            onSourcePickerOpen={() => setSourcePickerOpen(true)}
            onSourcePickerClose={() => setSourcePickerOpen(false)}
            onSourceSelect={handleSourceSelect}
          />
        )}

        {/* Items — only for expenses */}
        {!isIncome && (
          <>
            <ItemsTrigger items={items} onOpen={() => setItemsSheetOpen(true)} />
            <ItemsSheet
              open={itemsSheetOpen}
              onClose={() => setItemsSheetOpen(false)}
              items={items}
              onChange={setItems}
            />
          </>
        )}

        {/* Date / Time */}
        <DateTimePicker
          date={date}
          time={time}
          registerDate={register('date', { required: true })}
          registerTime={register('time', { required: true })}
        />

        {/* Note */}
        <div>
          <label className="text-xs text-muted uppercase tracking-wider mb-2 block">Note</label>
          <input
            {...register('note')}
            placeholder="Optional"
            className="w-full bg-surface border border-border rounded-xl px-3 py-3 focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Sticky footer */}
      <div className="px-4 pt-3 pb-6 bg-bg border-t border-border/40 shrink-0 space-y-2">
        <button
          type="submit"
          disabled={submitting || !formState.isValid}
          className={`w-full text-white font-semibold py-4 rounded-2xl shadow-soft active:scale-[0.98] transition disabled:opacity-50 ${
            isIncome ? 'bg-success' : 'bg-brand-gradient'
          }`}
        >
          {defaultSubmitLabel}
        </button>
        {children}
      </div>

      {!isIncome && (
        <CategorySheet
          open={catOpen}
          onClose={() => setCatOpen(false)}
          selected={selectedCat}
          onSelect={(id) => setValue('category', id, { shouldValidate: true })}
        />
      )}
    </form>
  );
}
