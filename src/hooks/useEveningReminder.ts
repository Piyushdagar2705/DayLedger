import { useCallback, useEffect, useState } from 'react';
import { getTodayExpenses } from '../services/expenseService';

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unable to run the evening reminder check.';
}

export function useEveningReminder(userId: string | null | undefined) {
  const [shouldShow, setShouldShow] = useState(false);
  const [hasLoggedToday, setHasLoggedToday] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setShouldShow(false);
      setHasLoggedToday(false);
      setLoading(false);
      return;
    }

    const now = new Date();

    if (now.getHours() < 19) {
      setShouldShow(false);
      setHasLoggedToday(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const todayExpenses = await getTodayExpenses(userId, now);
      setHasLoggedToday(todayExpenses.length > 0);
      setShouldShow(true);
    } catch (serviceError) {
      setError(getErrorMessage(serviceError));
      setShouldShow(false);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();

    const handleFocus = () => {
      void refresh();
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void refresh();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [refresh]);

  return {
    shouldShow,
    hasLoggedToday,
    loading,
    error,
    refresh,
  };
}
