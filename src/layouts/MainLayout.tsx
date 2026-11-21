import { LogOut, Sparkles, X } from 'lucide-react';
import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useSpring } from 'framer-motion';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { FAB } from '../components/FAB';
import { AddExpenseModal } from '../components/modals/AddExpenseModal';
import { AddTodoModal } from '../components/modals/AddTodoModal';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useExpenses } from '../hooks/useExpenses';
import { useTodos } from '../hooks/useTodos';
import type { ExpenseInput, TodoInput } from '../types';
import { useEffect, useState } from 'react';

export function MainLayout() {
  const { currentUser, logout } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  const { scrollY } = useScroll();
  const smoothScrollY = useSpring(scrollY, {
    stiffness: 180,
    damping: 30,
    mass: 0.28,
  });
  const elasticOffsetY = useMotionValue(0);

  useMotionValueEvent(smoothScrollY, 'change', (latest) => {
    if (prefersReducedMotion) {
      elasticOffsetY.set(0);
      return;
    }

    const delta = latest - scrollY.get();
    elasticOffsetY.set(Math.max(-12, Math.min(12, delta * 0.22)));
  });

  useEffect(() => {
    if (prefersReducedMotion) {
      elasticOffsetY.set(0);
    }
  }, [elasticOffsetY, prefersReducedMotion]);

  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [todoModalOpen, setTodoModalOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);

  useEffect(() => {
    if (!quickActionsOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [quickActionsOpen]);

  const { addNewExpense } = useExpenses(currentUser?.uid, { subscribe: false });
  const { addNewTodo } = useTodos(currentUser?.uid, { subscribe: false });

  const isExpenseRoute = location.pathname.startsWith('/expenses');
  const isTodoRoute = location.pathname.startsWith('/todos');

  const handleFabClick = () => {
    if (isExpenseRoute) {
      setExpenseModalOpen(true);
      return;
    }

    if (isTodoRoute) {
      setTodoModalOpen(true);
      return;
    }

    setQuickActionsOpen(true);
  };

  const handleExpenseSubmit = async (input: ExpenseInput) => {
    await addNewExpense(input);
    setExpenseModalOpen(false);
    setQuickActionsOpen(false);
    showToast({
      title: 'Expense added',
      description: 'Your expense was saved successfully.',
      variant: 'success',
    });
  };

  const handleTodoSubmit = async (input: TodoInput) => {
    await addNewTodo(input);
    setTodoModalOpen(false);
    setQuickActionsOpen(false);
    showToast({
      title: 'Todo added',
      description: 'Your task was saved successfully.',
      variant: 'success',
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
      showToast({
        title: 'Signed out',
        description: 'You have been signed out successfully.',
        variant: 'info',
      });
      navigate('/login', { replace: true });
    } catch {
      showToast({
        title: 'Sign-out failed',
        description: 'Please try again.',
        variant: 'error',
      });
    }
  };

  const displayName = currentUser?.displayName?.trim() ?? '';
  const emailPrefix = currentUser?.email?.split('@')[0]?.trim() ?? '';
  const formattedEmailPrefix = emailPrefix
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
  const greetingName = displayName || formattedEmailPrefix || 'there';

  const fabLabel = isExpenseRoute ? 'Add expense' : isTodoRoute ? 'Add todo' : 'Quick add menu';

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-md pb-28 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <a
        href="#main-content"
        className="focus-ring absolute left-6 top-2 z-40 rounded-xl bg-bgPanel px-3 py-2 text-sm font-semibold text-textPrimary opacity-0 focus-visible:opacity-100"
      >
        Skip to main content
      </a>

      <motion.div style={{ y: elasticOffsetY }} className="will-change-transform">
        <header
          className={`mx-4 mb-4 flex justify-between gap-3 px-4 py-3 sm:mx-6 ${
            isTodoRoute ? 'items-center' : 'items-start'
          } ${
            isTodoRoute ? '' : 'surface-card'
          }`}
        >
          <div>
            {isTodoRoute ? null : (
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-textMuted">Expense & Todo Tracker</p>
            )}
            <h1 className={`text-lg font-extrabold leading-tight text-textPrimary ${isTodoRoute ? '' : 'mt-1'}`}>
              {isTodoRoute ? (
                <>
                  <span className="text-textPrimary">{`${greetingName}'s`}</span>
                  <span
                    className="ml-2 text-textMuted"
                    style={{ fontFamily: '"Caveat", "Segoe Script", "Comic Sans MS", cursive' }}
                  >
                    Task's book
                  </span>
                </>
              ) : (
                `Hello, ${greetingName}`
              )}
            </h1>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className={`focus-ring touch-target inline-flex h-10 w-10 items-center justify-center rounded-xl text-textMuted hover:bg-white/5 ${
              isTodoRoute ? '' : 'border border-borderSubtle'
            }`}
            aria-label="Sign out"
          >
            <LogOut aria-hidden="true" className="h-4 w-4" />
          </button>
        </header>

        <main id="main-content" className="space-y-4 px-4 pb-6 sm:px-6">
          <Outlet />
        </main>
      </motion.div>

      <BottomNav />

      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-40">
        <div className="mx-auto flex max-w-md justify-end px-4">
          <div className="pointer-events-auto">
            <FAB onClick={handleFabClick} ariaLabel={fabLabel} variant={isTodoRoute ? 'icon-only' : 'default'} />
          </div>
        </div>
      </div>

      {quickActionsOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/45 pt-3 px-0 pb-0 sm:items-center sm:justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-actions-title"
          onClick={() => setQuickActionsOpen(false)}
        >
          <div
            className="w-full max-w-none rounded-xl border border-borderSubtle bg-bgPanel p-4 sm:max-w-sm"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 id="quick-actions-title" className="text-lg font-bold text-textPrimary">
                  Quick Add
                </h2>
                <p className="text-sm text-textMuted">Choose what you want to create right now.</p>
              </div>
              <button
                type="button"
                onClick={() => setQuickActionsOpen(false)}
                className="focus-ring touch-target inline-flex h-9 w-9 items-center justify-center rounded-xl text-textMuted hover:bg-white/10"
                aria-label="Close quick actions"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setQuickActionsOpen(false);
                  setExpenseModalOpen(true);
                }}
                className="focus-ring touch-target flex w-full items-center justify-between rounded-xl border border-borderSubtle bg-bgPanel px-4 py-3 text-left text-textPrimary hover:bg-white/5"
              >
                <span className="font-semibold">Add Expense</span>
                <Sparkles aria-hidden="true" className="h-4 w-4 text-accent" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setQuickActionsOpen(false);
                  setTodoModalOpen(true);
                }}
                className="focus-ring touch-target flex w-full items-center justify-between rounded-xl border border-borderSubtle bg-bgPanel px-4 py-3 text-left text-textPrimary hover:bg-white/5"
              >
                <span className="font-semibold">Add Todo</span>
                <Sparkles aria-hidden="true" className="h-4 w-4 text-accent" />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <AddExpenseModal
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        onSubmit={handleExpenseSubmit}
      />

      <AddTodoModal
        isOpen={todoModalOpen}
        onClose={() => setTodoModalOpen(false)}
        onSubmit={handleTodoSubmit}
      />
    </div>
  );
}
