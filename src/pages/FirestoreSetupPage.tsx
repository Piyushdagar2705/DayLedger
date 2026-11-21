import { AlertTriangle, LogOut, RefreshCcw, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export function FirestoreSetupPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { showToast } = useToast();

  const handleRetry = () => {
    navigate('/', { replace: true });
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch {
      showToast({
        title: 'Sign-out failed',
        description: 'Please retry in a moment.',
        variant: 'error',
      });
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md items-center px-6 py-8">
      <section className="surface-card w-full p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 text-warning" />
          <div>
            <h1 className="text-xl font-extrabold text-textPrimary">Firestore setup required</h1>
            <p className="mt-2 text-sm text-textMuted">
              Login is successful, but app data cannot load until Firestore is available from this browser.
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-borderSubtle bg-bgBase/70 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-textMuted">Root Cause 1</p>
          <p className="mt-1 text-sm font-semibold text-textPrimary">Firestore database is not created</p>
          <p className="mt-1 text-sm text-textMuted">In Firebase Console, open Firestore Database and create the default database (native mode).</p>
        </div>

        <div className="mt-3 rounded-xl border border-borderSubtle bg-bgBase/70 p-3">
          <div className="flex items-start gap-2">
            <ShieldAlert aria-hidden="true" className="mt-0.5 h-4 w-4 text-danger" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-textMuted">Root Cause 2</p>
              <p className="mt-1 text-sm font-semibold text-textPrimary">Browser blocked Firestore calls</p>
              <p className="mt-1 text-sm text-textMuted">
                Disable ad blockers or privacy shields for localhost so googleapis/firebase requests are allowed.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-2">
          <button
            type="button"
            onClick={handleRetry}
            className="focus-ring touch-target inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            <RefreshCcw aria-hidden="true" className="h-4 w-4" />
            I completed setup, try again
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="focus-ring touch-target inline-flex items-center justify-center gap-2 rounded-xl border border-borderSubtle bg-bgBase px-4 py-3 text-sm font-semibold text-textPrimary hover:bg-white/5"
          >
            <LogOut aria-hidden="true" className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </section>
    </div>
  );
}