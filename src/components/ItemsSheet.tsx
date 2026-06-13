import { useState, useRef, useEffect } from 'react';
import { X, Minus, Plus } from 'lucide-react';
import { formatINR } from '@/utils/format';
import BaseSheet from './BaseSheet';
import type { ExpenseItem } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  items: ExpenseItem[];
  onChange: (items: ExpenseItem[]) => void;
}

function QtyStepper({
  value,
  onChange,
  size = 'md',
}: {
  value: number;
  onChange: (n: number) => void;
  size?: 'md' | 'sm';
}) {
  const pad = size === 'md' ? 'p-3' : 'p-2.5';
  const numW = size === 'md' ? 'w-10' : 'w-8';
  const icon = size === 'md' ? 14 : 13;
  return (
    <div className="flex items-center border border-border rounded-xl overflow-hidden shrink-0">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={value <= 1}
        className={`${pad} text-muted active:bg-surface2 transition disabled:opacity-30`}
        aria-label="Decrease quantity"
      >
        <Minus size={icon} />
      </button>
      <span className={`${numW} text-center text-sm tabular-nums font-medium select-none`}>
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        className={`${pad} text-muted active:bg-surface2 transition`}
        aria-label="Increase quantity"
      >
        <Plus size={icon} />
      </button>
    </div>
  );
}

export default function ItemsSheet({ open, onClose, items, onChange }: Props) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [qty, setQty] = useState(1);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => nameRef.current?.focus(), 150);
    } else {
      setName('');
      setPrice('');
      setQty(1);
    }
  }, [open]);

  const canAdd = name.trim().length > 0 && parseFloat(price) > 0;

  function addItem() {
    if (!canAdd) return;
    const entry: ExpenseItem = {
      id: crypto.randomUUID(),
      name: name.trim(),
      price: parseFloat(price),
      qty,
    };
    onChange([...items, entry]);
    setName('');
    setPrice('');
    setQty(1);
    nameRef.current?.focus();
  }

  const updateItem = (id: string, patch: Partial<ExpenseItem>) =>
    onChange(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  function removeItem(id: string) {
    onChange(items.filter((i) => i.id !== id));
  }

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const totalQty = items.reduce((s, i) => s + i.qty, 0);

  return (
    <BaseSheet open={open} onClose={onClose} side="bottom" className="max-h-[90dvh]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
        <h2 className="text-base font-semibold">
          Items
          {items.length > 0 && (
            <span className="text-muted font-normal"> · {items.length}</span>
          )}
        </h2>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-muted active:scale-90 transition"
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </div>

      {/* Quick-entry card */}
      <div className="px-4 pt-4 pb-3 shrink-0">
        <div className="bg-surface border border-border rounded-2xl p-3 space-y-3">
          {/* Name */}
          <input
            ref={nameRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Item name"
            className="w-full bg-transparent text-sm font-medium focus:outline-none placeholder:text-muted/70 placeholder:font-normal"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } }}
          />

          {/* Divider */}
          <div className="h-px bg-border/60" />

          {/* Price · Qty · Add */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 flex-1 max-w-[7rem]">
              <span className="text-muted text-sm shrink-0">₹</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                className="flex-1 bg-transparent text-sm tabular-nums focus:outline-none min-w-0"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } }}
              />
            </div>

            <QtyStepper value={qty} onChange={setQty} size="md" />

            <button
              type="button"
              onClick={addItem}
              disabled={!canAdd}
              className="ml-auto px-5 py-3 bg-primary text-white text-sm font-semibold rounded-xl active:scale-[0.97] transition disabled:opacity-40"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto px-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 opacity-60">
            <span className="text-3xl">🧾</span>
            <p className="text-center text-muted text-sm">
              No items yet — add your first above
            </p>
          </div>
        ) : (
          <ul className="space-y-2 pb-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="bg-surface border border-border rounded-xl px-3 py-2.5"
              >
                {/* Line 1: name + delete */}
                <div className="flex items-center gap-2">
                  <span className="flex-1 text-sm font-medium truncate">{item.name}</span>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-2 -m-1 text-muted hover:text-red-400 active:scale-90 transition shrink-0"
                    aria-label={`Remove ${item.name}`}
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Line 2: unit price · stepper · subtotal */}
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs text-muted shrink-0">
                    {formatINR(item.price)} each
                  </span>
                  <div className="ml-auto flex items-center gap-3">
                    <QtyStepper
                      value={item.qty}
                      onChange={(n) => updateItem(item.id, { qty: n })}
                      size="sm"
                    />
                    <span className="text-sm tabular-nums font-semibold min-w-[4.5rem] text-right">
                      {formatINR(item.price * item.qty)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] border-t border-border shrink-0 space-y-3">
        {items.length > 0 && (
          <div className="flex items-center justify-between text-xs text-muted">
            <span>{items.length} item{items.length !== 1 ? 's' : ''} · {totalQty} qty</span>
            <div className="flex items-center gap-2">
              <span className="uppercase tracking-wider">Total</span>
              <span className="text-sm font-semibold text-primary tabular-nums">{formatINR(total)}</span>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3.5 bg-primary text-white font-semibold rounded-2xl active:scale-[0.98] transition"
        >
          Done
        </button>
      </div>
    </BaseSheet>
  );
}
