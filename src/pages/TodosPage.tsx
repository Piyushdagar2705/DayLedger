import confetti from 'canvas-confetti';
import Quotes from 'inspirational-quotes';
import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Clock3, ListTodo, RefreshCw, Sparkles, Trash2 } from 'lucide-react';
import { TodoCheckboxIcon } from '../components/icons/TodoCheckboxIcon';
import { Skeleton } from '../components/ui/Skeleton';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useTodos } from '../hooks/useTodos';
import { TODO_TYPES } from '../types';
import type { TodoType } from '../types';

const DELETE_COOLDOWN_MS = 550;
const MAX_MOTIVATION_LENGTH = 120;
const FALLBACK_MOTIVATION_LINE = 'The only people who never fail are those who never try. - Ilka Chase';

interface QuoteItem {
  text: string;
  author?: string;
  from?: string;
}

function pickMotivationLine(): string {
  let candidate = '';

  for (let index = 0; index < 14; index += 1) {
    const quote = Quotes.getQuote() as QuoteItem;
    const quoteText = quote.text?.replace(/\s+/g, ' ').trim() ?? '';
    const quoteAuthor = (quote.author ?? quote.from ?? '').replace(/\s+/g, ' ').trim();

    if (!quoteText) {
      continue;
    }

    const line = quoteAuthor ? `${quoteText} - ${quoteAuthor}` : quoteText;

    if (line.length <= MAX_MOTIVATION_LENGTH) {
      return line;
    }

    candidate = line;
  }

  return candidate || FALLBACK_MOTIVATION_LINE;
}

