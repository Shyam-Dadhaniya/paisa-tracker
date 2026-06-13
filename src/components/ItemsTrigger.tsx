import { Plus, Pencil } from 'lucide-react';
import { formatINR } from '@/utils/format';
import type { ExpenseItem } from '@/types';

interface Props {
  items: ExpenseItem[];
  onOpen: () => void;
}

export default function ItemsTrigger({ items, onOpen }: Props) {
  const hasItems = items.length > 0;

  if (!hasItems) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="w-full flex items-center gap-3 bg-surface border border-dashed border-border rounded-xl px-4 py-3.5 text-left active:scale-[0.98] transition"
      >
        <span className="text-lg">🧾</span>
        <div className="flex-1">
          <p className="text-sm text-muted font-medium">Add items</p>
          <p className="text-[11px] text-muted/60 mt-0.5">Optional · break down what you bought</p>
        </div>
        <Plus size={16} className="text-muted shrink-0" />
      </button>
    );
  }

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const totalQty = items.reduce((s, i) => s + i.qty, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs text-muted uppercase tracking-wider">Items</label>
        <button
          type="button"
          onClick={onOpen}
          className="flex items-center gap-1 text-xs text-primary font-medium active:scale-95 transition"
        >
          <Pencil size={13} />
          Edit
        </button>
      </div>

      {/* List card */}
      <div className="rounded-2xl border border-border overflow-hidden">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 px-3 py-2.5 bg-surface border-b border-border/50"
          >
            <span className="flex-1 truncate text-sm">{item.name}</span>
            <span className="text-xs text-muted shrink-0">×{item.qty}</span>
            <span className="text-sm font-semibold tabular-nums shrink-0 min-w-[4rem] text-right">
              {formatINR(item.price * item.qty)}
            </span>
          </div>
        ))}

        {/* Summary footer */}
        <div className="flex items-center justify-between px-3 py-2.5 bg-surface2">
          <span className="text-[10px] text-muted uppercase tracking-wider">
            {items.length} item{items.length !== 1 ? 's' : ''} · {totalQty} qty
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted uppercase tracking-wider">Total</span>
            <span className="text-sm font-semibold text-primary tabular-nums">
              {formatINR(total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
