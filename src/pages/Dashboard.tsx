import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronUp } from 'lucide-react';
import { useAllExpenses } from '@/hooks/useExpenses';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { formatINR, todayISO, monthKey } from '@/utils/format';
import { useCategoryStore } from '@/store/categoryStore';
import ExpenseCard from '@/components/ExpenseCard';
import SyncIndicator from '@/components/SyncIndicator';

export default function Dashboard() {
  const expenses = useAllExpenses();
  const today = todayISO();
  const thisMonth = monthKey(today);
  const stats = useDashboardStats(expenses, today, thisMonth);

  const navigate = useNavigate();
  const categories = useCategoryStore((s) => s.categories);
  const recent = expenses.slice(0, 5);
  const sortedCats = categories.filter((c) => stats.byCat[c.id]).sort(
    (a, b) => (stats.byCat[b.id] ?? 0) - (stats.byCat[a.id] ?? 0),
  );
  const [showAllCats, setShowAllCats] = useState(false);
  const visibleCats = showAllCats ? sortedCats : sortedCats.slice(0, 2);
  const hiddenCount = sortedCats.length - 2;

  return (
    <main className="safe-top safe-bottom max-w-md mx-auto px-4">
      <header className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-muted text-sm">Hey there 👋</p>
          <h1 className="text-2xl font-bold">PaisaTrack</h1>
        </div>
        <SyncIndicator />
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
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">
              This month by category
            </h2>
            {hiddenCount > 0 && (
              <button
                onClick={() => setShowAllCats((v) => !v)}
                className="text-sm text-primary flex items-center gap-0.5 active:opacity-70 transition"
              >
                {showAllCats ? (
                  <><ChevronUp size={14} /><span>Less</span></>
                ) : (
                  <span>See all</span>
                )}
              </button>
            )}
          </div>
          <div className="space-y-2">
            {visibleCats.map((c) => {
              const v = stats.byCat[c.id] ?? 0;
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
              <ExpenseCard key={e.id} expense={e} onClick={() => navigate(`/edit/${e.id}`)} />
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

