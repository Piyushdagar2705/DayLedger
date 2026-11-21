import { CalendarDays, CalendarRange, ListFilter, Trash2, WalletCards } from 'lucide-react';
import { format, isSameDay, subDays } from 'date-fns';
import { Skeleton } from '../components/ui/Skeleton';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useExpenses } from '../hooks/useExpenses';
import type { Expense } from '../types';
import type { ExpenseDateFilter } from '../types';
import { formatListDate, formatMoney, toDate } from '../utils/format';

const dateFilterOptions: { value: ExpenseDateFilter; label: string }[] = [
  { value: 'day', label: 'Today' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'all', label: 'All' },
];

interface ExpenseGroup {
  key: string;
  label: string;
  total: number;
  expenses: Expense[];
}

function getExpenseGroupLabel(date: Date): string {
  const today = new Date();

  if (isSameDay(date, today)) {
    return 'Today';
  }

  if (isSameDay(date, subDays(today, 1))) {
    return 'Yesterday';
  }

  return formatListDate(date);
}

export function ExpensesPage() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const {
    filteredExpenses,
    loading,
    error,
    categoryFilter,
    dateFilter,
    setCategoryFilter,
    setDateFilter,
    dailyTotal,
    weeklyTotal,
    monthlyTotal,
    availableCategories,
    removeExpense,
  } = useExpenses(currentUser?.uid);

  const expenseGroups = filteredExpenses.reduce<ExpenseGroup[]>((groups, expense) => {
    const expenseDate = toDate(expense.date);
    const key = format(expenseDate, 'yyyy-MM-dd');
    const existingGroup = groups.find((group) => group.key === key);

    if (existingGroup) {
      existingGroup.expenses.push(expense);
      existingGroup.total += expense.amount;
      return groups;
    }

    groups.push({
      key,
      label: getExpenseGroupLabel(expenseDate),
      total: expense.amount,
      expenses: [expense],
    });

    return groups;
  }, []);

  const currentDateFilterLabel = dateFilterOptions.find((option) => option.value === dateFilter)?.label ?? 'Expenses';
  const listTitle = dateFilter === 'all' ? 'All expenses' : `${currentDateFilterLabel} expenses`;

  const handleDelete = async (expenseId: string) => {
    try {
      await removeExpense(expenseId);
      showToast({
        title: 'Expense deleted',
        description: 'The selected expense was removed.',
        variant: 'success',
      });
    } catch {
      showToast({
        title: 'Delete failed',
        description: 'Unable to delete this expense right now.',
        variant: 'error',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="surface-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-textMuted">Focus</p>
            <h2 className="mt-1.5 text-4xl font-black tracking-tight text-textPrimary">{formatMoney(dailyTotal)}</h2>
            <p className="mt-2 text-xs font-medium text-textMuted/80">Spent today</p>
          </div>
          <div className="rounded-full bg-success/10 p-2.5">
            <WalletCards aria-hidden="true" className="h-5 w-5 text-success" />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-x-6 border-t border-white/5 pt-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-textMuted">
              <CalendarRange aria-hidden="true" className="h-3.5 w-3.5 text-sky-400" />
              <p className="text-[10px] font-bold uppercase tracking-wider">This week</p>
            </div>
            <p className="truncate text-xl font-extrabold text-textPrimary">{formatMoney(weeklyTotal)}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-textMuted">
              <CalendarDays aria-hidden="true" className="h-3.5 w-3.5 text-amber-400" />
              <p className="text-[10px] font-bold uppercase tracking-wider">This month</p>
            </div>
            <p className="truncate text-xl font-extrabold text-textPrimary">{formatMoney(monthlyTotal)}</p>
          </div>
        </div>
      </section>

      <section className="surface-card p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-textMuted">
            <ListFilter aria-hidden="true" className="h-3.5 w-3.5" />
            Filtering
          </h2>
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold text-textMuted">
            {filteredExpenses.length} Results
          </span>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-1.5 rounded-xl bg-white/[0.02] p-1 border border-white/5">
          {dateFilterOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setDateFilter(option.value)}
              className={`focus-ring relative min-h-10 rounded-lg px-2 text-[10px] font-bold uppercase tracking-tight transition-all active:scale-[0.95] ${
                dateFilter === option.value ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-textMuted hover:bg-white/5'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setCategoryFilter('All')}
            className={`focus-ring touch-target whitespace-nowrap rounded-full border px-4 py-2 text-[10px] font-bold uppercase tracking-wide transition-all active:scale-[0.95] ${
              categoryFilter === 'All'
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-white/5 bg-white/[0.03] text-textMuted hover:bg-white/5'
            }`}
          >
            All categories
          </button>
          {availableCategories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setCategoryFilter(category)}
              className={`focus-ring touch-target whitespace-nowrap rounded-full border px-4 py-2 text-[10px] font-bold uppercase tracking-wide transition-all active:scale-[0.95] ${
                categoryFilter === category
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-white/5 bg-white/[0.03] text-textMuted hover:bg-white/5'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <section className="surface-card p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-sm font-black uppercase tracking-widest text-textPrimary">{listTitle}</h2>
          <p className="text-sm font-black text-textPrimary">{formatMoney(filteredExpenses.reduce((sum, item) => sum + item.amount, 0))}</p>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
            <p className="text-xs font-bold text-textMuted/60 uppercase tracking-widest">Clear Records</p>
            <p className="mt-2 text-xs font-medium text-textMuted/40">No entries match your current filter settings.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {expenseGroups.map((group) => (
              <div key={group.key}>
                <div className="mb-4 flex items-center justify-between gap-2 border-b border-white/5 pb-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-textMuted">{group.label}</p>
                  <p className="text-[10px] font-black text-textMuted">{formatMoney(group.total)}</p>
                </div>
                <ul className="space-y-3">
                  {group.expenses.map((expense) => (
                    <li key={expense.id} className="group relative rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:bg-white/[0.04]">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-textPrimary">{expense.category}</p>
                          <p className="text-[10px] font-bold text-textMuted/60 uppercase tracking-tighter">{formatListDate(expense.date)}</p>
                          {expense.note ? <p className="mt-2 line-clamp-2 text-xs font-medium text-textMuted leading-relaxed">{expense.note}</p> : null}
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <p className="text-base font-black text-textPrimary">{formatMoney(expense.amount)}</p>
                          <button
                            type="button"
                            onClick={() => handleDelete(expense.id)}
                            className="focus-ring touch-target inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/5 bg-white/[0.03] text-textMuted transition-colors hover:bg-danger/10 hover:text-danger active:scale-[0.9]"
                            aria-label="Delete expense"
                          >
                            <Trash2 aria-hidden="true" className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      {error ? (
        <section className="rounded-xl border border-danger/20 bg-danger/5 p-4">
          <p className="text-xs font-semibold text-danger">{error}</p>
        </section>
      ) : null}
    </div>
  );
}
