import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAllExpenses } from '@/hooks/useExpenses';
import { useExpenseStore } from '@/store/expenseStore';
import { CATEGORIES } from '@/utils/categories';
import { formatDate, formatINR } from '@/utils/format';
import ExpenseCard from '@/components/ExpenseCard';
import type { CategoryId, Expense } from '@/types';

export default function History() {
  const navigate = useNavigate();
  const expenses = useAllExpenses();
  const deleteExpense = useExpenseStore((s) => s.deleteExpense);
  const [filter, setFilter] = useState<CategoryId | 'all'>('all');

  const filtered = useMemo(
    () => (filter === 'all' ? expenses : expenses.filter((e) => e.category === filter)),
    [expenses, filter],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, Expense[]>();
    for (const e of filtered) {
      const arr = map.get(e.date) ?? [];
      arr.push(e);
      map.set(e.date, arr);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const handleDelete = async (id: string) => {
    if (confirm('Delete this expense?')) await deleteExpense(id);
  };

  const handleEdit = (id: string) => navigate(`/edit/${id}`);

  return (
    <main className="safe-top safe-bottom max-w-md mx-auto px-4">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">History</h1>
        <p className="text-sm text-muted">{filtered.length} entries</p>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-4 px-4">
        <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
          All
        </Chip>
        {CATEGORIES.map((c) => (
          <Chip key={c.id} active={filter === c.id} onClick={() => setFilter(c.id)}>
            {c.icon} {c.label}
          </Chip>
        ))}
      </div>

      {grouped.length === 0 ? (
        <p className="text-center text-muted mt-12">No expenses to show</p>
      ) : (
        <div className="space-y-5">
          {grouped.map(([date, items]) => {
            const total = items.reduce((s, e) => s + e.amount, 0);
            return (
              <section key={date}>
                <div className="flex justify-between items-baseline mb-2 px-1">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
                    {formatDate(date, 'EEE, d MMM')}
                  </h2>
                  <span className="text-xs text-muted tabular-nums">{formatINR(total)}</span>
                </div>
                <div className="space-y-2">
                  {items.map((e) => (
                    <ExpenseCard
                      key={e.id}
                      expense={e}
                      onDelete={handleDelete}
                      onEdit={handleEdit}
                      showDate={false}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm border transition ${
        active
          ? 'bg-primary border-primary text-white'
          : 'bg-surface border-border text-muted'
      }`}
    >
      {children}
    </button>
  );
}
