import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { CalendarDays, Check, ChevronDown, Search, X } from 'lucide-react';
import { format } from 'date-fns';
import { CATEGORIES } from '../../types';
import type { Category, ExpenseInput } from '../../types';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: ExpenseInput) => Promise<void>;
}

interface ExpenseFieldErrors {
  amount?: string;
  date?: string;
}

const defaultDate = (): string => format(new Date(), 'yyyy-MM-dd');
const CUSTOM_EXPENSE_CATEGORIES_KEY = 'expenseTracker.customExpenseCategories';

function normalizeCategoryName(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function AddExpenseModal({ isOpen, onClose, onSubmit }: AddExpenseModalProps) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>('Food');
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [categoryQuery, setCategoryQuery] = useState('');
  const [dateValue, setDateValue] = useState(defaultDate);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<ExpenseFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const categoryMenuRef = useRef<HTMLDivElement | null>(null);

  const resetForm = useCallback(() => {
    setAmount('');
    setCategory('Food');
    setCategoryMenuOpen(false);
    setCategoryQuery('');
    setDateValue(defaultDate());
    setNote('');
    setErrors({});
    setSubmitError(null);
    setSubmitting(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    resetForm();
  }, [isOpen, resetForm]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(CUSTOM_EXPENSE_CATEGORIES_KEY, JSON.stringify(customCategories));
  }, [customCategories]);

  useEffect(() => {
    if (!categoryMenuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!categoryMenuRef.current) {
        return;
      }

      if (!categoryMenuRef.current.contains(event.target as Node)) {
        setCategoryMenuOpen(false);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
    };
  }, [categoryMenuOpen]);

  const categoryOptions = useMemo(() => {
    return Array.from(new Set([...CATEGORIES, ...customCategories]));
  }, [customCategories]);

  const normalizedCategoryQuery = useMemo(() => normalizeCategoryName(categoryQuery), [categoryQuery]);

  const filteredCategoryOptions = useMemo(() => {
    if (!normalizedCategoryQuery) {
      return categoryOptions;
    }

    const normalizedSearch = normalizedCategoryQuery.toLowerCase();

    return categoryOptions.filter((item) => item.toLowerCase().includes(normalizedSearch));
  }, [categoryOptions, normalizedCategoryQuery]);

  const canCreateCategory = useMemo(() => {
    if (!normalizedCategoryQuery) {
      return false;
    }

    return !categoryOptions.some((item) => item.toLowerCase() === normalizedCategoryQuery.toLowerCase());
  }, [categoryOptions, normalizedCategoryQuery]);

  const handleCreateCategory = () => {
    if (!canCreateCategory) {
      return;
    }

    setCustomCategories((previous) => [...previous, normalizedCategoryQuery]);
    setCategory(normalizedCategoryQuery);
    setCategoryMenuOpen(false);
    setCategoryQuery('');
  };

  if (!isOpen) {
    return null;
  }

  const validate = (): ExpenseFieldErrors => {
    const nextErrors: ExpenseFieldErrors = {};
    const amountValue = Number(amount);

    if (!amount.trim()) {
      nextErrors.amount = 'Amount is required.';
    } else if (Number.isNaN(amountValue) || amountValue <= 0) {
      nextErrors.amount = 'Amount must be greater than 0.';
    }

    const parsedDate = new Date(`${dateValue}T00:00:00`);

    if (!dateValue.trim()) {
      nextErrors.date = 'Date is required.';
    } else if (Number.isNaN(parsedDate.getTime())) {
      nextErrors.date = 'Date must be valid.';
    }

    return nextErrors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      await onSubmit({
        amount: Number(amount),
        category: category as Category,
        date: new Date(`${dateValue}T00:00:00`),
        note: note.trim() || undefined,
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to save expense right now.');
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/45 pt-3 px-0 pb-0 sm:items-center sm:justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-expense-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-borderSubtle bg-bgPanel p-4"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 id="add-expense-title" className="text-lg font-bold text-textPrimary">
              Add Expense
            </h2>
            <p className="text-sm text-textMuted">Track amount, category, and date in one step.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring touch-target inline-flex h-9 w-9 items-center justify-center rounded-xl text-textMuted hover:bg-white/10"
            aria-label="Close add expense form"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="expense-amount" className="mb-1 block text-sm font-semibold text-textPrimary">
              Amount
            </label>
            <input
              id="expense-amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="focus-ring w-full rounded-xl border border-borderSubtle bg-bgBase px-3 py-2.5 text-base text-textPrimary"
              placeholder="e.g. 350"
              aria-invalid={Boolean(errors.amount)}
              aria-describedby={errors.amount ? 'expense-amount-error' : undefined}
              required
            />
            {errors.amount ? (
              <p id="expense-amount-error" className="mt-1 text-xs text-danger">
                {errors.amount}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="expense-category" className="mb-1 block text-sm font-semibold text-textPrimary">
              Category
            </label>
            <div ref={categoryMenuRef} className="relative">
              <button
                id="expense-category"
                type="button"
                onClick={() => setCategoryMenuOpen((open) => !open)}
                className="focus-ring flex w-full items-center justify-between rounded-xl border border-borderSubtle bg-bgBase px-3 py-2.5 text-base text-textPrimary"
                aria-label="Select category"
                aria-haspopup="listbox"
                aria-expanded={categoryMenuOpen}
              >
                <span className="truncate">{category}</span>
                <ChevronDown
                  aria-hidden="true"
                  className={`h-4 w-4 text-textMuted transition-transform ${categoryMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {categoryMenuOpen ? (
                <div className="absolute left-0 top-full z-20 mt-2 w-full rounded-xl border border-borderSubtle bg-bgPanel p-2">
                  <div className="relative">
                    <Search
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-textMuted"
                    />
                    <input
                      type="text"
                      value={categoryQuery}
                      onChange={(event) => setCategoryQuery(event.target.value)}
                      className="focus-ring w-full rounded-xl border border-borderSubtle bg-bgBase px-10 py-2 text-sm text-textPrimary"
                      placeholder="Search or create category"
                    />
                  </div>

                  <ul className="mt-2 max-h-40 space-y-1 overflow-auto pr-1" role="listbox" aria-label="Category options">
                    {filteredCategoryOptions.map((item) => (
                      <li key={item}>
                        <button
                          type="button"
                          onClick={() => {
                            setCategory(item);
                            setCategoryMenuOpen(false);
                            setCategoryQuery('');
                          }}
                          className={`focus-ring flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
                            category === item
                              ? 'border border-accent/40 bg-accent/20 text-textPrimary'
                              : 'text-textMuted hover:bg-white/5 hover:text-textPrimary'
                          }`}
                          role="option"
                          aria-selected={category === item}
                        >
                          <span className="truncate">{item}</span>
                          {category === item ? <Check aria-hidden="true" className="h-4 w-4 text-accent" /> : null}
                        </button>
                      </li>
                    ))}

                    {filteredCategoryOptions.length === 0 ? (
                      <li className="px-3 py-2 text-xs text-textMuted">No categories found.</li>
                    ) : null}
                  </ul>

                  <div className="mt-2 border-t border-borderSubtle pt-2">
                    <button
                      type="button"
                      onClick={handleCreateCategory}
                      disabled={!canCreateCategory}
                      className={`focus-ring w-full rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                        canCreateCategory
                          ? 'border-accent/40 bg-accent/15 text-textPrimary hover:bg-accent/25'
                          : 'border-borderSubtle text-textMuted/70'
                      }`}
                    >
                      {canCreateCategory ? `Create "${normalizedCategoryQuery}"` : 'Type a new category name'}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div>
            <label htmlFor="expense-date" className="mb-1 block text-sm font-semibold text-textPrimary">
              Date
            </label>
            <div className="relative">
              <CalendarDays aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-textMuted" />
              <input
                id="expense-date"
                type="date"
                value={dateValue}
                onChange={(event) => setDateValue(event.target.value)}
                className="focus-ring w-full rounded-xl border border-borderSubtle bg-bgBase px-10 py-2.5 text-base text-textPrimary"
                aria-invalid={Boolean(errors.date)}
                aria-describedby={errors.date ? 'expense-date-error' : undefined}
                required
              />
            </div>
            {errors.date ? (
              <p id="expense-date-error" className="mt-1 text-xs text-danger">
                {errors.date}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor="expense-note" className="mb-1 block text-sm font-semibold text-textPrimary">
              Note (optional)
            </label>
            <textarea
              id="expense-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="focus-ring w-full rounded-xl border border-borderSubtle bg-bgBase px-3 py-2.5 text-base text-textPrimary"
              rows={3}
              placeholder="Add context if needed"
            />
          </div>

          {submitError ? <p className="text-sm text-danger">{submitError}</p> : null}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="focus-ring touch-target flex-1 rounded-xl border border-borderSubtle bg-transparent px-3 py-2.5 text-sm font-semibold text-textPrimary hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="focus-ring touch-target flex-1 rounded-xl bg-accent px-3 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Saving...' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

