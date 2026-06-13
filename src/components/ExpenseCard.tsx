import type { Expense } from '@/types';
import { formatINR, formatDate } from '@/utils/format';
import { findCategory } from '@/store/categoryStore';
import { usePaymentSourceStore } from '@/store/paymentSourceStore';
import { PAYMENT_MODE_META, resolveSourceLabel } from '@/utils/paymentSources';

interface Props {
  expense: Expense;
  onClick?: () => void;
  showDate?: boolean;
}

export default function ExpenseCard({ expense, onClick, showDate = true }: Props) {
  const cat = findCategory(expense.category);
  const paymentSources = usePaymentSourceStore((s) => s.paymentSources);

  const isIncome = (expense.type ?? 'expense') === 'income';

  const paymentLabel = expense.paymentMode
    ? expense.paymentMode === 'cash'
      ? `${PAYMENT_MODE_META.cash.icon} Cash`
      : `${PAYMENT_MODE_META[expense.paymentMode].icon} ${
          resolveSourceLabel(expense.paymentSourceId, paymentSources) ||
          PAYMENT_MODE_META[expense.paymentMode].label
        }`
    : null;

  const itemCount = expense.items?.length ?? 0;
  const hasRow3 = paymentLabel || itemCount > 0 || showDate;

  return (
    <div
      onClick={onClick}
      className={`flex items-start gap-3 bg-surface rounded-2xl p-3.5 border border-border/60 shadow-soft transition active:scale-[0.98] ${onClick ? 'cursor-pointer' : ''}`}
    >
      {/* Category icon */}
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 mt-0.5 ring-1 ring-inset ring-white/5"
        style={{
          backgroundImage: `linear-gradient(135deg, ${cat.color}3D, ${cat.color}1A)`,
        }}
      >
        {cat.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Row 1: Title + Amount */}
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-[15px] leading-snug truncate">{expense.title}</p>
          <p className={`font-bold tabular-nums text-sm shrink-0 ${isIncome ? 'text-success' : 'text-danger'}`}>
            {formatINR(expense.amount)}
          </p>
        </div>

        {/* Row 2: Category dot + label + note */}
        <div className="flex items-center gap-1.5 mt-1">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: cat.color }}
          />
          <p className="text-xs text-muted truncate">
            {cat.label}
            {expense.note ? ` · ${expense.note}` : ''}
          </p>
        </div>

        {/* Row 3: Pills + Date (only when there's something to show) */}
        {hasRow3 && (
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {paymentLabel && (
              <span className="inline-flex items-center bg-surface2 border border-border/60 rounded-full px-2 py-0.5 text-[10px] text-muted leading-none">
                {paymentLabel}
              </span>
            )}
            {itemCount > 0 && (
              <span className="inline-flex items-center bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px] font-medium leading-none">
                {itemCount} item{itemCount > 1 ? 's' : ''}
              </span>
            )}
            {showDate && (
              <span className="ml-auto text-xs text-muted/70 shrink-0 tabular-nums">
                {formatDate(expense.date, 'd MMM')}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
