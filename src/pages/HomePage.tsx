import { useEffect, useState } from 'react';
import { AlertCircle, CalendarRange, CheckCircle2, ChevronRight, Gauge, WalletCards } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '../components/ui/Skeleton';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { useEveningReminder } from '../hooks/useEveningReminder';
import { useUserProfile } from '../hooks/useUserProfile';
import { formatListDate, formatMoney } from '../utils/format';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function HomePage() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const { profile, loading: profileLoading, error: profileError } = useUserProfile(currentUser?.uid);
  const monthlyBudget = profile?.monthlyBudget ?? 0;
  const dashboardUserId = profileError ? null : currentUser?.uid;
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installSubmitting, setInstallSubmitting] = useState(false);

  const {
    loading,
    error,
    totalSpentToday,
    totalSpentThisWeek,
    totalSpentThisMonth,
    remainingBudget,
    budgetUsagePercent,
    daysLeftInMonth,
    safeDailySpend,
    recentExpenses,
    todayExpenses,
    pendingTodosToday,
  } = useDashboardData(dashboardUserId, monthlyBudget);

  const reminder = useEveningReminder(dashboardUserId);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      const promptEvent = event as BeforeInstallPromptEvent;
      promptEvent.preventDefault();
      setInstallPromptEvent(promptEvent);
    };

    const handleAppInstalled = () => {
      setInstallPromptEvent(null);
      setInstallSubmitting(false);

      showToast({
        title: 'App installed',
        description: 'Expense & Todo Tracker is now installed on this device.',
        variant: 'success',
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [showToast]);

  const handleInstallApp = async () => {
    if (!installPromptEvent) {
      return;
    }

    setInstallSubmitting(true);

    try {
      await installPromptEvent.prompt();
      const choice = await installPromptEvent.userChoice;

      showToast({
        title: choice.outcome === 'accepted' ? 'Install started' : 'Install dismissed',
        description:
          choice.outcome === 'accepted'
            ? 'Finish the install from your browser prompt.'
            : 'You can install the app later from the browser menu.',
        variant: 'info',
      });
    } catch {
      showToast({
        title: 'Install failed',
        description: 'Unable to open install prompt right now.',
        variant: 'error',
      });
    } finally {
      setInstallSubmitting(false);
      setInstallPromptEvent(null);
    }
  };

  if (profileError) {
    return (
      <section className="surface-card border-danger/40 bg-danger/10 p-4">
        <h2 className="text-lg font-bold text-textPrimary">Firestore is not ready</h2>
        <p className="mt-1 text-sm text-textMuted">{profileError}</p>
        <Link
          to="/setup/firestore"
          className="focus-ring touch-target mt-4 inline-flex items-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Open setup guide
        </Link>
      </section>
    );
  }

  if (profileLoading || loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <section className="surface-card p-4">
        <h2 className="text-lg font-bold text-textPrimary">Budget setup is required</h2>
        <p className="mt-1 text-sm text-textMuted">Complete onboarding to enable summaries and reminders.</p>
        <Link
          to="/onboarding"
          className="focus-ring touch-target mt-4 inline-flex items-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Go to onboarding
        </Link>
      </section>
    );
  }

  const progressWidth = Math.min(100, Math.max(0, budgetUsagePercent));

  return (
    <div className="space-y-4">
      {installPromptEvent ? (
        <section className="surface-card border-accent/40 bg-accent/10 p-4">
          <h2 className="text-base font-bold text-textPrimary">Install this app</h2>
          <p className="mt-1 text-sm text-textMuted">
            Add Expense & Todo Tracker to your home screen for faster access and app-like usage.
          </p>
          <button
            type="button"
            onClick={handleInstallApp}
            disabled={installSubmitting}
            className="focus-ring touch-target mt-3 inline-flex items-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {installSubmitting ? 'Opening install prompt...' : 'Install app'}
          </button>
        </section>
      ) : null}

      {reminder.shouldShow && !reminder.loading ? (
        <section
          className={`surface-card flex items-start gap-3 p-4 ${
            reminder.hasLoggedToday ? 'border-success/40 bg-success/10' : 'border-danger/40 bg-danger/10'
          }`}
          role="status"
          aria-live="polite"
        >
          {reminder.hasLoggedToday ? (
            <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 text-success" />
          ) : (
            <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 text-danger" />
          )}
          <div>
            <p className="text-sm font-semibold text-textPrimary">
              {reminder.hasLoggedToday
                ? 'Great! You tracked your expenses today.'
                : 'You haven’t logged today’s expenses.'}
            </p>
            {!reminder.hasLoggedToday ? (
              <p className="mt-1 text-xs text-textMuted">Use the + button to quickly add today’s entry.</p>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="surface-card p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-textMuted">Today</p>
            <h2 className="mt-1 text-3xl font-extrabold leading-none text-textPrimary">{formatMoney(totalSpentToday)}</h2>
            <p className="mt-1 text-xs text-textMuted">
              {todayExpenses.length} {todayExpenses.length === 1 ? 'entry' : 'entries'} logged
            </p>
          </div>
          <Link
            to="/expenses"
            className="focus-ring touch-target inline-flex items-center gap-1 rounded-lg border border-borderSubtle px-3 py-2 text-xs font-semibold text-textPrimary transition-colors hover:bg-white/5"
          >
            Details
            <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-borderSubtle pt-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-textMuted">
              <CalendarRange aria-hidden="true" className="h-4 w-4 text-sky-300" />
              <p className="text-xs font-semibold">This week</p>
            </div>
            <p className="mt-1 truncate text-lg font-bold text-textPrimary">{formatMoney(totalSpentThisWeek)}</p>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-textMuted">
              <WalletCards aria-hidden="true" className="h-4 w-4 text-success" />
              <p className="text-xs font-semibold">Remaining</p>
            </div>
            <p className={`mt-1 truncate text-lg font-bold ${remainingBudget >= 0 ? 'text-success' : 'text-danger'}`}>
              {formatMoney(remainingBudget)}
            </p>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-textMuted">
              <Gauge aria-hidden="true" className="h-4 w-4 text-amber-300" />
              <p className="text-xs font-semibold">Safe / day</p>
            </div>
            <p className="mt-1 truncate text-lg font-bold text-textPrimary">{formatMoney(safeDailySpend)}</p>
            <p className="text-[11px] text-textMuted">{daysLeftInMonth} days left</p>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-textMuted">Month used</p>
            <p className="mt-1 truncate text-lg font-bold text-textPrimary">{budgetUsagePercent.toFixed(1)}%</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-[11px] text-textMuted">
            <span>{formatMoney(totalSpentThisMonth)} spent</span>
            <span>{formatMoney(monthlyBudget)} budget</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-bgBase">
            <div className="h-full rounded-full bg-success" style={{ width: `${progressWidth}%` }} />
          </div>
        </div>
      </section>

      <section className="surface-card p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-base font-bold text-textPrimary">Recent expenses</h2>
          <Link
            to="/expenses"
            className="focus-ring touch-target inline-flex items-center gap-1 text-xs font-semibold text-accent transition-colors hover:text-indigo-300 active:text-indigo-200"
          >
            View all
            <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recentExpenses.length === 0 ? (
          <p className="text-sm text-textMuted">No expenses yet. Add your first entry from the + button.</p>
        ) : (
          <ul className="space-y-2">
            {recentExpenses.map((expense) => (
              <li key={expense.id} className="rounded-xl border border-borderSubtle bg-bgBase/70 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-textPrimary">{expense.category}</p>
                    <p className="text-xs text-textMuted">{formatListDate(expense.date)}</p>
                    {expense.note ? <p className="mt-1 text-xs text-textMuted">{expense.note}</p> : null}
                  </div>
                  <p className="text-sm font-bold text-textPrimary">{formatMoney(expense.amount)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="surface-card p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-base font-bold text-textPrimary">Today's todo tasks</h2>
          <Link
            to="/todos"
            className="focus-ring touch-target inline-flex items-center gap-1 text-xs font-semibold text-accent transition-colors hover:text-indigo-300 active:text-indigo-200"
          >
            Open list
            <ChevronRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
        </div>

        {pendingTodosToday.length === 0 ? (
          <p className="text-sm text-textMuted">No tasks due today.</p>
        ) : (
          <ul className="space-y-2">
            {pendingTodosToday.map((todo) => (
              <li key={todo.id} className="flex items-center justify-between gap-3 rounded-xl border border-borderSubtle bg-bgBase/70 px-3 py-2.5">
                <p className="text-sm font-medium text-textPrimary">{todo.title}</p>
                <span className="rounded-xl border border-accent/40 bg-accent/10 px-2.5 py-1 text-[11px] font-semibold uppercase text-accent">
                  {todo.type}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {error || reminder.error ? (
        <section className="surface-card border-danger/40 bg-danger/10 p-3">
          <p className="text-sm text-danger">{error ?? reminder.error}</p>
        </section>
      ) : null}
    </div>
  );
}
