import { format, parseISO } from 'date-fns';

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function formatDate(iso: string, fmt = 'd MMM yyyy'): string {
  try {
    return format(parseISO(iso), fmt);
  } catch {
    return iso;
  }
}

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7); // YYYY-MM
}

export function currentTimeHHMM(): string {
  return format(new Date(), 'HH:mm');
}

export function formatTime(time: string): string {
  try {
    return format(parseISO(`1970-01-01T${time}`), 'h:mm a');
  } catch {
    return time;
  }
}
