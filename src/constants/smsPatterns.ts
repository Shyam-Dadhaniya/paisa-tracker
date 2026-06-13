import type { CategoryId } from '@/types';

export const SMS_CATEGORY_PATTERNS: Record<string, RegExp> = {
  food: /(zomato|swiggy|dominos|mcd|kfc|starbucks|cafe|restaurant|bigbasket|blinkit|zepto|instamart)/i,
  transport: /(uber|ola|rapido|metro|irctc|fuel|petrol|hp|iocl|bpcl|shell)/i,
  shopping: /(amazon|flipkart|myntra|ajio|nykaa|meesho|tatacliq|croma|reliance digital)/i,
  bills: /(electricity|bescom|tata power|adani|airtel|jio|vodafone|vi |broadband|rent|recharge|netflix|hotstar|prime|spotify|gym)/i,
  health: /(pharmacy|apollo|medplus|netmeds|hospital|clinic|1mg|pharmeasy)/i,
  entertainment: /(bookmyshow|pvr|inox|playstation|steam|youtube premium|disney)/i,
};

export const SMS_CATEGORY_LIST = ['food', 'transport', 'shopping', 'bills', 'entertainment', 'health', 'other'] as const;

export function categorizeFromSms(text: string): CategoryId {
  for (const [cat, pattern] of Object.entries(SMS_CATEGORY_PATTERNS)) {
    if (pattern.test(text)) return cat as CategoryId;
  }
  return 'other';
}
