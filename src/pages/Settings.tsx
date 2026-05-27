import { Download, Trash2, Info, LogIn, LogOut, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAllExpenses } from '@/hooks/useExpenses';
import { useExpenseStore } from '@/store/expenseStore';
import { useAuthStore } from '@/store/authStore';
import { useSync } from '@/hooks/useSync';
import { downloadCSV, expensesToCSV } from '@/utils/csv';
import { todayISO } from '@/utils/format';

export default function Settings() {
  const expenses = useAllExpenses();
  const clearAll = useExpenseStore((s) => s.clearAll);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const { status, syncNow } = useSync();

  const handleExport = () => {
    if (expenses.length === 0) {
      alert('No expenses to export');
      return;
    }
    downloadCSV(`paisatrack-${todayISO()}.csv`, expensesToCSV(expenses));
  };

  const handleClear = async () => {
    if (
      confirm(`Delete all ${expenses.length} expenses? This cannot be undone.`) &&
      confirm('Really sure? This wipes local data only — cloud data stays.')
    ) {
      await clearAll();
    }
  };

  return (
    <main className="safe-top safe-bottom max-w-md mx-auto px-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
      </header>

      <section className="mb-5">
        <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 px-1">Account</h2>
        {user ? (
          <div className="bg-surface rounded-2xl border border-border/60 divide-y divide-border/40">
            <div className="px-4 py-3.5">
              <p className="text-xs text-muted">Signed in as</p>
              <p className="font-medium truncate">{user.email}</p>
            </div>
            <button
              onClick={syncNow}
              className="w-full flex items-center gap-3 px-4 py-3.5 active:scale-[0.99] transition"
            >
              <RefreshCw size={20} className="text-primary" />
              <span className="flex-1 text-left font-medium">Sync now</span>
              <span className="text-xs text-muted capitalize">{status}</span>
            </button>
            <button
              onClick={signOut}
              className="w-full flex items-center gap-3 px-4 py-3.5 active:scale-[0.99] transition"
            >
              <LogOut size={20} className="text-muted" />
              <span className="flex-1 text-left">Sign out</span>
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="flex items-center gap-3 bg-surface rounded-2xl px-4 py-3.5 border border-border/60 active:scale-[0.99] transition"
          >
            <LogIn size={20} className="text-primary" />
            <div className="flex-1">
              <p className="font-medium">Enable cloud sync</p>
              <p className="text-xs text-muted">Sync across devices, survive iOS data wipes</p>
            </div>
          </Link>
        )}
      </section>

      <section className="mb-5">
        <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 px-1">Data</h2>
        <div className="space-y-3">
          <Row icon={<Download size={20} />} label="Export to CSV" onClick={handleExport}>
            <span className="text-xs text-muted">{expenses.length} entries</span>
          </Row>
          <Row icon={<Trash2 size={20} />} label="Clear local data" onClick={handleClear} danger />
        </div>
      </section>

      <section className="bg-surface rounded-2xl p-4 border border-border/60">
        <div className="flex items-start gap-2 text-xs text-muted leading-relaxed">
          <Info size={16} className="shrink-0 mt-0.5" />
          <p>
            With cloud sync on, your data lives in Supabase and survives iOS's 7-day data wipe. Without it,
            export CSV regularly and open the app weekly.
          </p>
        </div>
      </section>

      <p className="text-center text-xs text-muted/50 mt-8">PaisaTrack v0.2</p>
    </main>
  );
}

function Row({
  icon,
  label,
  onClick,
  children,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  children?: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 bg-surface rounded-2xl px-4 py-3.5 border border-border/60 active:scale-[0.99] transition"
    >
      <span className={danger ? 'text-danger' : 'text-primary'}>{icon}</span>
      <span className={`flex-1 text-left font-medium ${danger ? 'text-danger' : ''}`}>{label}</span>
      {children}
    </button>
  );
}
