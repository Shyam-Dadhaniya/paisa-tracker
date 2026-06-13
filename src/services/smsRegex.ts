import type { CategoryId } from '@/types';
import { categorizeFromSms } from '@/constants/smsPatterns';

export interface ParsedSms {
  amount: number;
  title: string;
  category: CategoryId;
  note: string;
  confidence: number;
}

export function parseSmsRegex(sms: string): ParsedSms | null {
  const text = sms.replace(/\s+/g, ' ').trim();
  if (!text) return null;

  // Amount: "Rs. 1,234.56", "INR 250", "₹500"
  const amountMatch = text.match(/(?:rs\.?|inr|₹)\s*([0-9,]+(?:\.\d{1,2})?)/i);
  if (!amountMatch) return null;
  const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
  if (!isFinite(amount) || amount <= 0) return null;

  // Skip clear non-debits
  if (/\b(credited|refund|cashback|otp)\b/i.test(text) && !/\b(debited|spent|paid|purchase)\b/i.test(text)) {
    return null;
  }

  // Title: try "at TITLE" or "to TITLE" or "@ TITLE" or "UPI/...-TITLE"
  let title = 'Unknown';
  const at = text.match(/\b(?:at|to|@|via|towards)\s+([A-Z0-9][A-Za-z0-9 .&'\-]{1,40})/);
  if (at) title = at[1].trim();
  else {
    const upi = text.match(/(?:UPI|VPA)[\/\s:]+([A-Za-z0-9.\-_@]{2,40})/i);
    if (upi) title = upi[1].split('@')[0];
  }
  title = title.replace(/\b(on|ref|dt|info|avl|bal|a\/c).*$/i, '').trim().slice(0, 40) || 'Unknown';

  return {
    amount,
    title,
    category: categorizeFromSms(text),
    note: '',
    confidence: title === 'Unknown' ? 0.4 : 0.65,
  };
}
