import { X, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePaymentSourceStore } from '@/store/paymentSourceStore';
import BaseSheet from './BaseSheet';
import type { PaymentSource } from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
  type: 'bank' | 'credit_card';
  selectedId?: string;
  onSelect: (source: PaymentSource) => void;
}

export default function PaymentSourcePickerSheet({ open, onClose, type, selectedId, onSelect }: Props) {
  const navigate = useNavigate();
  const paymentSources = usePaymentSourceStore((s) => s.paymentSources);
  const sources = paymentSources.filter((s) => s.type === type);
  const title = type === 'bank' ? 'Select Bank' : 'Select Card';

  return (
    <BaseSheet open={open} onClose={onClose} side="bottom" className="max-h-[70dvh]">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
        <h2 className="text-base font-semibold">{title}</h2>
        <button onClick={onClose} className="p-1.5 rounded-lg text-muted active:scale-90 transition">
          <X size={20} />
        </button>
      </div>

      <div className="overflow-y-auto flex-1 py-2">
        {sources.length === 0 ? (
          <div className="px-5 py-10 flex flex-col items-center gap-4">
            <p className="text-2xl">{type === 'bank' ? '🏦' : '💳'}</p>
            <div className="text-center">
              <p className="font-medium text-sm">No {type === 'bank' ? 'banks' : 'cards'} added yet</p>
              <p className="text-xs text-muted mt-1">
                Add your {type === 'bank' ? 'bank / UPI account' : 'credit card'} first
              </p>
            </div>
            <button
              onClick={() => { onClose(); navigate('/payment-sources'); }}
              className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl active:scale-95 transition"
            >
              + Add {type === 'bank' ? 'Bank / UPI' : 'Credit Card'}
            </button>
          </div>
        ) : (
          sources.map((s) => {
            const active = s.id === selectedId;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => { onSelect(s); onClose(); }}
                className={`w-full flex items-center gap-3 px-5 py-3.5 transition active:scale-[0.98] ${
                  active ? 'bg-primary/10' : 'hover:bg-surface2'
                }`}
              >
                <span className="text-lg">{type === 'bank' ? '🏦' : '💳'}</span>
                <div className="flex-1 text-left">
                  <p className={`text-sm font-medium ${active ? 'text-primary' : ''}`}>{s.name}</p>
                  {s.bankName && <p className="text-xs text-muted">{s.bankName}</p>}
                </div>
                {active && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
              </button>
            );
          })
        )}
      </div>

      {sources.length > 0 && (
        <div className="px-5 py-3 border-t border-border shrink-0">
          <button
            type="button"
            onClick={() => { onClose(); navigate('/payment-sources'); }}
            className="flex items-center gap-1.5 text-xs text-muted"
          >
            <Settings size={13} />
            + Add / manage {type === 'bank' ? 'banks' : 'cards'}
          </button>
        </div>
      )}
    </BaseSheet>
  );
}
