import { useCategoryStore } from '@/store/categoryStore';
import { PAYMENT_MODE_META } from '@/utils/paymentSources';
import BaseSheet from './BaseSheet';
import SheetHeader from './SheetHeader';
import type { CategoryId, PaymentMode } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  selected: CategoryId[];
  onToggle: (id: CategoryId) => void;
  onClear: () => void;
  paymentFilter?: PaymentMode[];
  onPaymentToggle?: (mode: PaymentMode) => void;
  onPaymentClear?: () => void;
}

export default function CategoryFilterSheet({
  open, onClose, selected, onToggle, onClear,
  paymentFilter = [], onPaymentToggle, onPaymentClear,
}: Props) {
  const categories = useCategoryStore((s) => s.categories);

  return (
    <BaseSheet open={open} onClose={onClose} side="right">
      <SheetHeader title="Filters" onClose={onClose} />

      <div className="overflow-y-auto flex-1 py-2">
        {categories.map((c) => {
          const active = selected.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onToggle(c.id)}
              className={`w-full flex items-center gap-3 px-5 py-3 transition active:scale-[0.98] ${
                active ? 'bg-primary/10' : 'hover:bg-surface2'
              }`}
            >
              <span className="text-xl leading-none w-7 text-center">{c.icon}</span>
              <span className={`flex-1 text-sm font-medium text-left ${active ? 'text-primary' : ''}`}>
                {c.label}
              </span>
              <span
                className="w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition"
                style={active ? { backgroundColor: c.color, borderColor: c.color } : { borderColor: 'var(--color-border)' }}
              >
                {active && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {onPaymentToggle && (
        <>
          <div className="px-5 pt-3 pb-1">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Payment Mode</p>
          </div>
          {(['cash', 'online', 'credit_card'] as PaymentMode[]).map((mode) => {
            const meta = PAYMENT_MODE_META[mode];
            const active = paymentFilter.includes(mode);
            return (
              <button
                key={mode}
                type="button"
                onClick={() => onPaymentToggle(mode)}
                className={`w-full flex items-center gap-3 px-5 py-3 transition active:scale-[0.98] ${
                  active ? 'bg-primary/10' : 'hover:bg-surface2'
                }`}
              >
                <span className="text-xl leading-none w-7 text-center">{meta.icon}</span>
                <span className={`flex-1 text-sm font-medium text-left ${active ? 'text-primary' : ''}`}>
                  {meta.label}
                </span>
                <span
                  className="w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition"
                  style={active ? { backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)' } : { borderColor: 'var(--color-border)' }}
                >
                  {active && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
              </button>
            );
          })}
        </>
      )}

      <div className="px-5 py-4 border-t border-border shrink-0">
        {(selected.length > 0 || paymentFilter.length > 0) ? (
          <button
            type="button"
            onClick={() => { onClear(); onPaymentClear?.(); }}
            className="w-full py-2.5 rounded-xl border border-danger text-danger text-sm font-medium active:scale-[0.98] transition"
          >
            Clear all filters ({selected.length + paymentFilter.length})
          </button>
        ) : (
          <p className="text-center text-xs text-muted">No filters applied</p>
        )}
      </div>
    </BaseSheet>
  );
}
