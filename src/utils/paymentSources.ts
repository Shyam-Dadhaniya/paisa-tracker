import type { PaymentMode, PaymentSource } from '@/types';

export const POPULAR_BANKS = [
  'SBI', 'HDFC', 'ICICI', 'Axis', 'Kotak',
  'PNB', 'BOB', 'Canara', 'Yes Bank', 'IndusInd', 'IDFC First',
];

export const PAYMENT_MODE_META: Record<PaymentMode, { label: string; icon: string }> = {
  cash:        { label: 'Cash',         icon: '💵' },
  online:      { label: 'Online / UPI', icon: '🏦' },
  credit_card: { label: 'Credit Card',  icon: '💳' },
};

export function resolveSourceLabel(
  sourceId: string | undefined,
  sources: PaymentSource[],
): string {
  if (!sourceId) return '';
  const s = sources.find((x) => x.id === sourceId);
  if (!s) return '';
  return s.type === 'credit_card' && s.bankName ? `${s.name} (${s.bankName})` : s.name;
}
