import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useExpenseStore } from '@/store/expenseStore';
import { useExpenseById } from '@/hooks/useExpenses';
import ExpenseForm from '@/components/ExpenseForm';
import type { ExpenseFormValues } from '@/components/ExpenseForm';

export default function EditExpense() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const updateExpense = useExpenseStore((s) => s.updateExpense);
  const deleteExpense = useExpenseStore((s) => s.deleteExpense);
  const expense = useExpenseById(id!);

  const handleSubmit = async (
    data: ExpenseFormValues,
    extra: Parameters<React.ComponentProps<typeof ExpenseForm>['onSubmit']>[1],
  ) => {
    const { entryType, items, selectedMode, selectedSourceId } = extra;
    await updateExpense(id!, {
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
    navigate('/history');
  };

  const handleDelete = async () => {
    if (confirm('Delete this entry?')) {
      await deleteExpense(id!);
      navigate('/history');
    }
  };

  if (expense === null) {
    return (
      <main className="safe-top safe-bottom max-w-md mx-auto px-4">
        <p className="text-center text-muted mt-12">Entry not found.</p>
      </main>
    );
  }

  if (expense === undefined) return null;

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
        <h1 className="text-xl font-bold">Edit entry</h1>
      </header>
      <ExpenseForm
        initialData={expense}
        onSubmit={handleSubmit}
        submitLabel="Save changes"
      >
        <button
          type="button"
          onClick={handleDelete}
          className="w-full text-danger text-sm font-medium py-3 active:scale-[0.98] transition"
        >
          Delete entry
        </button>
      </ExpenseForm>
    </main>
  );
}
