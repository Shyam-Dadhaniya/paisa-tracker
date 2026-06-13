import { describe, it, expect } from 'vitest';
import { categorizeFromSms, SMS_CATEGORY_PATTERNS } from '@/constants/smsPatterns';
import { parseSmsRegex } from '@/services/smsRegex';

describe('SMS category patterns', () => {
  it('categorizes Zomato as food', () => {
    expect(categorizeFromSms('debited for Zomato order')).toBe('food');
  });
  it('categorizes Swiggy as food', () => {
    expect(categorizeFromSms('Rs.350 paid to Swiggy')).toBe('food');
  });
  it('categorizes Uber as transport', () => {
    expect(categorizeFromSms('Your Uber ride was charged Rs.180')).toBe('transport');
  });
  it('categorizes Amazon as shopping', () => {
    expect(categorizeFromSms('Order from Amazon Rs.1200 debited')).toBe('shopping');
  });
  it('categorizes Airtel as bills', () => {
    expect(categorizeFromSms('Airtel recharge Rs.199')).toBe('bills');
  });
  it('categorizes Apollo as health', () => {
    expect(categorizeFromSms('Apollo pharmacy Rs.350 paid')).toBe('health');
  });
  it('categorizes BookMyShow as entertainment', () => {
    expect(categorizeFromSms('BookMyShow ticket Rs.400')).toBe('entertainment');
  });
  it('returns other for unknown merchant', () => {
    expect(categorizeFromSms('Payment of Rs.500 to John Doe')).toBe('other');
  });
  it('does not match PowerBank as bills', () => {
    expect(categorizeFromSms('Rs.500 paid at PowerBank store')).toBe('other');
  });
  it('all patterns are valid RegExp', () => {
    for (const pattern of Object.values(SMS_CATEGORY_PATTERNS)) {
      expect(pattern).toBeInstanceOf(RegExp);
    }
  });
});

describe('parseSmsRegex', () => {
  it('extracts amount from "Rs." format', () => {
    const result = parseSmsRegex('Rs.500 debited from your account at Zomato');
    expect(result).not.toBeNull();
    expect(result!.amount).toBe(500);
  });
  it('extracts amount from INR format', () => {
    const result = parseSmsRegex('INR 1,234.56 debited for Amazon purchase');
    expect(result).not.toBeNull();
    expect(result!.amount).toBeCloseTo(1234.56);
  });
  it('extracts amount from ₹ format', () => {
    const result = parseSmsRegex('₹350 paid to Swiggy');
    expect(result).not.toBeNull();
    expect(result!.amount).toBe(350);
  });
  it('extracts merchant from "at TITLE"', () => {
    const result = parseSmsRegex('Rs.200 debited at Starbucks on 10 Jun');
    expect(result).not.toBeNull();
    expect(result!.title).toBe('Starbucks');
  });
  it('returns null for credit/refund messages', () => {
    const result = parseSmsRegex('Rs.500 credited to your account as cashback');
    expect(result).toBeNull();
  });
  it('returns null when no amount found', () => {
    const result = parseSmsRegex('Your OTP is 123456');
    expect(result).toBeNull();
  });
  it('returns low confidence when title is Unknown', () => {
    const result = parseSmsRegex('Rs.100 debited from account');
    if (result) {
      expect(result.confidence).toBe(0.4);
    }
  });
  it('returns higher confidence with known merchant', () => {
    const result = parseSmsRegex('Rs.250 debited at Uber');
    expect(result).not.toBeNull();
    expect(result!.confidence).toBe(0.65);
  });
  it('correctly categorizes known merchants', () => {
    const result = parseSmsRegex('Rs.300 paid at Swiggy');
    expect(result!.category).toBe('food');
  });
});
