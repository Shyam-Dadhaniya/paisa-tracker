import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { format, addMonths, subMonths, parseISO } from 'date-fns';
import { useAllExpenses } from '@/hooks/useExpenses';
import { useCategoryStore } from '@/store/categoryStore';
import { usePaymentSourceStore } from '@/store/paymentSourceStore';
import { monthKey, todayISO } from '@/utils/format';
import { PAYMENT_MODE_META } from '@/utils/paymentSources';
import { generatePDF } from '@/utils/pdf';
import BaseSheet from './BaseSheet';
import type { CategoryId, PaymentMode } from '@/types';

type PeriodType = 'month' | 'year' | 'range';
type TxType = 'all' | 'income' | 'expense';

interface Props {
  open: boolean;
  onClose: () => void;
  defaultMonth?: string;
  defaultCategories?: CategoryId[];
}

export default function PdfExportSheet({ open, onClose, defaultMonth, defaultCategories }: Props) {
  const expenses = useAllExpenses();
  const categories = useCategoryStore((s) => s.categories);
  const paymentSources = usePaymentSourceStore((s) => s.paymentSources);

  const [periodType, setPeriodType] = useState<PeriodType>('month');
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth ?? monthKey(todayISO()));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<CategoryId[]>(defaultCategories ?? []);
  const [txType, setTxType] = useState<TxType>('all');
  const [paymentModeFilter, setPaymentModeFilter] = useState<PaymentMode[]>([]);
  const [selectedBankIds, setSelectedBankIds] = useState<string[]>([]);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [rangeError, setRangeError] = useState('');

  const banks = paymentSources.filter((s) => s.type === 'bank');
  const cards = paymentSources.filter((s) => s.type === 'credit_card');

  useEffect(() => {
    if (open) {
      setSelectedMonth(defaultMonth ?? monthKey(todayISO()));
      setSelectedCategories(defaultCategories ?? []);
      setPaymentModeFilter([]);
      setSelectedBankIds([]);
      setSelectedCardIds([]);
      setRangeError('');
    }
  }, [open, defaultMonth, defaultCategories]);

  function prevMonth() {
    setSelectedMonth((m) => monthKey(format(subMonths(parseISO(m + '-01'), 1), 'yyyy-MM-dd')));
  }
  function nextMonth() {
    setSelectedMonth((m) => monthKey(format(addMonths(parseISO(m + '-01'), 1), 'yyyy-MM-dd')));
  }

  function toggleCategory(id: CategoryId) {
    setSelectedCategories((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  function togglePaymentMode(mode: PaymentMode) {
    setPaymentModeFilter((prev) => {
      const next = prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode];
      if (!next.includes('online')) setSelectedBankIds([]);
      if (!next.includes('credit_card')) setSelectedCardIds([]);
      return next;
    });
  }

  function toggleId(id: string, arr: string[], set: (v: string[]) => void) {
    set(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);
  }

  function buildFilterSummary(): string {
    const parts: string[] = [];
    if (paymentModeFilter.includes('cash')) parts.push('Cash');
    if (paymentModeFilter.includes('online')) {
      const names = selectedBankIds.length > 0
        ? selectedBankIds.map((id) => banks.find((b) => b.id === id)?.name ?? id).join(', ')
        : 'All banks';
      parts.push(`Online / UPI (${names})`);
    }
    if (paymentModeFilter.includes('credit_card')) {
      const names = selectedCardIds.length > 0
        ? selectedCardIds.map((id) => cards.find((c) => c.id === id)?.name ?? id).join(', ')
        : 'All cards';
      parts.push(`Credit Card (${names})`);
    }
    return parts.length > 0 ? `Payment: ${parts.join(' · ')}` : '';
  }

  function handleDownload() {
    if (periodType === 'range') {
      if (!fromDate || !toDate) {
        setRangeError('Please select both From and To dates.');
        return;
      }
      if (fromDate > toDate) {
        setRangeError('"From" date must be before "To" date.');
        return;
      }
    }
    setRangeError('');
    setLoading(true);

    setTimeout(() => {
      try {
        const filtered = expenses.filter((e) => {
          if (periodType === 'month' && monthKey(e.date) !== selectedMonth) return false;
          if (periodType === 'year' && !e.date.startsWith(String(selectedYear))) return false;
          if (periodType === 'range' && (e.date < fromDate || e.date > toDate)) return false;
          if (selectedCategories.length > 0 && !selectedCategories.includes(e.category)) return false;
          const etype = e.type ?? 'expense';
          if (txType === 'income' && etype !== 'income') return false;
          if (txType === 'expense' && etype !== 'expense') return false;
          if (paymentModeFilter.length > 0) {
            const mode = e.paymentMode;
            if (!mode || !paymentModeFilter.includes(mode)) return false;
            if (mode === 'online' && selectedBankIds.length > 0) {
              if (!e.paymentSourceId || !selectedBankIds.includes(e.paymentSourceId)) return false;
            }
            if (mode === 'credit_card' && selectedCardIds.length > 0) {
              if (!e.paymentSourceId || !selectedCardIds.includes(e.paymentSourceId)) return false;
            }
          }
          return true;
        });

        let periodLabel = '';
        if (periodType === 'month') {
          periodLabel = format(parseISO(selectedMonth + '-01'), 'MMM yyyy');
        } else if (periodType === 'year') {
          periodLabel = String(selectedYear);
        } else {
          periodLabel = `${format(parseISO(fromDate), 'd MMM yyyy')} – ${format(parseISO(toDate), 'd MMM yyyy')}`;
        }

        generatePDF({
          expenses: filtered,
          periodLabel,
          categories,
          paymentSources,
          filterSummary: buildFilterSummary(),
        });
        onClose();
      } finally {
        setLoading(false);
      }
    }, 0);
  }

  const currentYear = new Date().getFullYear();

  return (
    <BaseSheet open={open} onClose={onClose} side="bottom" className="max-h-[90dvh]">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
        <h2 className="text-base font-semibold">Export PDF</h2>
        <button onClick={onClose} className="p-1.5 rounded-lg text-muted active:scale-90 transition">
          <X size={20} />
        </button>
      </div>

      <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
        {/* Period type */}
        <div>
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Period</p>
          <div className="flex bg-surface2 rounded-xl p-1 gap-1">
            {(['month', 'year', 'range'] as PeriodType[]).map((t) => (
              <button
                key={t}
                onClick={() => setPeriodType(t)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${
                  periodType === t ? 'bg-primary text-white' : 'text-muted'
                }`}
              >
                {t === 'month' ? 'Month' : t === 'year' ? 'Year' : 'Custom'}
              </button>
            ))}
          </div>
        </div>

        {/* Period picker */}
        {periodType === 'month' && (
          <div className="flex items-center justify-between bg-surface2 border border-border rounded-xl px-4 py-3">
            <button onClick={prevMonth} className="p-1 text-muted"><ChevronLeft size={18} /></button>
            <span className="text-sm font-semibold">
              {format(parseISO(selectedMonth + '-01'), 'MMMM yyyy')}
            </span>
            <button onClick={nextMonth} className="p-1 text-muted"><ChevronRight size={18} /></button>
          </div>
        )}

        {periodType === 'year' && (
          <div className="flex items-center justify-between bg-surface2 border border-border rounded-xl px-4 py-3">
            <button
              onClick={() => setSelectedYear((y) => Math.max(2020, y - 1))}
              className="p-1 text-muted disabled:opacity-30"
              disabled={selectedYear <= 2020}
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-semibold">{selectedYear}</span>
            <button
              onClick={() => setSelectedYear((y) => Math.min(currentYear, y + 1))}
              className="p-1 text-muted disabled:opacity-30"
              disabled={selectedYear >= currentYear}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {periodType === 'range' && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted mb-1 block">From</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => { setFromDate(e.target.value); setRangeError(''); }}
                  className="w-full bg-surface2 border border-border rounded-xl px-3 py-2.5 text-sm text-text"
                />
              </div>
              <div>
                <label className="text-xs text-muted mb-1 block">To</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => { setToDate(e.target.value); setRangeError(''); }}
                  className="w-full bg-surface2 border border-border rounded-xl px-3 py-2.5 text-sm text-text"
                />
              </div>
            </div>
            {rangeError && <p className="text-xs text-danger">{rangeError}</p>}
          </div>
        )}

        {/* Categories */}
        <div>
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Categories</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategories([])}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                selectedCategories.length === 0
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'bg-surface2 border-border text-muted'
              }`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => toggleCategory(c.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                  selectedCategories.includes(c.id)
                    ? 'bg-primary/20 border-primary text-primary'
                    : 'bg-surface2 border-border text-muted'
                }`}
              >
                {c.icon} {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Transaction type */}
        <div>
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Type</p>
          <div className="flex bg-surface2 rounded-xl p-1 gap-1">
            {(['all', 'expense', 'income'] as TxType[]).map((t) => (
              <button
                key={t}
                onClick={() => setTxType(t)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition capitalize ${
                  txType === t ? 'bg-primary text-white' : 'text-muted'
                }`}
              >
                {t === 'all' ? 'All' : t === 'expense' ? 'Expenses' : 'Income'}
              </button>
            ))}
          </div>
        </div>

        {/* Payment mode */}
        <div>
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Payment Mode</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setPaymentModeFilter([]); setSelectedBankIds([]); setSelectedCardIds([]); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                paymentModeFilter.length === 0
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'bg-surface2 border-border text-muted'
              }`}
            >
              All
            </button>
            {(['cash', 'online', 'credit_card'] as PaymentMode[]).map((mode) => {
              const meta = PAYMENT_MODE_META[mode];
              const active = paymentModeFilter.includes(mode);
              return (
                <button
                  key={mode}
                  onClick={() => togglePaymentMode(mode)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                    active ? 'bg-primary/20 border-primary text-primary' : 'bg-surface2 border-border text-muted'
                  }`}
                >
                  {meta.icon} {meta.label}
                </button>
              );
            })}
          </div>

          {paymentModeFilter.includes('online') && banks.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] text-muted uppercase tracking-wider mb-1.5">Bank</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedBankIds([])}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                    selectedBankIds.length === 0
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-surface2 border-border text-muted'
                  }`}
                >
                  All
                </button>
                {banks.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => toggleId(s.id, selectedBankIds, setSelectedBankIds)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                      selectedBankIds.includes(s.id)
                        ? 'bg-primary/20 border-primary text-primary'
                        : 'bg-surface2 border-border text-muted'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {paymentModeFilter.includes('credit_card') && cards.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] text-muted uppercase tracking-wider mb-1.5">Card</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCardIds([])}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                    selectedCardIds.length === 0
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-surface2 border-border text-muted'
                  }`}
                >
                  All
                </button>
                {cards.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => toggleId(s.id, selectedCardIds, setSelectedCardIds)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                      selectedCardIds.includes(s.id)
                        ? 'bg-primary/20 border-primary text-primary'
                        : 'bg-surface2 border-border text-muted'
                    }`}
                  >
                    {s.name}{s.bankName ? ` (${s.bankName})` : ''}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 py-4 border-t border-border shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button
          onClick={handleDownload}
          disabled={loading}
          className="w-full py-3.5 bg-primary rounded-2xl font-semibold text-white flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-60"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : null}
          {loading ? 'Generating…' : 'Download PDF'}
        </button>
      </div>
    </BaseSheet>
  );
}
