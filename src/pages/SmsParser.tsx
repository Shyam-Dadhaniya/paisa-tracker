import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Clipboard, ChevronLeft } from 'lucide-react';
import { parseSms } from '@/services/aiParser';
import type { ParsedSms } from '@/services/smsRegex';
import { useReadClipboard, looksLikeSms } from '@/hooks/useClipboard';
import { useExpenseStore } from '@/store/expenseStore';
import { useCategoryStore } from '@/store/categoryStore';
import { formatINR, todayISO } from '@/utils/format';

export default function SmsParser() {
  const navigate = useNavigate();
  const readClipboard = useReadClipboard();
  const addExpense = useExpenseStore((s) => s.addExpense);
  const categories = useCategoryStore((s) => s.categories);

  const [sms, setSms] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState<ParsedSms | null>(null);
  const [source, setSource] = useState<'ai' | 'regex' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const text = await readClipboard();
      if (text && looksLikeSms(text)) {
        setSms(text);
        runParse(text);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runParse = async (text: string) => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setParsed(null);
    const res = await parseSms(text);
    setLoading(false);
    if (res.ok) {
      setParsed(res.data);
      setSource(res.source);
    } else {
      setError(res.error);
    }
  };

  const handlePasteClipboard = async () => {
    const text = await readClipboard();
    if (!text) {
      setError('Clipboard is empty or permission denied. Paste manually below.');
      return;
    }
    setSms(text);
    runParse(text);
  };

  const handleSave = async () => {
    if (!parsed) return;
    await addExpense({
      amount: parsed.amount,
      title: parsed.title,
      category: parsed.category,
      date: todayISO(),
      note: parsed.note || undefined,
      source: 'sms',
      smsRaw: sms,
    });
    navigate('/');
  };

  return (
    <main className="safe-top safe-bottom max-w-md mx-auto px-4">
      <header className="flex items-center gap-2 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-muted active:scale-95"
          aria-label="Back"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Scan SMS</h1>
          <p className="text-xs text-muted">Paste a bank SMS — AI extracts it</p>
        </div>
      </header>

      <button
        onClick={handlePasteClipboard}
        className="w-full flex items-center justify-center gap-2 bg-surface border border-border rounded-2xl py-3 mb-3 active:scale-[0.98] transition"
      >
        <Clipboard size={18} />
        <span className="font-medium">Paste from clipboard</span>
      </button>

      <textarea
        value={sms}
        onChange={(e) => setSms(e.target.value)}
        placeholder="Or paste SMS text here…"
        rows={5}
        className="w-full bg-surface border border-border rounded-2xl p-3 text-sm focus:outline-none focus:border-primary resize-none"
      />

      <button
        onClick={() => runParse(sms)}
        disabled={!sms.trim() || loading}
        className="w-full flex items-center justify-center gap-2 bg-brand-gradient text-white font-semibold py-3 rounded-2xl mt-3 shadow-soft active:scale-[0.98] transition disabled:opacity-50"
      >
        <Sparkles size={18} />
        {loading ? 'Parsing…' : 'Parse with AI'}
      </button>

      {error && (
        <div className="mt-4 bg-danger/10 border border-danger/30 text-danger rounded-xl p-3 text-sm">
          {error}
        </div>
      )}

      {parsed && (
        <section className="mt-5 bg-surface rounded-2xl p-4 border border-border space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold">Detected</h2>
            <span className="text-[10px] uppercase tracking-wider text-muted">
              via {source === 'ai' ? 'Claude' : 'regex fallback'}
            </span>
          </div>

          <Field label="Amount">
            <input
              type="number"
              step="0.01"
              value={parsed.amount}
              onChange={(e) =>
                setParsed({ ...parsed, amount: parseFloat(e.target.value) || 0 })
              }
              onFocus={(e) => e.target.select()}
              className="bg-transparent text-right font-bold tabular-nums w-32 focus:outline-none"
            />
          </Field>

          <Field label="Title">
            <input
              value={parsed.title}
              onChange={(e) => setParsed({ ...parsed, title: e.target.value })}
              className="bg-transparent text-right w-full focus:outline-none"
            />
          </Field>

          <div>
            <p className="text-xs text-muted uppercase tracking-wider mb-2">Category</p>
            <div className="grid grid-cols-4 gap-2">
              {categories.map((c) => {
                const active = parsed.category === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setParsed({ ...parsed, category: c.id })}
                    className={`flex flex-col items-center gap-1 py-2 rounded-lg border text-[10px] transition ${
                      active
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-surface2'
                    }`}
                  >
                    <span className="text-lg">{c.icon}</span>
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-xs text-muted">
            Preview: <span className="text-text font-medium">{formatINR(parsed.amount)}</span> at{' '}
            <span className="text-text font-medium">{parsed.title}</span>
          </p>

          <button
            onClick={handleSave}
            className="w-full bg-brand-gradient text-white font-semibold py-3 rounded-xl shadow-soft active:scale-[0.98]"
          >
            Save expense
          </button>
        </section>
      )}
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-2">
      <span className="text-xs text-muted uppercase tracking-wider">{label}</span>
      {children}
    </div>
  );
}
