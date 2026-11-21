import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Skeleton } from '../components/ui/Skeleton';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useUserProfile } from '../hooks/useUserProfile';
import { createUser } from '../services/userService';

export function OnboardingPage() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const { profile, loading, error: profileError } = useUserProfile(currentUser?.uid);

  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (profile) {
      navigate('/', { replace: true });
    }
  }, [profile, navigate]);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md items-center px-6 py-8">
        <div className="w-full space-y-3">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md items-center px-6 py-8">
        <section className="surface-card w-full border-danger/40 bg-danger/10 p-5">
          <h1 className="text-xl font-extrabold text-textPrimary">Firestore is not ready</h1>
          <p className="mt-2 text-sm text-textMuted">{profileError}</p>
          <Link
            to="/setup/firestore"
            className="focus-ring touch-target mt-4 inline-flex items-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Open setup guide
          </Link>
        </section>
      </div>
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const budgetValue = Number(monthlyBudget);

    if (!monthlyBudget.trim()) {
      setError('Monthly budget is required.');
      return;
    }

    if (Number.isNaN(budgetValue) || budgetValue <= 0) {
      setError('Monthly budget must be greater than 0.');
      return;
    }

    if (!currentUser.email) {
      setError('An account email is required to complete setup.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createUser({
        userId: currentUser.uid,
        name: currentUser.displayName ?? 'New User',
        email: currentUser.email,
        monthlyBudget: budgetValue,
      });

      showToast({
        title: 'Setup complete',
        description: 'Your account is ready.',
        variant: 'success',
      });

      navigate('/', { replace: true });
    } catch {
      setError('Unable to save your budget right now. Please retry.');
      showToast({
        title: 'Setup failed',
        description: 'Please retry in a few seconds.',
        variant: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md items-center px-6 py-8">
      <div className="surface-card w-full p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-textMuted">Welcome</p>
        <h1 className="mt-2 text-2xl font-extrabold text-textPrimary">Set your monthly budget</h1>
        <p className="mt-2 text-sm text-textMuted">You can update this later, but this helps generate instant dashboard insights.</p>

        <form className="mt-6 space-y-3" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="monthly-budget" className="mb-1 block text-sm font-semibold text-textPrimary">
              Monthly Budget
            </label>
            <input
              id="monthly-budget"
              type="number"
              min="0"
              step="0.01"
              value={monthlyBudget}
              onChange={(event) => setMonthlyBudget(event.target.value)}
              className="focus-ring w-full rounded-xl border border-borderSubtle bg-bgBase px-3 py-2.5 text-base text-textPrimary"
              placeholder="e.g. 25000"
              required
            />
          </div>

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="focus-ring touch-target inline-flex w-full items-center justify-center rounded-xl bg-accent px-4 py-3 text-base font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Saving...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
