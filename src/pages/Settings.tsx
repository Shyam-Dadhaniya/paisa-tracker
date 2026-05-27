import { Download, Trash2, Info } from 'lucide-react';
import { useAllExpenses } from '@/hooks/useExpenses';
import { useExpenseStore } from '@/store/expenseStore';
import { downloadCSV, expensesToCSV } from '@/utils/csv';
import { todayISO } from '@/utils/format';

export default function Settings() {
  const expenses = useAllExpenses();
  const clearAll = useExpenseStore((s) => s.clearAll);

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
      confirm('Really sure? This wipes local data.')
    ) {
      await clearAll();
    }
  };

  return (
    <main className="safe-top safe-bottom max-w-md mx-auto px-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
      </header>

      <div className="space-y-3">
        <Row icon={<Download size={20} />} label="Export to CSV" onClick={handleExport}>
          <span className="text-xs text-muted">{expenses.length} entries</span>
        </Row>

        <Row icon={<Trash2 size={20} />} label="Clear all data" onClick={handleClear} danger />
      </div>

      <section className="mt-8 bg-surface rounded-2xl p-4 border border-border/60">
        <div className="flex items-start gap-2 text-xs text-muted leading-relaxed">
          <Info size={16} className="shrink-0 mt-0.5" />
          <p>
            Data is stored locally on this device only (IndexedDB). To prevent loss on iOS (7-day
            inactivity rule), open this app at least once a week and export CSV regularly. Cloud
            sync will be added in the next phase.
          </p>
        </div>
      </section>

      <p className="text-center text-xs text-muted/50 mt-8">PaisaTrack v0.1 · local-only MVP</p>
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
      <span className={`flex-1 text-left font-medium ${danger ? 'text-danger' : ''}`}>
        {label}
      </span>
      {children}
    </button>
  );
}
