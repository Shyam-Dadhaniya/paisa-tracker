import { useId, useState } from 'react';
import { Plus, Minus, X } from 'lucide-react';
import type { ExpenseItem } from '@/types';
import { formatINR } from '@/utils/format';

interface Props {
  items: ExpenseItem[];
  onChange: (items: ExpenseItem[]) => void;
}

function newItem(): ExpenseItem {
  return { id: crypto.randomUUID(), name: '', price: 0, qty: 1 };
}

export default function ItemsTable({ items, onChange }: Props) {
  const labelId = useId();
  const [qtyInputs, setQtyInputs] = useState<Record<string, string>>({});

  const addItem = () => onChange([...items, newItem()]);

  const removeItem = (id: string) => {
    onChange(items.filter((i) => i.id !== id));
    setQtyInputs((prev) => { const n = { ...prev }; delete n[id]; return n; });
  };

  const updateItem = (id: string, patch: Partial<ExpenseItem>) =>
    onChange(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const clearQtyInput = (id: string) =>
    setQtyInputs((prev) => { const n = { ...prev }; delete n[id]; return n; });

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const totalQty = items.reduce((s, i) => s + i.qty, 0);

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-2">
        <label id={labelId} className="text-xs text-muted uppercase tracking-wider">
          Items (optional)
        </label>
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1 text-xs text-primary font-medium active:scale-95 transition"
        >
          <Plus size={14} />
          Add item
        </button>
      </div>

      {/* Single grouped card */}
      {items.length > 0 && (
        <div
          role="list"
          aria-labelledby={labelId}
          className="rounded-2xl border border-border overflow-hidden mb-2"
        >
          {items.map((item) => (
            <div
              key={item.id}
              role="listitem"
              className="bg-surface border-b border-border px-3 py-3 space-y-2"
            >
              {/* Row 1: Name + Remove */}
              <div className="flex items-center gap-2">
                <input
                  value={item.name}
                  onChange={(e) => updateItem(item.id, { name: e.target.value })}
                  placeholder="Item name"
                  className="flex-1 bg-transparent text-sm focus:outline-none min-w-0"
                />
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="text-muted hover:text-red-400 active:scale-90 transition shrink-0"
                  aria-label={`Remove ${item.name || 'item'}`}
                >
                  <X size={14} />
                </button>
              </div>

              {/* Row 2: Price + Qty stepper */}
              <div className="flex items-center gap-4">
                {/* Price */}
                <div className="flex items-center gap-1.5 flex-1">
                  <span className="text-xs text-muted shrink-0">₹</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    value={item.price || ''}
                    onChange={(e) =>
                      updateItem(item.id, { price: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="0"
                    className="flex-1 bg-transparent text-sm tabular-nums focus:outline-none min-w-0"
                  />
                </div>

                {/* Qty stepper */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted">Qty</span>
                  <div className="flex items-center border border-border rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => {
                        updateItem(item.id, { qty: Math.max(1, item.qty - 1) });
                        clearQtyInput(item.id);
                      }}
                      className="px-2 py-1.5 text-muted active:bg-surface2 transition"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={11} />
                    </button>
                    <input
                      type="number"
                      inputMode="numeric"
                      min="1"
                      step="1"
                      value={qtyInputs[item.id] ?? String(item.qty)}
                      onChange={(e) =>
                        setQtyInputs((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                      onBlur={() => {
                        const raw = qtyInputs[item.id];
                        if (raw !== undefined) {
                          updateItem(item.id, { qty: Math.max(1, parseInt(raw) || 1) });
                          clearQtyInput(item.id);
                        }
                      }}
                      className="w-8 text-center text-sm tabular-nums bg-transparent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        updateItem(item.id, { qty: item.qty + 1 });
                        clearQtyInput(item.id);
                      }}
                      className="px-2 py-1.5 text-muted active:bg-surface2 transition"
                      aria-label="Increase quantity"
                    >
                      <Plus size={11} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Total row */}
          <div className="flex items-center justify-between px-3 py-2.5 bg-surface2">
            <span className="text-[10px] text-muted uppercase tracking-wider">
              {items.length} item{items.length !== 1 ? 's' : ''} · {totalQty} qty
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted uppercase tracking-wider">Total</span>
              <span className="text-sm font-semibold tabular-nums text-primary">
                {formatINR(total)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
