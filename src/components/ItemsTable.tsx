import { useId } from 'react';
import { Plus, X } from 'lucide-react';
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

  const addItem = () => onChange([...items, newItem()]);
  const removeItem = (id: string) => onChange(items.filter((i) => i.id !== id));
  const updateItem = (id: string, patch: Partial<ExpenseItem>) =>
    onChange(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);

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
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_5rem_3.5rem_1.5rem] gap-2 px-3 py-2 bg-surface2 border-b border-border">
            <span className="text-[10px] text-muted uppercase tracking-wider">Name</span>
            <span className="text-[10px] text-muted uppercase tracking-wider text-right">Price (₹)</span>
            <span className="text-[10px] text-muted uppercase tracking-wider text-right">Qty</span>
            <span />
          </div>

          {/* Item rows */}
          {items.map((item) => (
            <div
              key={item.id}
              role="listitem"
              className="grid grid-cols-[1fr_5rem_3.5rem_1.5rem] gap-2 items-center bg-surface border-b border-border px-3 py-2.5"
            >
              <input
                value={item.name}
                onChange={(e) => updateItem(item.id, { name: e.target.value })}
                placeholder="Item name"
                className="bg-transparent text-sm focus:outline-none min-w-0"
              />
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
                className="bg-transparent text-sm tabular-nums text-right focus:outline-none w-full"
              />
              <input
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                value={item.qty}
                onChange={(e) =>
                  updateItem(item.id, { qty: Math.max(1, parseInt(e.target.value) || 1) })
                }
                className="bg-transparent text-sm tabular-nums text-right focus:outline-none w-full"
              />
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="text-muted hover:text-red-400 active:scale-90 transition flex items-center justify-center"
                aria-label={`Remove ${item.name || 'item'}`}
              >
                <X size={14} />
              </button>
            </div>
          ))}

          {/* Total row */}
          <div className="flex justify-between items-center px-3 py-2.5 bg-surface2">
            <span className="text-[10px] text-muted uppercase tracking-wider">Items total</span>
            <span className="text-sm font-semibold tabular-nums text-primary">
              {formatINR(total)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
