import type { CategoryId } from '@/types';

export interface ParsedSms {
  amount: number;
  title: string;
  category: CategoryId;
  note: string;
  confidence: number;
}

const FOOD = /(zomato|swiggy|dominos|mcd|kfc|starbucks|cafe|restaurant|bigbasket|blinkit|zepto|instamart)/i;
const TRANSPORT = /(uber|ola|rapido|metro|irctc|fuel|petrol|hp|iocl|bpcl|shell)/i;
const SHOPPING = /(amazon|flipkart|myntra|ajio|nykaa|meesho|tatacliq|croma|reliance digital)/i;
const BILLS = /(electricity|bescom|tata power|adani|airtel|jio|vodafone|vi |broadband|rent|recharge|netflix|hotstar|prime|spotify|gym)/i;
const HEALTH = /(pharmacy|apollo|medplus|netmeds|hospital|clinic|1mg|pharmeasy)/i;
const ENTERTAINMENT = /(bookmyshow|pvr|inox|playstation|steam|youtube premium|disney)/i;

function categorize(text: string): CategoryId {
  if (FOOD.test(text)) return 'food';
  if (TRANSPORT.test(text)) return 'transport';
  if (SHOPPING.test(text)) return 'shopping';
  if (BILLS.test(text)) return 'bills';
  if (HEALTH.test(text)) return 'health';
  if (ENTERTAINMENT.test(text)) return 'entertainment';
  return 'other';
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
    category: categorize(text),
    note: '',
    confidence: title === 'Unknown' ? 0.4 : 0.65,
  };
}