export function TodosPage() {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const {
    todos,
    filteredTodos,
    activeType,
    setActiveType,
    loading,
    error,
    toggleTodoCompletion,
    removeTodo,
  } = useTodos(currentUser?.uid);

  const isDailyTab = activeType === 'daily';
  const activeTypeLabel = activeType.charAt(0).toUpperCase() + activeType.slice(1);
  const [motivationLine, setMotivationLine] = useState(FALLBACK_MOTIVATION_LINE);
  const checkboxButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const deleteGuardRef = useRef({
    inFlight: false,
    lastDeleteAt: 0,
  });

  useEffect(() => {
    setMotivationLine(pickMotivationLine());
  }, []);

  const refreshMotivationLine = () => {
    setMotivationLine(pickMotivationLine());
  };

  const triggerCompletionConfetti = (triggerElement?: HTMLElement | null) => {
    if (typeof window === 'undefined') {
      return;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const rect = triggerElement?.getBoundingClientRect();
    const origin = rect
      ? {
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: (rect.top + rect.height / 2) / window.innerHeight,
        }
      : { x: 0.5, y: 0.45 };

    void confetti({
      particleCount: 50,
      spread: 72,
      startVelocity: 30,
      scalar: 0.9,
      ticks: 150,
      origin,
      colors: ['#6366F1', '#A5B4FC', '#E2E2E8', '#10B981'],
    });
  };

  const handleToggle = async (todoId: string, completed: boolean, triggerElement?: HTMLElement) => {
    const nextCompleted = !completed;

    try {
      await toggleTodoCompletion(todoId, nextCompleted);

      if (nextCompleted) {
        triggerCompletionConfetti(triggerElement);
      }
    } catch {
      showToast({
        title: 'Todo update failed',
        description: 'Unable to update this task right now.',
        variant: 'error',
      });
    }
  };

  const guardedDelete = async (todoId: string): Promise<'deleted' | 'blocked' | 'error'> => {
    const now = Date.now();
    const isCoolingDown = now - deleteGuardRef.current.lastDeleteAt < DELETE_COOLDOWN_MS;

    if (deleteGuardRef.current.inFlight || isCoolingDown) {
      return 'blocked';
    }

    deleteGuardRef.current.inFlight = true;

    try {
      await removeTodo(todoId);
      deleteGuardRef.current.lastDeleteAt = Date.now();
      showToast({
        title: 'Todo deleted',
        description: 'The selected task was removed.',
        variant: 'success',
      });
      return 'deleted';
    } catch {
      showToast({
        title: 'Delete failed',
        description: 'Unable to delete this task right now.',
        variant: 'error',
      });
      return 'error';
    } finally {
      deleteGuardRef.current.inFlight = false;
    }
  };

  const handleDelete = async (todoId: string) => {
    const result = await guardedDelete(todoId);

    if (result === 'blocked') {
      showToast({
        title: 'Please wait',
        description: 'You can delete one task at a time.',
        variant: 'info',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const openTodos = filteredTodos.filter((todo) => !todo.completed);
  const completedTodos = filteredTodos.filter((todo) => todo.completed);
  const completionPercent = filteredTodos.length > 0 ? (completedTodos.length / filteredTodos.length) * 100 : 0;
  const totalOpenTodos = todos.filter((todo) => !todo.completed).length;
  const typeCounts = TODO_TYPES.map((type) => {
    const typeTodos = todos.filter((todo) => todo.type === type);
    return {
      type,
      total: typeTodos.length,
      open: typeTodos.filter((todo) => !todo.completed).length,
    };
  });

  return (
    <div className="space-y-6">
      <section className="surface-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-textMuted">
              {isDailyTab ? 'Daily list' : `${activeTypeLabel} list`}
            </p>
            <h2 className="mt-1.5 text-4xl font-black tracking-tight text-textPrimary">{openTodos.length}</h2>
            <p className="mt-2 text-xs font-medium text-textMuted/80">
              {openTodos.length === 1 ? 'task' : 'tasks'} remaining
            </p>
          </div>
          <div className="rounded-full bg-success/10 p-2.5">
            <ListTodo aria-hidden="true" className="h-5 w-5 text-success" />
          </div>
        </div>

        <div className="mt-6">
          <div className="h-2 overflow-hidden rounded-full bg-white/5">
            <div className="h-full rounded-full bg-success shadow-[0_0_8px_rgba(16,185,129,0.2)] transition-all duration-700" style={{ width: `${completionPercent}%` }} />
          </div>
          <div className="mt-3 flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wider text-textMuted">
            <span>{completedTodos.length} Completed</span>
            <span>{Math.round(completionPercent)}% done</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-x-4 border-t border-white/5 pt-6">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-textMuted">
              <Clock3 aria-hidden="true" className="h-3.5 w-3.5 text-amber-400" />
              <p className="text-[10px] font-bold uppercase tracking-wider">Open</p>
            </div>
            <p className="text-xl font-extrabold text-textPrimary">{openTodos.length}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-textMuted">
              <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5 text-success" />
              <p className="text-[10px] font-bold uppercase tracking-wider">Done</p>
            </div>
            <p className="text-xl font-extrabold text-textPrimary">{completedTodos.length}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-textMuted">
              <Sparkles aria-hidden="true" className="h-3.5 w-3.5 text-sky-400" />
              <p className="text-[10px] font-bold uppercase tracking-wider">Total</p>
            </div>
            <p className="text-xl font-extrabold text-textPrimary">{totalOpenTodos}</p>
          </div>
        </div>
      </section>

      <section className="surface-card p-1.5">
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-white/[0.02] p-1 border border-white/5">
          {typeCounts.map(({ type, open }) => {
            const label = type.charAt(0).toUpperCase() + type.slice(1);
            const selected = activeType === type;

            return (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setActiveType(type as TodoType);
                  refreshMotivationLine();
                }}
                className={`focus-ring min-h-12 rounded-lg px-2 py-1 text-center transition-all active:scale-[0.95] ${
                  selected ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-textMuted hover:bg-white/5'
                }`}
              >
                <span className="block text-[10px] font-black uppercase tracking-tight">{label}</span>
                <span className="block text-[9px] font-bold opacity-60 uppercase">{open} open</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="surface-card relative overflow-hidden p-5">
        <div className="flex items-start justify-between gap-4">
          <p
            className="text-lg font-medium leading-relaxed text-textMuted/90 italic"
            style={{ fontFamily: '"Caveat", cursive' }}
          >
            {`"${motivationLine}"`}
          </p>
          <button
            type="button"
            onClick={refreshMotivationLine}
            className="focus-ring touch-target inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/5 bg-white/[0.03] text-textMuted transition-all active:rotate-180"
            aria-label="Refresh quote"
          >
            <RefreshCw aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </section>

      <section className="surface-card p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-sm font-black uppercase tracking-widest text-textPrimary">
            {isDailyTab ? 'Daily Focus' : `${activeTypeLabel} List`}
          </h2>
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold text-textMuted">
            {filteredTodos.length} total
          </span>
        </div>

        {filteredTodos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
            <p className="text-xs font-bold text-textMuted/60 uppercase tracking-widest">List Empty</p>
            <p className="mt-2 text-xs font-medium text-textMuted/40">Use the + button to add a new task.</p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-textMuted">Incomplete</p>
                <span className="text-[10px] font-black text-textMuted">{openTodos.length}</span>
              </div>
              {openTodos.length === 0 ? (
                <div className="rounded-2xl border border-success/20 bg-success/5 p-4 text-center">
                  <p className="text-xs font-bold text-success/80 uppercase tracking-widest">All tasks done!</p>
                </div>
              ) : (
                <motion.ul className="space-y-3" layout>
                  {openTodos.map((todo) => (
                    <motion.li
                      key={todo.id}
                      layout
                      className="group flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-3.5 transition-all hover:bg-white/[0.04]"
                    >
                      <button
                        ref={(element) => {
                          checkboxButtonRefs.current[todo.id] = element;
                        }}
                        type="button"
                        onClick={(event) => {
                          void handleToggle(todo.id, todo.completed, event.currentTarget);
                        }}
                        className="focus-ring touch-target inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white/20 transition-colors hover:text-accent group-hover:bg-accent/5"
                        aria-label="Mark complete"
                      >
                        <TodoCheckboxIcon checked={false} size={18} aria-hidden="true" className="h-5 w-5" />
                      </button>

                      <button
                        type="button"
                        onClick={(event) => {
                          void handleToggle(
                            todo.id,
                            todo.completed,
                            checkboxButtonRefs.current[todo.id] ?? event.currentTarget,
                          );
                        }}
                        className="focus-ring min-w-0 flex-1 bg-transparent text-left text-[15px] font-bold leading-tight text-textPrimary"
                        aria-label={`Complete ${todo.title}`}
                      >
                        {todo.title}
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleDelete(todo.id)}
                        className="focus-ring touch-target inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/5 bg-white/[0.03] text-textMuted transition-colors hover:bg-danger/10 hover:text-danger active:scale-[0.9]"
                        aria-label="Delete"
                      >
                        <Trash2 aria-hidden="true" className="h-4 w-4" />
                      </button>
                    </motion.li>
                  ))}
                </motion.ul>
              )}
            </div>

            {completedTodos.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-textMuted">Completed</p>
                  <span className="text-[10px] font-black text-textMuted">{completedTodos.length}</span>
                </div>
                <motion.ul className="space-y-3" layout>
                  {completedTodos.map((todo) => (
                    <motion.li
                      key={todo.id}
                      layout
                      className="group flex items-center gap-4 rounded-2xl border border-white/5 bg-white/[0.01] p-3.5 opacity-60 transition-all hover:opacity-80"
                    >
                      <button
                        ref={(element) => {
                          checkboxButtonRefs.current[todo.id] = element;
                        }}
                        type="button"
                        onClick={(event) => {
                          void handleToggle(todo.id, todo.completed, event.currentTarget);
                        }}
                        className="focus-ring touch-target inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-success"
                        aria-label="Mark incomplete"
                      >
                        <TodoCheckboxIcon checked size={18} aria-hidden="true" className="h-5 w-5" />
                      </button>

                      <button
                        type="button"
                        onClick={(event) => {
                          void handleToggle(
                            todo.id,
                            todo.completed,
                            checkboxButtonRefs.current[todo.id] ?? event.currentTarget,
                          );
                        }}
                        className="focus-ring min-w-0 flex-1 bg-transparent text-left text-[15px] font-bold leading-tight text-textMuted line-through decoration-textMuted/50"
                        aria-label={`Re-open ${todo.title}`}
                      >
                        {todo.title}
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleDelete(todo.id)}
                        className="focus-ring touch-target inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/5 bg-white/[0.03] text-textMuted hover:text-danger active:scale-[0.9]"
                        aria-label="Delete"
                      >
                        <Trash2 aria-hidden="true" className="h-4 w-4" />
                      </button>
                    </motion.li>
                  ))}
                </motion.ul>
              </div>
            ) : null}
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
