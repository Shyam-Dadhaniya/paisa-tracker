import type { Expense } from '@/types';

export function expensesToCSV(expenses: Expense[]): string {
  const header = ['id', 'date', 'merchant', 'amount', 'category', 'note', 'source'];
  const rows = expenses.map((e) =>
    [e.id, e.date, e.merchant, e.amount, e.category, e.note ?? '', e.source]
      .map((v) => {
        const s = String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      })
      .join(','),
  );
  return [header.join(','), ...rows].join('\n');
}

export function downloadCSV(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
