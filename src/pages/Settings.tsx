import { useState } from 'react';
import { Download, Trash2, Info, LogIn, LogOut, RefreshCw, Tag, ChevronRight, DatabaseBackup, FileDown, Wallet, Sun, Moon, Monitor } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAllExpenses } from '@/hooks/useExpenses';
import { useExpenseStore } from '@/store/expenseStore';
import { useThemeStore, type ThemeMode } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { useCategoryStore } from '@/store/categoryStore';
import { useSync } from '@/hooks/useSync';
import { resetSyncMeta } from '@/services/syncEngine';
import { downloadCSV, expensesToCSV } from '@/utils/csv';
import { todayISO } from '@/utils/format';
import PdfExportSheet from '@/components/PdfExportSheet';
import { usePaymentSourceStore } from '@/store/paymentSourceStore';

export default function Settings() {
  const navigate = useNavigate();
  const expenses = useAllExpenses();
  const clearAll = useExpenseStore((s) => s.clearAll);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const { status, syncNow } = useSync();
  const categories = useCategoryStore((s) => s.categories);
  const customCount = categories.filter((c) => c.id.startsWith('custom_')).length;
  const { paymentSources } = usePaymentSourceStore();
  const bankCount = paymentSources.filter((s) => s.type === 'bank').length;
  const cardCount = paymentSources.filter((s) => s.type === 'credit_card').length;
  const [resetting, setResetting] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);
  const themeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setMode);

  const handleExport = () => {
    if (expenses.length === 0) {
      alert('No expenses to export');
      return;
    }
    downloadCSV(`paisatrack-${todayISO()}.csv`, expensesToCSV(expenses));
  };

  const handleResetSync = async () => {
    if (!confirm('Clear all local data and re-fetch everything from cloud?')) return;
    setResetting(true);
    await clearAll();
    resetSyncMeta();
    await syncNow();
    setResetting(false);
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
        <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 px-1">Appearance</h2>
        <ThemeToggle mode={themeMode} onChange={setThemeMode} />
      </section>

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
              onClick={handleResetSync}
              disabled={resetting}
              className="w-full flex items-center gap-3 px-4 py-3.5 active:scale-[0.99] transition disabled:opacity-50"
            >
              <DatabaseBackup size={20} className="text-primary" />
              <span className="flex-1 text-left font-medium">Reset & re-sync from cloud</span>
              {resetting && <span className="text-xs text-muted">Syncing…</span>}
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
        <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 px-1">Categories</h2>
        <div className="space-y-3">
          <button
            onClick={() => navigate('/categories')}
            className="w-full flex items-center gap-3 bg-surface rounded-2xl px-4 py-3.5 border border-border/60 active:scale-[0.99] transition"
          >
            <Tag size={20} className="text-primary" />
            <span className="flex-1 text-left font-medium">Custom Categories</span>
            {customCount > 0 && (
              <span className="text-xs text-muted">{customCount} custom</span>
            )}
            <ChevronRight size={16} className="text-muted" />
          </button>
          <button
            onClick={() => navigate('/payment-sources')}
            className="w-full flex items-center gap-3 bg-surface rounded-2xl px-4 py-3.5 border border-border/60 active:scale-[0.99] transition"
          >
            <Wallet size={20} className="text-primary" />
            <span className="flex-1 text-left font-medium">Payment Sources</span>
            {(bankCount > 0 || cardCount > 0) && (
              <span className="text-xs text-muted">
                {bankCount > 0 ? `${bankCount} bank${bankCount > 1 ? 's' : ''}` : ''}
                {bankCount > 0 && cardCount > 0 ? ', ' : ''}
                {cardCount > 0 ? `${cardCount} card${cardCount > 1 ? 's' : ''}` : ''}
              </span>
            )}
            <ChevronRight size={16} className="text-muted" />
          </button>
        </div>
      </section>

      <section className="mb-5">
        <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 px-1">Data</h2>
        <div className="space-y-3">
          <Row icon={<Download size={20} />} label="Export to CSV" onClick={handleExport}>
            <span className="text-xs text-muted">{expenses.length} entries</span>
          </Row>
          <Row icon={<FileDown size={20} />} label="Export PDF" onClick={() => setPdfOpen(true)}>
            <span className="text-xs text-muted">Filtered report</span>
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

      <PdfExportSheet open={pdfOpen} onClose={() => setPdfOpen(false)} />
    </main>
  );
}

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
  { mode: 'light', label: 'Light', icon: Sun },
  { mode: 'dark', label: 'Dark', icon: Moon },
  { mode: 'system', label: 'System', icon: Monitor },
];

function ThemeToggle({ mode, onChange }: { mode: ThemeMode; onChange: (m: ThemeMode) => void }) {
  return (
    <div className="grid grid-cols-3 gap-1.5 bg-surface rounded-2xl p-1.5 border border-border/60">
      {THEME_OPTIONS.map(({ mode: m, label, icon: Icon }) => {
        const active = mode === m;
        return (
          <button
            key={m}
            onClick={() => onChange(m)}
            className={`flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-medium transition active:scale-[0.97] ${
              active ? 'bg-brand-gradient text-white shadow-soft' : 'text-muted'
            }`}
          >
            <Icon size={20} />
            {label}
          </button>
        );
      })}
    </div>
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
