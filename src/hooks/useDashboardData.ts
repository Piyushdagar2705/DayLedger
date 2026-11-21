import { useEffect, useMemo, useState } from 'react';
import {
  addDays,
  differenceInCalendarDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  startOfWeek,
  subWeeks,
  subMonths,
} from 'date-fns';
import { subscribeToExpenses } from '../services/expenseService';
import { subscribeToTodos, toggleTodo } from '../services/todoService';
import { CATEGORIES } from '../types';
import type { Category, Expense, Todo } from '../types';
import { toDate } from '../utils/format';
import { normalizeTodosForPeriodReset } from '../utils/todoReset';

interface CategoryBreakdown {
  category: Category;
  total: number;
  percentage: number;
}

function isTodoDueToday(todo: Todo, now: Date): boolean {
  if (todo.type === 'daily') {
    return true;
  }

  const createdAt = toDate(todo.createdAt);

  if (todo.type === 'weekly') {
    return createdAt.getDay() === now.getDay();
  }

  return createdAt.getDate() === now.getDate();
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong while loading dashboard metrics.';
}

export function useDashboardData(userId: string | null | undefined, monthlyBudget: number) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setExpenses([]);
      setTodos([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let expensesLoaded = false;
    let todosLoaded = false;

    const completeLoading = () => {
      if (expensesLoaded && todosLoaded) {
        setLoading(false);
      }
    };

    const unsubscribeExpenses = subscribeToExpenses(
      userId,
      (expenseList) => {
        setExpenses(expenseList);
        expensesLoaded = true;
        completeLoading();
      },
      (serviceError) => {
        setError(getErrorMessage(serviceError));
        setLoading(false);
      },
    );

    const unsubscribeTodos = subscribeToTodos(
      userId,
      (todoList) => {
        const { normalizedTodos, todoIdsToReset } = normalizeTodosForPeriodReset(todoList);

        setTodos(normalizedTodos);

        if (todoIdsToReset.length > 0) {
          void Promise.allSettled(todoIdsToReset.map((todoId) => toggleTodo(todoId, false)));
        }

        todosLoaded = true;
        completeLoading();
      },
      (serviceError) => {
        setError(getErrorMessage(serviceError));
        setLoading(false);
      },
    );

    return () => {
      unsubscribeExpenses();
      unsubscribeTodos();
    };
  }, [userId]);

  const monthExpenses = useMemo(() => {
    const now = new Date();
    return expenses.filter((expense) => isSameMonth(toDate(expense.date), now));
  }, [expenses]);

  const todayExpenses = useMemo(() => {
    const now = new Date();
    return expenses.filter((expense) => isSameDay(toDate(expense.date), now));
  }, [expenses]);

  const weekExpenses = useMemo(() => {
    const now = new Date();

    return expenses.filter((expense) => {
      return isWithinInterval(toDate(expense.date), {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: endOfWeek(now, { weekStartsOn: 1 }),
      });
    });
  }, [expenses]);

  const totalSpentToday = useMemo(() => {
    return todayExpenses.reduce((total, expense) => total + expense.amount, 0);
  }, [todayExpenses]);

  const totalSpentThisWeek = useMemo(() => {
    return weekExpenses.reduce((total, expense) => total + expense.amount, 0);
  }, [weekExpenses]);

  const totalSpentThisMonth = useMemo(() => {
    return monthExpenses.reduce((total, expense) => total + expense.amount, 0);
  }, [monthExpenses]);

  const totalSpentLastWeek = useMemo(() => {
    const now = new Date();
    const lastWeek = subWeeks(now, 1);
    return expenses
      .filter((expense) => {
        return isWithinInterval(toDate(expense.date), {
          start: startOfWeek(lastWeek, { weekStartsOn: 1 }),
          end: endOfWeek(lastWeek, { weekStartsOn: 1 }),
        });
      })
      .reduce((total, expense) => total + expense.amount, 0);
  }, [expenses]);

  const totalSpentLastMonth = useMemo(() => {
    const now = new Date();
    const lastMonth = subMonths(now, 1);
    return expenses
      .filter((expense) => isSameMonth(toDate(expense.date), lastMonth))
      .reduce((total, expense) => total + expense.amount, 0);
  }, [expenses]);

  const remainingBudget = useMemo(() => {
    return monthlyBudget - totalSpentThisMonth;
  }, [monthlyBudget, totalSpentThisMonth]);

  const budgetUsagePercent = useMemo(() => {
    if (monthlyBudget <= 0) {
      return 0;
    }

    return (totalSpentThisMonth / monthlyBudget) * 100;
  }, [monthlyBudget, totalSpentThisMonth]);

  const isBudgetWarning = budgetUsagePercent >= 80;

  const daysLeftInMonth = useMemo(() => {
    const now = new Date();
    return Math.max(1, differenceInCalendarDays(endOfMonth(now), now) + 1);
  }, []);

  const safeDailySpend = useMemo(() => {
    if (monthlyBudget <= 0 || remainingBudget <= 0) {
      return 0;
    }

    return remainingBudget / daysLeftInMonth;
  }, [daysLeftInMonth, monthlyBudget, remainingBudget]);

  const categoryBreakdown = useMemo<CategoryBreakdown[]>(() => {
    const categories = Array.from(new Set([...CATEGORIES, ...monthExpenses.map((expense) => expense.category)]));

    return categories
      .map((category) => {
        const total = monthExpenses
          .filter((expense) => expense.category === category)
          .reduce((sum, expense) => sum + expense.amount, 0);

        const percentage = totalSpentThisMonth > 0 ? (total / totalSpentThisMonth) * 100 : 0;

        return {
          category,
          total,
          percentage,
        };
      })
      .filter((item) => item.total > 0)
      .sort((first, second) => second.total - first.total);
  }, [monthExpenses, totalSpentThisMonth]);

  const weeklyCategoryBreakdown = useMemo<CategoryBreakdown[]>(() => {
    const categories = Array.from(new Set([...CATEGORIES, ...weekExpenses.map((expense) => expense.category)]));

    return categories
      .map((category) => {
        const total = weekExpenses
          .filter((expense) => expense.category === category)
          .reduce((sum, expense) => sum + expense.amount, 0);

        const percentage = totalSpentThisWeek > 0 ? (total / totalSpentThisWeek) * 100 : 0;

        return {
          category,
          total,
          percentage,
        };
      })
      .filter((item) => item.total > 0)
      .sort((first, second) => second.total - first.total);
  }, [totalSpentThisWeek, weekExpenses]);

  const recentExpenses = useMemo(() => {
    return expenses.slice(0, 5);
  }, [expenses]);

  const pendingTodosToday = useMemo(() => {
    const now = new Date();

    return todos
      .filter((todo) => !todo.completed && isTodoDueToday(todo, now))
      .slice(0, 5);
  }, [todos]);

  const weeklyTrendResult = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    const weeklyTrendData = Array.from({ length: 7 }, (_, index) => {
      const date = addDays(weekStart, index);
      const dayExpenses = weekExpenses.filter((expense) => isSameDay(toDate(expense.date), date));

      return {
        date,
        label: format(date, 'EEE'),
        total: dayExpenses.reduce((sum, expense) => sum + expense.amount, 0),
        count: dayExpenses.length,
        isToday: isSameDay(date, now),
      };
    });

    const peakDay = [...weeklyTrendData].sort((a, b) => b.total - a.total)[0];

    return {
      trend: weeklyTrendData,
      peakDayLabel: (peakDay && peakDay.total > 0) ? format(peakDay.date, 'EEEE') : null,
    };
  }, [weekExpenses]);

  const weeklyTrend = weeklyTrendResult.trend;
  const peakDayLabel = weeklyTrendResult.peakDayLabel;

  const monthlyTrend = useMemo(() => {
    const now = new Date();
    
    return Array.from({ length: 4 }, (_, index) => {
      const weekDate = subWeeks(now, 3 - index);
      const start = startOfWeek(weekDate, { weekStartsOn: 1 });
      const end = endOfWeek(weekDate, { weekStartsOn: 1 });
      
      const weekExpenses = expenses.filter((expense) => {
        return isWithinInterval(toDate(expense.date), { start, end });
      });

      return {
        label: `Wk ${format(start, 'd MMM')}`,
        total: weekExpenses.reduce((sum, expense) => sum + expense.amount, 0),
        isCurrent: isWithinInterval(now, { start, end }),
      };
    });
  }, [expenses]);

  return {
    expenses,
    monthExpenses,
    loading,
    error,
    totalSpentToday,
    totalSpentThisWeek,
    totalSpentThisMonth,
    totalSpentLastWeek,
    totalSpentLastMonth,
    remainingBudget,
    budgetUsagePercent,
    isBudgetWarning,
    daysLeftInMonth,
    safeDailySpend,
    recentExpenses,
    todayExpenses,
    weekExpenses,
    pendingTodosToday,
    weeklyTrend,
    peakDayLabel,
    monthlyTrend,
    categoryBreakdown,
    weeklyCategoryBreakdown,
  };
}
