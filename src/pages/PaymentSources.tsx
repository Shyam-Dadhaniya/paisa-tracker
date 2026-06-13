import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, X } from 'lucide-react';
import { usePaymentSourceStore } from '@/store/paymentSourceStore';
import PaymentSourceForm from '@/components/PaymentSourceForm';
import type { PaymentSource } from '@/types';

type FormType = 'bank' | 'credit_card';

export default function PaymentSources() {
  const navigate = useNavigate();
  const { paymentSources, addPaymentSource, deletePaymentSource } = usePaymentSourceStore();

  const banks = paymentSources.filter((s) => s.type === 'bank');
  const cards = paymentSources.filter((s) => s.type === 'credit_card');

  const [openForm, setOpenForm] = useState<FormType | null>(null);

  const handleDelete = async (s: PaymentSource) => {
    const result = await deletePaymentSource(s.id);
    if (result.linkedCount > 0) {
      alert(
        `"${s.name}" is used by ${result.linkedCount} expense${result.linkedCount !== 1 ? 's' : ''}. ` +
          'Remove those expenses first, or the link will remain.',
      );
    }
  };

  const handleSave = (type: FormType) => async (data: { name: string; bankName?: string }) => {
    await addPaymentSource({ type, ...data });
    setOpenForm(null);
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
                  onClick={() => handleDelete(s)}
                  className="p-1.5 text-muted hover:text-danger transition active:scale-95"
                  aria-label={`Delete ${s.name}`}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {openForm === 'bank' ? (
          <PaymentSourceForm type="bank" onSave={handleSave('bank')} onCancel={() => setOpenForm(null)} />
        ) : (
          <button
            onClick={() => setOpenForm('bank')}
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
                  {s.bankName && <p className="text-xs text-muted">{s.bankName}</p>}
                </div>
                <button
                  onClick={() => handleDelete(s)}
                  className="p-1.5 text-muted hover:text-danger transition active:scale-95"
                  aria-label={`Delete ${s.name}`}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {openForm === 'credit_card' ? (
          <PaymentSourceForm
            type="credit_card"
            onSave={handleSave('credit_card')}
            onCancel={() => setOpenForm(null)}
          />
        ) : (
          <button
            onClick={() => setOpenForm('credit_card')}
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
