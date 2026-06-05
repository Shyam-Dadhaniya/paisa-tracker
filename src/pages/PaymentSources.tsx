import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, X } from 'lucide-react';
import { usePaymentSourceStore } from '@/store/paymentSourceStore';
import { POPULAR_BANKS } from '@/utils/paymentSources';

export default function PaymentSources() {
  const navigate = useNavigate();
  const { paymentSources, addPaymentSource, deletePaymentSource } = usePaymentSourceStore();

  const banks = paymentSources.filter((s) => s.type === 'bank');
  const cards = paymentSources.filter((s) => s.type === 'credit_card');

  const [showBankForm, setShowBankForm] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [bankName, setBankName] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardBank, setCardBank] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAddBank = async () => {
    const name = bankName.trim();
    if (!name) return;
    setSaving(true);
    await addPaymentSource({ type: 'bank', name });
    setBankName('');
    setShowBankForm(false);
    setSaving(false);
  };

  const handleAddCard = async () => {
    const name = cardName.trim();
    if (!name) return;
    setSaving(true);
    await addPaymentSource({ type: 'credit_card', name, bankName: cardBank.trim() || undefined });
    setCardName('');
    setCardBank('');
    setShowCardForm(false);
    setSaving(false);
  };

  return (
    <main className="safe-top safe-bottom max-w-md mx-auto px-4 pb-8">
      <header className="flex items-center gap-2 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-muted active:scale-95"
          aria-label="Back"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Payment Sources</h1>
      </header>

      {/* ── Banks / UPI ── */}
      <section className="mb-6">
        <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 px-1">
          Banks / UPI
        </h2>

        {banks.length > 0 && (
          <div className="bg-surface rounded-2xl border border-border/60 divide-y divide-border/40 mb-3">
            {banks.map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                <span className="text-xl">🏦</span>
                <span className="flex-1 font-medium">{s.name}</span>
                <button
                  onClick={() => deletePaymentSource(s.id)}
                  className="p-1.5 text-muted hover:text-danger transition active:scale-95"
                  aria-label={`Delete ${s.name}`}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {showBankForm ? (
          <div className="bg-surface rounded-2xl border border-border/60 p-4 space-y-3">
            <input
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="Bank name (e.g. HDFC)"
              autoFocus
              className="w-full bg-surface2 border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:border-primary text-sm"
            />
            {/* Popular bank chips */}
            <div className="flex flex-wrap gap-2">
              {POPULAR_BANKS.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBankName(b)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition active:scale-95 ${
                    bankName === b
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'bg-surface2 border-border text-muted'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowBankForm(false); setBankName(''); }}
                className="flex-1 py-2.5 rounded-xl border border-border text-muted text-sm active:scale-95 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddBank}
                disabled={saving || !bankName.trim()}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-50 active:scale-95 transition"
              >
                {saving ? 'Adding…' : 'Add Bank'}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowBankForm(true)}
            className="w-full flex items-center gap-2 bg-surface rounded-2xl px-4 py-3.5 border border-border/60 text-primary active:scale-[0.99] transition"
          >
            <Plus size={18} />
            <span className="font-medium">Add Bank / UPI</span>
          </button>
        )}
      </section>

      {/* ── Credit Cards ── */}
      <section>
        <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 px-1">
          Credit Cards
        </h2>

        {cards.length > 0 && (
          <div className="bg-surface rounded-2xl border border-border/60 divide-y divide-border/40 mb-3">
            {cards.map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                <span className="text-xl">💳</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{s.name}</p>
                  {s.bankName && (
                    <p className="text-xs text-muted">{s.bankName}</p>
                  )}
                </div>
                <button
                  onClick={() => deletePaymentSource(s.id)}
                  className="p-1.5 text-muted hover:text-danger transition active:scale-95"
                  aria-label={`Delete ${s.name}`}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {showCardForm ? (
          <div className="bg-surface rounded-2xl border border-border/60 p-4 space-y-3">
            <input
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              placeholder="Card name (e.g. HDFC Regalia)"
              autoFocus
              className="w-full bg-surface2 border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:border-primary text-sm"
            />
            <div>
              <input
                value={cardBank}
                onChange={(e) => setCardBank(e.target.value)}
                placeholder="Bank (e.g. HDFC) — optional"
                className="w-full bg-surface2 border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:border-primary text-sm"
              />
              {/* Popular bank chips for card bank */}
              <div className="flex flex-wrap gap-2 mt-2">
                {POPULAR_BANKS.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setCardBank(b)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition active:scale-95 ${
                      cardBank === b
                        ? 'bg-primary/20 border-primary text-primary'
                        : 'bg-surface2 border-border text-muted'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowCardForm(false); setCardName(''); setCardBank(''); }}
                className="flex-1 py-2.5 rounded-xl border border-border text-muted text-sm active:scale-95 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCard}
                disabled={saving || !cardName.trim()}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-50 active:scale-95 transition"
              >
                {saving ? 'Adding…' : 'Add Card'}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCardForm(true)}
            className="w-full flex items-center gap-2 bg-surface rounded-2xl px-4 py-3.5 border border-border/60 text-primary active:scale-[0.99] transition"
          >
            <Plus size={18} />
            <span className="font-medium">Add Credit Card</span>
          </button>
        )}
      </section>
    </main>
  );
}
