import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useExpenseStore } from '@/store/expenseStore';
import ExpenseForm from '@/components/ExpenseForm';
import type { ExpenseFormValues } from '@/components/ExpenseForm';

export default function AddExpense() {
  const navigate = useNavigate();
  const addExpense = useExpenseStore((s) => s.addExpense);

  const handleSubmit = async (
    data: ExpenseFormValues,
    extra: Parameters<React.ComponentProps<typeof ExpenseForm>['onSubmit']>[1],
  ) => {
    const { entryType, items, selectedMode, selectedSourceId } = extra;
    await addExpense({
      amount: items.length > 0 && entryType === 'expense'
        ? items.reduce((s, i) => s + i.price * i.qty, 0)
        : Number(data.amount),
      title: data.title.trim(),
      category: data.category,
      date: data.date,
      time: data.time,
      type: entryType,
      note: data.note?.trim() || undefined,
      items: entryType === 'expense' && items.length > 0 ? items : undefined,
      paymentMode: selectedMode ?? undefined,
      paymentSourceId: selectedSourceId,
    });
    navigate('/');
  };

  return (
    <main className="safe-top flex flex-col h-[100dvh] max-w-md mx-auto">
      <header className="flex items-center gap-2 px-4 py-4 shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-muted active:scale-95"
          aria-label="Back"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">Add entry</h1>
      </header>
      <ExpenseForm onSubmit={handleSubmit} />
    </main>
  );
}
