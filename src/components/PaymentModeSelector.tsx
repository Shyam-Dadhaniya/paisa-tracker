import { ChevronDown } from 'lucide-react';
import { PAYMENT_MODE_META, resolveSourceLabel } from '@/utils/paymentSources';
import PaymentSourcePickerSheet from './PaymentSourcePickerSheet';
import type { PaymentMode, PaymentSource } from '@/types';

interface Props {
  selectedMode: PaymentMode | null;
  selectedSourceId: string | undefined;
  paymentSources: PaymentSource[];
  sourcePickerOpen: boolean;
  onModeSelect: (mode: PaymentMode) => void;
  onSourcePickerOpen: () => void;
  onSourcePickerClose: () => void;
  onSourceSelect: (source: PaymentSource) => void;
}

export default function PaymentModeSelector({
  selectedMode,
  selectedSourceId,
  paymentSources,
  sourcePickerOpen,
  onModeSelect,
  onSourcePickerOpen,
  onSourcePickerClose,
  onSourceSelect,
}: Props) {
  return (
    <div>
      <label className="text-xs text-muted uppercase tracking-wider mb-2 block">Payment Mode</label>
      <div className="flex gap-2">
        {(['cash', 'online', 'credit_card'] as PaymentMode[]).map((mode) => {
          const meta = PAYMENT_MODE_META[mode];
          const active = selectedMode === mode;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => onModeSelect(mode)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-medium transition active:scale-95 ${
                active
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'bg-surface border-border text-muted'
              }`}
            >
              <span className="text-base">{meta.icon}</span>
              <span className="leading-tight text-center">{meta.label}</span>
            </button>
          );
        })}
      </div>
      {(selectedMode === 'online' || selectedMode === 'credit_card') && (
        <button
          type="button"
          onClick={onSourcePickerOpen}
          className="mt-2 w-full flex items-center gap-3 bg-surface border border-border rounded-xl px-4 py-3 text-left active:scale-[0.98] transition"
        >
          <span className="text-lg">{selectedMode === 'online' ? '🏦' : '💳'}</span>
          <span className={`flex-1 text-sm ${selectedSourceId ? '' : 'text-muted'}`}>
            {selectedSourceId
              ? resolveSourceLabel(selectedSourceId, paymentSources)
              : selectedMode === 'online'
              ? 'Select Bank'
              : 'Select Card'}
          </span>
          <ChevronDown size={16} className="text-muted" />
        </button>
      )}
      <PaymentSourcePickerSheet
        open={sourcePickerOpen}
        onClose={onSourcePickerClose}
        type={selectedMode === 'online' ? 'bank' : 'credit_card'}
        selectedId={selectedSourceId}
        onSelect={onSourceSelect}
      />
    </div>
  );
}
