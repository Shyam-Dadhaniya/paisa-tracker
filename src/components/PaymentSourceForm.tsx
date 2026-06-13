import { useState } from 'react';
import { POPULAR_BANKS } from '@/utils/paymentSources';
import ChipButton from './ChipButton';

interface Props {
  type: 'bank' | 'credit_card';
  onSave: (data: { name: string; bankName?: string }) => Promise<void>;
  onCancel: () => void;
}

/**
 * Inline add-form for a bank/UPI account or credit card. Banks capture just a
 * name (with popular-bank shortcuts); cards additionally capture an issuing bank.
 */
export default function PaymentSourceForm({ type, onSave, onCancel }: Props) {
  const isBank = type === 'bank';
  const [name, setName] = useState('');
  const [bank, setBank] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    await onSave({ name: trimmed, bankName: isBank ? undefined : bank.trim() || undefined });
    setSaving(false);
  };

  return (
    <div className="bg-surface rounded-2xl border border-border/60 p-4 space-y-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={isBank ? 'Bank name (e.g. HDFC)' : 'Card name (e.g. HDFC Regalia)'}
        autoFocus
        className="w-full bg-surface2 border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:border-primary text-sm"
      />

      {isBank ? (
        <div className="flex flex-wrap gap-2">
          {POPULAR_BANKS.map((b) => (
            <ChipButton key={b} active={name === b} onClick={() => setName(b)}>
              {b}
            </ChipButton>
          ))}
        </div>
      ) : (
        <div>
          <input
            value={bank}
            onChange={(e) => setBank(e.target.value)}
            placeholder="Bank (e.g. HDFC) — optional"
            className="w-full bg-surface2 border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:border-primary text-sm"
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {POPULAR_BANKS.map((b) => (
              <ChipButton key={b} active={bank === b} onClick={() => setBank(b)}>
                {b}
              </ChipButton>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl border border-border text-muted text-sm active:scale-95 transition"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-50 active:scale-95 transition"
        >
          {saving ? 'Adding…' : isBank ? 'Add Bank' : 'Add Card'}
        </button>
      </div>
    </div>
  );
}
