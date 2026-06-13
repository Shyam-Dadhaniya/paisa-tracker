import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { Expense, Category, PaymentSource } from '@/types';
import { formatDate } from '@/utils/format';
import { getCategory } from '@/utils/categories';
import { resolveSourceLabel } from '@/utils/paymentSources';
import { PRIMARY_RGB } from '@/constants/theme';

export interface PdfExportOptions {
  expenses: Expense[];
  periodLabel: string;
  categories: Category[];
  paymentSources?: PaymentSource[];
  filterSummary?: string;
  generatedAt?: Date;
}

function paymentLabel(e: Expense, sources: PaymentSource[]): string {
  if (!e.paymentMode) return '-';
  if (e.paymentMode === 'cash') return 'Cash';
  const name = resolveSourceLabel(e.paymentSourceId, sources);
  if (e.paymentMode === 'online') return name ? `Online (${name})` : 'Online';
  if (e.paymentMode === 'credit_card') return name ? `CC (${name})` : 'Credit Card';
  return '-';
}

// jsPDF built-in fonts are Latin-1 only — ₹ and emoji are not supported.
// Use "Rs." prefix for all PDF monetary values.
function fmtAmt(n: number): string {
  const abs = Math.abs(n);
  const s = abs.toLocaleString('en-IN', { maximumFractionDigits: abs % 1 === 0 ? 0 : 2 });
  return `${n < 0 ? '-' : ''}Rs. ${s}`;
}

