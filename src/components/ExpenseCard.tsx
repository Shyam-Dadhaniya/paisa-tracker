import { Trash2, Pencil } from 'lucide-react';
import type { Expense } from '@/types';
import { formatINR, formatDate } from '@/utils/format';
import { getCategory } from '@/utils/categories';

interface Props {
  expense: Expense;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
  showDate?: boolean;
}

export default function ExpenseCard({ expense, onDelete, onEdit, showDate = true }: Props) {
  const cat = getCategory(expense.category);
  return (
    <div className="flex items-center gap-3 bg-surface rounded-2xl p-3 border border-border/60">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
        style={{ backgroundColor: cat.color + '22' }}
      >
        {cat.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-semibold truncate">{expense.merchant}</p>
          <p className="font-semibold tabular-nums">{formatINR(expense.amount)}</p>
        </div>
        <div className="flex items-baseline justify-between gap-2 text-xs text-muted">
          <p className="truncate">
            {cat.label}
            {expense.note ? ` · ${expense.note}` : ''}
          </p>
          {showDate && <p className="shrink-0">{formatDate(expense.date, 'd MMM')}</p>}
        </div>
      </div>
      {onEdit && (
        <button
          onClick={() => onEdit(expense.id)}
          className="p-2 text-muted hover:text-primary hover:bg-primary/10 rounded-xl active:scale-95 transition"
          aria-label="Edit"
        >
          <Pencil size={16} />
        </button>
      )}
      {onDelete && (
        <button
          onClick={() => onDelete(expense.id)}
          className="p-2 text-muted hover:text-danger active:scale-95 transition"
          aria-label="Delete"
        >
          <Trash2 size={18} />
        </button>
      )}
    </div>
  );
}
