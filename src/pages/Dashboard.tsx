import { lazy, Suspense, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { ChevronUp, RefreshCw } from 'lucide-react';
import { useAllExpensesState } from '@/hooks/useExpenses';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useSync } from '@/hooks/useSync';
import { formatINR, formatDate, todayISO, monthKey } from '@/utils/format';
import { getThemeColors } from '@/constants/theme';
import { useCategoryStore } from '@/store/categoryStore';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/profileStore';
import ExpenseCard from '@/components/ExpenseCard';
import SyncIndicator from '@/components/SyncIndicator';
import AnimatedNumber from '@/components/ui/AnimatedNumber';
import EmptyState from '@/components/ui/EmptyState';
import { ExpenseListSkeleton } from '@/components/ui/Skeleton';
import type { DonutSlice, ActiveInfo } from '@/components/charts/SpendDonut';
import type { TrendPoint } from '@/components/charts/SpendTrend';

const SpendDonut = lazy(() => import('@/components/charts/SpendDonut'));
const SpendTrend = lazy(() => import('@/components/charts/SpendTrend'));

const MAX_DONUT_SLICES = 6;
const OTHER_ID = '__other__';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/** Daily expense totals for the last 14 days (oldest → newest). */
function buildTrend(expenses: { date: string; amount: number; type?: string }[]): TrendPoint[] {
  const byDay = new Map<string, number>();
  for (const e of expenses) {
    if ((e.type ?? 'expense') === 'expense') byDay.set(e.date, (byDay.get(e.date) ?? 0) + e.amount);
  }
  const points: TrendPoint[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    // Use local date (matches how expense.date is stored via todayISO), not UTC.
    const iso = format(d, 'yyyy-MM-dd');
    points.push({ date: iso, value: byDay.get(iso) ?? 0 });
  }
  return points;
}

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function Dashboard() {
  const { expenses, loading } = useAllExpensesState();
  const today = todayISO();
  const thisMonth = monthKey(today);
  const stats = useDashboardStats(expenses, today, thisMonth);
  const { syncNow } = useSync();
  const { distance, refreshing, progress } = usePullToRefresh(syncNow);

  const navigate = useNavigate();
  const categories = useCategoryStore((s) => s.categories);
  const user = useAuthStore((s) => s.user);
  const localName = useProfileStore((s) => s.localName);
  const syncedName = (user?.user_metadata?.display_name as string | undefined)?.trim() || null;
  const emailName = user?.email ? user.email.split('@')[0] : null;
  const name = syncedName || localName || emailName || null;

  const recent = expenses.slice(0, 5);
  const sortedCats = categories
    .filter((c) => stats.byCat[c.id])
    .sort((a, b) => (stats.byCat[b.id] ?? 0) - (stats.byCat[a.id] ?? 0));
  const [showAllCats, setShowAllCats] = useState(false);
  const visibleCats = showAllCats ? sortedCats : sortedCats.slice(0, 2);
  const hiddenCount = sortedCats.length - 2;

  // Donut: top categories + a merged "Other" slice so the ring stays readable.
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const selectCat = (id: string) => setActiveCat((prev) => (prev === id ? null : id));

  const slices: DonutSlice[] = sortedCats.map((c) => ({
    id: c.id,
    label: c.label,
    value: stats.byCat[c.id] ?? 0,
    color: c.color,
  }));
  if (slices.length > MAX_DONUT_SLICES) {
    const rest = slices.splice(MAX_DONUT_SLICES);
    slices.push({
      id: OTHER_ID,
      label: 'Other',
      value: rest.reduce((s, x) => s + x.value, 0),
      color: getThemeColors().muted,
    });
  }
  const sliceIds = new Set(slices.map((s) => s.id));
  // A small category folded into "Other" highlights the Other slice on the ring.
  const donutActiveId = activeCat ? (sliceIds.has(activeCat) ? activeCat : OTHER_ID) : null;

  const pctOf = (v: number) => (stats.monthTotal ? Math.round((v / stats.monthTotal) * 100) : 0);
  let activeInfo: ActiveInfo | null = null;
  if (activeCat === OTHER_ID) {
    const other = slices.find((s) => s.id === OTHER_ID);
    if (other) activeInfo = { label: 'Other', value: other.value, pct: pctOf(other.value) };
  } else if (activeCat) {
    const cat = sortedCats.find((c) => c.id === activeCat);
    const value = stats.byCat[activeCat] ?? 0;
    if (cat && value) activeInfo = { label: cat.label, value, pct: pctOf(value) };
  }

  const trend = buildTrend(expenses);
  const hasTrend = trend.some((p) => p.value > 0);

  return (
    <main className="safe-top safe-bottom max-w-md mx-auto px-4">
      {/* Pull-to-refresh indicator */}
      <div
        className="flex justify-center overflow-hidden"
        style={{ height: distance, opacity: progress }}
      >
        <RefreshCw
          size={22}
          className={`text-primary mt-2 ${refreshing ? 'animate-spin' : ''}`}
          style={{ transform: refreshing ? undefined : `rotate(${progress * 270}deg)` }}
        />
      </div>

      <header className="mb-6 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-muted text-sm">{greeting()} 👋</p>
          <h1 className="text-2xl font-bold capitalize truncate">{name ?? 'PaisaTrack'}</h1>
        </div>
        <SyncIndicator />
      </header>

      {/* Monthly spend hero */}
      {stats.monthTotal > 0 && (
        <section className="bg-surface rounded-3xl p-5 border border-border/60 shadow-soft mb-4">
          <Suspense fallback={<div className="h-56 shimmer rounded-2xl" />}>
            <SpendDonut
              slices={slices}
              total={stats.monthTotal}
              caption={`spent in ${formatDate(today, 'MMMM')}`}
              activeId={donutActiveId}
              activeInfo={activeInfo}
              onSelect={selectCat}
            />
          </Suspense>
        </section>
      )}

      <section className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-brand-gradient rounded-2xl p-4 shadow-soft">
          <p className="text-xs text-white/80 mb-1">Today</p>
          <AnimatedNumber
            value={stats.todayTotal}
            format={formatINR}
            className="text-2xl font-bold text-white"
          />
        </div>
        <div className="bg-surface rounded-2xl p-4 border border-border">
          <p className="text-xs text-muted mb-1">This month</p>
          <AnimatedNumber
            value={stats.monthTotal}
            format={formatINR}
            className="text-2xl font-bold"
          />
        </div>
      </section>

      {/* Spend trend */}
      {hasTrend && (
        <section className="bg-surface rounded-2xl p-4 border border-border/60 mb-6">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
            Last 14 days
          </p>
          <Suspense fallback={<div className="h-28 shimmer rounded-xl" />}>
            <SpendTrend data={trend} />
          </Suspense>
        </section>
      )}

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
                  <>
                    <ChevronUp size={14} />
                    <span>Less</span>
                  </>
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
              const isActive = activeCat === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => selectCat(c.id)}
                  className={`block w-full text-left bg-surface rounded-xl p-3 border transition active:scale-[0.99] ${
                    isActive ? 'border-primary ring-1 ring-primary/50' : 'border-border/60'
                  }`}
                >
                  <div className="flex justify-between text-sm mb-1.5">
                    <span>
                      {c.icon} {c.label}
                    </span>
                    <span className="tabular-nums font-medium">{formatINR(v)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface2 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: c.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                  </div>
                </button>
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
        {loading ? (
          <ExpenseListSkeleton count={4} />
        ) : recent.length === 0 ? (
          <EmptyState
            emoji="🧾"
            title="No expenses yet"
            subtitle="Start tracking your spending — your first entry is one tap away."
            cta={{ label: 'Add your first', to: '/add' }}
          />
        ) : (
          <motion.div
            className="space-y-2"
            variants={listVariants}
            initial="hidden"
            animate="show"
          >
            {recent.map((e) => (
              <motion.div key={e.id} variants={itemVariants}>
                <ExpenseCard expense={e} onClick={() => navigate(`/edit/${e.id}`)} />
              </motion.div>
            ))}
          </motion.div>
        )}
        {!loading && expenses.length > 0 && (
          <p className="text-xs text-muted/60 text-center mt-6">
            Data stored locally · {expenses.length} total entries
          </p>
        )}
      </section>
    </main>
  );
}
