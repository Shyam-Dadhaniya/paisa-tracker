import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAllExpenses } from '@/hooks/useExpenses';
import { formatINR, todayISO, monthKey } from '@/utils/format';
import { CATEGORIES, getCategory } from '@/utils/categories';
import ExpenseCard from '@/components/ExpenseCard';
import type { CategoryId } from '@/types';

export default function Dashboard() {
  const expenses = useAllExpenses();
  const today = todayISO();
  const thisMonth = monthKey(today);

  const stats = useMemo(() => {
    let todayTotal = 0;
    let monthTotal = 0;
    const byCat: Record<string, number> = {};
    for (const e of expenses) {
      if (e.date === today) todayTotal += e.amount;
      if (monthKey(e.date) === thisMonth) {
        monthTotal += e.amount;
        byCat[e.category] = (byCat[e.category] ?? 0) + e.amount;
      }
    }
    return { todayTotal, monthTotal, byCat };
  }, [expenses, today, thisMonth]);

  const recent = expenses.slice(0, 5);
  const sortedCats = CATEGORIES.filter((c) => stats.byCat[c.id]).sort(
    (a, b) => (stats.byCat[b.id] ?? 0) - (stats.byCat[a.id] ?? 0),
  );

  return (
    <main className="safe-top safe-bottom max-w-md mx-auto px-4">
      <header className="mb-6">
        <p className="text-muted text-sm">Hey there 👋</p>
        <h1 className="text-2xl font-bold">PaisaTrack</h1>
      </header>

      <section className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-gradient-to-br from-primary to-primaryDim rounded-2xl p-4 shadow-lg shadow-primary/20">
          <p className="text-xs text-white/80 mb-1">Today</p>
          <p className="text-2xl font-bold tabular-nums">{formatINR(stats.todayTotal)}</p>
        </div>
        <div className="bg-surface rounded-2xl p-4 border border-border">
          <p className="text-xs text-muted mb-1">This month</p>
          <p className="text-2xl font-bold tabular-nums">{formatINR(stats.monthTotal)}</p>
        </div>
      </section>

      {sortedCats.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-muted mb-3 uppercase tracking-wider">
            This month by category
          </h2>
          <div className="space-y-2">
            {sortedCats.map((c) => {
              const v = stats.byCat[c.id as CategoryId] ?? 0;
              const pct = stats.monthTotal ? (v / stats.monthTotal) * 100 : 0;
              return (
                <div key={c.id} className="bg-surface rounded-xl p-3 border border-border/60">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span>
                      {c.icon} {c.label}
                    </span>
                    <span className="tabular-nums font-medium">{formatINR(v)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface2 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: c.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">Recent</h2>
          <Link to="/history" className="text-sm text-primary">
            See all
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="bg-surface rounded-2xl p-8 text-center border border-border/60">
            <p className="text-muted mb-3">No expenses yet</p>
            <Link
              to="/add"
              className="inline-block bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium"
            >
              Add your first
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map((e) => (
              <ExpenseCard key={e.id} expense={e} />
            ))}
          </div>
        )}
        <p className="text-xs text-muted/60 text-center mt-6">
          Data stored locally · {expenses.length} total entries
        </p>
      </section>
    </main>
  );
}

// keep getCategory imported (avoids unused warning if tree-shaking acts up)
void getCategory;