export function generatePDF({
  expenses,
  periodLabel,
  categories,
  paymentSources = [],
  filterSummary,
  generatedAt = new Date(),
}: PdfExportOptions): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const usable = pageWidth - margin * 2; // 182mm

  // — Color palette (light theme, print-friendly) —
  const white: [number, number, number] = [255, 255, 255];
  const offWhite: [number, number, number] = [248, 249, 253];
  const indigo: [number, number, number] = PRIMARY_RGB;          // used for page header bar only
  const sectionColor: [number, number, number] = [90, 92, 180];  // softer indigo for section labels
  const indigoDark: [number, number, number] = [67, 56, 202];
  const darkText: [number, number, number] = [40, 42, 60];
  const mutedTxt: [number, number, number] = [110, 110, 130];
  const green: [number, number, number] = [16, 185, 129];
  const red: [number, number, number] = [220, 50, 50];
  const lightGray: [number, number, number] = [180, 182, 196];   // visible grid lines
  const indigoLight: [number, number, number] = [238, 242, 255];
  // Table header: light tint + dark text (matches reference image style)
  const headerFill: [number, number, number] = [235, 237, 254];
  const headerText: [number, number, number] = [40, 40, 58];

  let y = 0;

  // ── HEADER BAR ──────────────────────────────────────────────────────────
  const headerH = 36;
  doc.setFillColor(...indigo);
  doc.rect(0, 0, pageWidth, headerH, 'F');

  // Left: brand name + subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...white);
  doc.text('PaisaTrack', margin, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(220, 220, 255);
  doc.text('Expense Report', margin, 21);

  // Right: period + date
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...white);
  doc.text(periodLabel, pageWidth - margin, 13, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(210, 210, 255);
  doc.text(
    `Generated: ${format(generatedAt, 'd MMM yyyy, h:mm a')}`,
    pageWidth - margin,
    21,
    { align: 'right' },
  );

  // Filter summary (shown when payment/source filters are active)
  if (filterSummary) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 220, 180);
    doc.text(filterSummary, margin, 30);
  }

  y = headerH + 10;

  // ── SUMMARY CARDS ────────────────────────────────────────────────────────
  const income = expenses
    .filter((e) => e.type === 'income')
    .reduce((s, e) => s + e.amount, 0);
  const expense = expenses
    .filter((e) => (e.type ?? 'expense') === 'expense')
    .reduce((s, e) => s + e.amount, 0);
  const net = income - expense;

  const cardH = 22;
  const gap = 4;
  const colW = (usable - gap * 2) / 3;

  const summaryItems = [
    { label: 'Total Income', value: fmtAmt(income), color: green },
    { label: 'Total Expenses', value: fmtAmt(expense), color: red },
    {
      label: 'Net Balance',
      value: fmtAmt(net),
      color: net >= 0 ? green : red,
    },
  ] as { label: string; value: string; color: [number, number, number] }[];

  summaryItems.forEach((item, i) => {
    const x = margin + i * (colW + gap);

    // Card background
    doc.setFillColor(...white);
    doc.setDrawColor(...lightGray);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, colW, cardH, 2, 2, 'FD');

    // Colored left accent strip (4mm wide)
    doc.setFillColor(...item.color);
    doc.roundedRect(x, y, 4, cardH, 2, 2, 'F');
    doc.rect(x + 2, y, 2, cardH, 'F'); // square off the right side of strip

    // Label
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...mutedTxt);
    doc.text(item.label, x + 7, y + 7.5);

    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...item.color);
    doc.text(item.value, x + 7, y + 16.5);
  });

  y += cardH + 12;

  // ── CATEGORY BREAKDOWN ───────────────────────────────────────────────────
  const catMap = new Map<string, { label: string; count: number; total: number }>();
  for (const e of expenses) {
    const cat = categories.find((c) => c.id === e.category) ?? getCategory(e.category);
    const existing = catMap.get(cat.id) ?? { label: cat.label, count: 0, total: 0 };
    existing.count += 1;
    existing.total += e.amount;
    catMap.set(cat.id, existing);
  }

  const catRows = Array.from(catMap.values())
    .sort((a, b) => b.total - a.total)
    .map((c) => [c.label, String(c.count), fmtAmt(c.total)]);

  // Section title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...sectionColor);
  doc.text('CATEGORY BREAKDOWN', margin, y);
  const titleW = doc.getTextWidth('CATEGORY BREAKDOWN');
  doc.setDrawColor(...sectionColor);
  doc.setLineWidth(0.5);
  doc.line(margin, y + 1.5, margin + titleW, y + 1.5);

  // Transaction count badge
  doc.setFillColor(...indigoLight);
  const badge = `${expenses.length} transaction${expenses.length !== 1 ? 's' : ''}`;
  const badgeX = margin + titleW + 5;
  doc.roundedRect(badgeX, y - 5, doc.getTextWidth(badge) + 6, 7, 2, 2, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...indigoDark);
  doc.text(badge, badgeX + 3, y - 0.5);

  y += 5;

  autoTable(doc, {
    startY: y,
    head: [['Category', 'Transactions', 'Total Amount']],
    body: catRows.length > 0 ? catRows : [['No data', '—', '—']],
    theme: 'grid',
    headStyles: {
      fillColor: headerFill,
      textColor: headerText,
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 3.5,
      lineColor: lightGray,
      lineWidth: 0.3,
    },
    bodyStyles: {
      fillColor: white,
      textColor: darkText,
      fontSize: 7.5,
      cellPadding: 2.5,
      lineColor: lightGray,
      lineWidth: 0.3,
    },
    alternateRowStyles: { fillColor: offWhite },
    columnStyles: {
      0: { cellWidth: 80, overflow: 'linebreak' },
      1: { cellWidth: 40, halign: 'center' },
      2: { halign: 'right' },
    },
    margin: { left: margin, right: margin },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;

  // ── TRANSACTIONS ─────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...sectionColor);
  doc.text('TRANSACTIONS', margin, y);
  const txTitleW = doc.getTextWidth('TRANSACTIONS');
  doc.setDrawColor(...sectionColor);
  doc.setLineWidth(0.5);
  doc.line(margin, y + 1.5, margin + txTitleW, y + 1.5);

  y += 5;

  const txRows = [...expenses].sort((a, b) => a.date.localeCompare(b.date)).map((e) => {
    const cat = categories.find((c) => c.id === e.category) ?? getCategory(e.category);
    const txType = e.type ?? 'expense';
    return [
      formatDate(e.date, 'd MMM yy'),
      e.title,
      cat.label,
      paymentLabel(e, paymentSources),
      fmtAmt(e.amount),
      txType.toUpperCase(),
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [['Date', 'Title', 'Category', 'Payment', 'Amount', 'Type']],
    body: txRows.length > 0 ? txRows : [['—', 'No transactions', '—', '—', '—', '—']],
    theme: 'grid',
    headStyles: {
      fillColor: headerFill,
      textColor: headerText,
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 3.5,
      lineColor: lightGray,
      lineWidth: 0.3,
    },
    bodyStyles: {
      fillColor: white,
      textColor: darkText,
      fontSize: 7.5,
      cellPadding: 2.5,
      lineColor: lightGray,
      lineWidth: 0.3,
    },
    alternateRowStyles: { fillColor: offWhite },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 56, overflow: 'linebreak' },
      2: { cellWidth: 30, overflow: 'linebreak' },
      3: { cellWidth: 34 },
      4: { halign: 'right', cellWidth: 22 },
      5: { halign: 'center', cellWidth: 20 },
    },
    didParseCell: (data) => {
      if (data.section !== 'body') return;
      const row = txRows[data.row.index];
      if (!row) return;
      const isIncome = row[5] === 'INCOME';
      if (data.column.index === 4) {
        data.cell.styles.textColor = isIncome ? green : red;
        data.cell.styles.fontStyle = 'bold';
      }
      if (data.column.index === 5) {
        data.cell.styles.textColor = isIncome ? green : red;
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fontSize = 7;
      }
    },
    margin: { left: margin, right: margin },
  });

  // ── PER-PAGE FOOTER ───────────────────────────────────────────────────────
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const footerY = doc.internal.pageSize.getHeight() - 8;

    doc.setDrawColor(...lightGray);
    doc.setLineWidth(0.3);
    doc.line(margin, footerY - 2, pageWidth - margin, footerY - 2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...mutedTxt);
    doc.text(`PaisaTrack  ·  ${periodLabel}`, margin, footerY);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, footerY, { align: 'right' });
  }

  const slug = periodLabel.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  doc.save(`paisatrack-${slug}.pdf`);
}
