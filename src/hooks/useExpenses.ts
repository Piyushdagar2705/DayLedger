import { useCallback, useEffect, useMemo, useState } from 'react';
import { endOfMonth, endOfWeek, isSameDay, isSameMonth, isWithinInterval, startOfMonth, startOfWeek } from 'date-fns';
import { addExpense, deleteExpense, subscribeToExpenses } from '../services/expenseService';
import { CATEGORIES } from '../types';
import type { Category, Expense, ExpenseDateFilter, ExpenseInput } from '../types';
import { toDate } from '../utils/format';

type CategoryFilter = Category | 'All';

interface UseExpensesOptions {
  subscribe?: boolean;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong while processing expenses.';
}

function matchesDateFilter(expense: Expense, filter: ExpenseDateFilter): boolean {
  if (filter === 'all') {
    return true;
  }

  const expenseDate = toDate(expense.date);
  const now = new Date();

  if (filter === 'day') {
    return isSameDay(expenseDate, now);
  }

  if (filter === 'week') {
    return isWithinInterval(expenseDate, {
      start: startOfWeek(now, { weekStartsOn: 1 }),
      end: endOfWeek(now, { weekStartsOn: 1 }),
    });
  }

  return isWithinInterval(expenseDate, {
    start: startOfMonth(now),
    end: endOfMonth(now),
  });
}

export function useExpenses(userId: string | null | undefined, options: UseExpensesOptions = {}) {
  const { subscribe = true } = options;
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('All');
  const [dateFilter, setDateFilter] = useState<ExpenseDateFilter>('day');

  useEffect(() => {
    if (!userId) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    if (!subscribe) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToExpenses(
      userId,
      (expenseList) => {
        setExpenses(expenseList);
        setLoading(false);
      },
      (serviceError) => {
        setError(getErrorMessage(serviceError));
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [userId, subscribe]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const categoryMatches = categoryFilter === 'All' || expense.category === categoryFilter;
      const dateMatches = matchesDateFilter(expense, dateFilter);

      return categoryMatches && dateMatches;
    });
  }, [expenses, categoryFilter, dateFilter]);

  const availableCategories = useMemo(() => {
    return Array.from(new Set([...CATEGORIES, ...expenses.map((expense) => expense.category)]));
  }, [expenses]);

  const dailyTotal = useMemo(() => {
    const today = new Date();

    return expenses.reduce((total, expense) => {
      return isSameDay(toDate(expense.date), today) ? total + expense.amount : total;
    }, 0);
  }, [expenses]);

  const weeklyTotal = useMemo(() => {
    const today = new Date();

    return expenses.reduce((total, expense) => {
      return isWithinInterval(toDate(expense.date), {
        start: startOfWeek(today, { weekStartsOn: 1 }),
        end: endOfWeek(today, { weekStartsOn: 1 }),
      })
        ? total + expense.amount
        : total;
    }, 0);
  }, [expenses]);

  const monthlyTotal = useMemo(() => {
    const today = new Date();

    return expenses.reduce((total, expense) => {
      return isSameMonth(toDate(expense.date), today) ? total + expense.amount : total;
    }, 0);
  }, [expenses]);

  const addNewExpense = useCallback(
    async (input: ExpenseInput) => {
      if (!userId) {
        throw new Error('You must be logged in to add an expense.');
      }

      try {
        await addExpense(userId, input);
      } catch (serviceError) {
        const message = getErrorMessage(serviceError);
        setError(message);
        throw new Error(message);
      }
    },
    [userId],
  );

  const removeExpense = useCallback(async (expenseId: string) => {
    try {
      await deleteExpense(expenseId);
    } catch (serviceError) {
      const message = getErrorMessage(serviceError);
      setError(message);
      throw new Error(message);
    }
  }, []);

  return {
    expenses,
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
    addNewExpense,
    removeExpense,
  };
}
