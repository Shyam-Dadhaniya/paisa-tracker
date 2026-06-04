import type { Expense } from '@/types';
import { formatINR, formatDate } from '@/utils/format';
import { findCategory } from '@/store/categoryStore';

interface Props {
  expense: Expense;
  onClick?: () => void;
  showDate?: boolean;
}

export default function ExpenseCard({ expense, onClick, showDate = true }: Props) {
  const cat = findCategory(expense.category);
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 bg-surface rounded-2xl p-3 border border-border/60 transition active:scale-[0.98] ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
        style={{ backgroundColor: cat.color + '22' }}
      >
        {cat.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-semibold truncate">{expense.title}</p>
          <p className="font-semibold tabular-nums">{formatINR(expense.amount)}</p>
        </div>
        <div className="flex items-baseline justify-between gap-2 text-xs text-muted">
          <p className="truncate">
            {cat.label}
            {expense.note ? ` · ${expense.note}` : ''}
            {expense.items && expense.items.length > 0 ? ` · ${expense.items.length} item${expense.items.length > 1 ? 's' : ''}` : ''}
          </p>
          {showDate && <p className="shrink-0">{formatDate(expense.date, 'd MMM')}</p>}
        </div>
      </div>
    </div>
  );
}
