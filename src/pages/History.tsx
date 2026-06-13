import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, subMonths, addMonths, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, SlidersHorizontal, Download } from 'lucide-react';
import { useAllExpenses } from '@/hooks/useExpenses';
import { useFilteredExpenses } from '@/hooks/useFilteredExpenses';
import { useCategoryStore } from '@/store/categoryStore';
import { formatDate, formatINR, monthKey, todayISO } from '@/utils/format';
import ExpenseCard from '@/components/ExpenseCard';
import CategoryFilterSheet from '@/components/CategoryFilterSheet';
import PdfExportSheet from '@/components/PdfExportSheet';
import type { CategoryId, Expense, PaymentMode } from '@/types';

const PAGE_SIZE = 50;

export default function History() {
  const navigate = useNavigate();
  useCategoryStore((s) => s.categories);
  const expenses = useAllExpenses();
  const [filters, setFilters] = useState<CategoryId[]>([]);
  const [paymentFilters, setPaymentFilters] = useState<PaymentMode[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => monthKey(todayISO()));
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  function prevMonth() {
    setSelectedMonth((m) => monthKey(format(subMonths(parseISO(m + '-01'), 1), 'yyyy-MM-dd')));
    setVisibleCount(PAGE_SIZE);
  }

  function nextMonth() {
    setSelectedMonth((m) => monthKey(format(addMonths(parseISO(m + '-01'), 1), 'yyyy-MM-dd')));
    setVisibleCount(PAGE_SIZE);
  }

  function toggleFilter(id: CategoryId) {
    setFilters((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]));
    setVisibleCount(PAGE_SIZE);
  }

  function clearFilters() {
    setFilters([]);
    setVisibleCount(PAGE_SIZE);
  }

  const filtered = useFilteredExpenses(expenses, {
    month: selectedMonth,
    categories: filters,
    paymentModes: paymentFilters,
  });

  const summary = useMemo(() => {
    const income = filtered
      .filter((e) => e.type === 'income')
      .reduce((s, e) => s + e.amount, 0);
    const expense = filtered
      .filter((e) => (e.type ?? 'expense') === 'expense')
      .reduce((s, e) => s + e.amount, 0);
    return { income, expense, total: income - expense };
  }, [filtered]);

  const paged = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  const grouped = useMemo(() => {
    const map = new Map<string, Expense[]>();
    for (const e of paged) {
      const arr = map.get(e.date) ?? [];
      arr.push(e);
      map.set(e.date, arr);
    }
    return Array.from(map.entries());
  }, [paged]);

  return (
    <main className="safe-top safe-bottom max-w-md mx-auto px-4">
      <header className="mb-4">
        {/* Month picker row with filter icon */}
        <div className="flex items-center justify-between mb-3">
          <div className="w-8" />
          <div className="flex items-center gap-3">
            <button
              onClick={prevMonth}
              className="p-1 rounded-full hover:bg-surface2 text-muted transition"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="bg-surface border border-border rounded-full px-4 py-1 text-sm font-semibold">
              {format(parseISO(selectedMonth + '-01'), 'MMM yyyy')}
            </span>
            <button
              onClick={nextMonth}
              className="p-1 rounded-full hover:bg-surface2 text-muted transition"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterOpen(true)}
              className="relative p-1 text-muted hover:text-primary transition"
              aria-label="Filter by category"
            >
              <SlidersHorizontal size={18} />
              {(filters.length + paymentFilters.length) > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-white text-[9px] flex items-center justify-center font-bold">
                  {filters.length + paymentFilters.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setPdfOpen(true)}
              className="p-1 text-muted hover:text-primary transition"
              aria-label="Export PDF"
            >
              <Download size={18} />
            </button>
          </div>
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-3 text-center bg-surface rounded-xl border border-border py-2">
          <div>
            <p className="text-xs text-muted">Income</p>
            <p className="text-sm font-semibold text-green-400">{formatINR(summary.income)}</p>
          </div>
          <div className="border-x border-border">
            <p className="text-xs text-muted">Exp.</p>
            <p className="text-sm font-semibold text-red-400">{formatINR(summary.expense)}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Total</p>
            <p className="text-sm font-semibold">{formatINR(summary.total)}</p>
          </div>
        </div>
      </header>

      {grouped.length === 0 ? (
        <p className="text-center text-muted mt-12">No expenses to show</p>
      ) : (
        <div className="space-y-5">
          {grouped.map(([date, items]) => {
            const total = items.reduce((s, e) => s + e.amount, 0);
            return (
              <section key={date}>
                <div className="flex items-center gap-3 mb-2 px-1">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted shrink-0">
                    {formatDate(date, 'EEE, d MMM')}
                  </h2>
                  <div className="flex-1 h-px bg-border/50" />
                  <span className="text-xs text-muted tabular-nums shrink-0">{formatINR(total)}</span>
                </div>
                <div className="space-y-2">
                  {items.map((e) => (
                    <ExpenseCard
                      key={e.id}
                      expense={e}
                      onClick={() => navigate(`/edit/${e.id}`)}
                      showDate={false}
                    />
                  ))}
                </div>
              </section>
            );
          })}
          {hasMore && (
            <button
              onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
              className="w-full py-3 text-sm text-primary font-medium text-center active:opacity-70 transition"
            >
              Load more ({filtered.length - visibleCount} remaining)
            </button>
          )}
        </div>
      )}

      <CategoryFilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        selected={filters}
        onToggle={toggleFilter}
        onClear={clearFilters}
        paymentFilter={paymentFilters}
        onPaymentToggle={(mode) =>
          setPaymentFilters((prev) =>
            prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode],
          )
        }
        onPaymentClear={() => setPaymentFilters([])}
      />
      <PdfExportSheet
        open={pdfOpen}
        onClose={() => setPdfOpen(false)}
        defaultMonth={selectedMonth}
        defaultCategories={filters}
      />
    </main>
  );
}
