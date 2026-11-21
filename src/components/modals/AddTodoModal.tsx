import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { CalendarDays, CalendarRange, Repeat2, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { TODO_TYPES } from '../../types';
import type { TodoInput, TodoType } from '../../types';

interface AddTodoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: TodoInput) => Promise<void>;
}

interface TodoFieldErrors {
  title?: string;
}

const todoTypeMeta: Record<TodoType, { label: string; helper: string; icon: LucideIcon }> = {
  daily: {
    label: 'Daily',
    helper: 'Every day',
    icon: CalendarDays,
  },
  weekly: {
    label: 'Weekly',
    helper: 'Same weekday',
    icon: CalendarRange,
  },
  monthly: {
    label: 'Monthly',
    helper: 'Same date',
    icon: Repeat2,
  },
};

export function AddTodoModal({ isOpen, onClose, onSubmit }: AddTodoModalProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<TodoType>('daily');
  const [errors, setErrors] = useState<TodoFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setTitle('');
    setType('daily');
    setErrors({});
    setSubmitError(null);
    setSubmitting(false);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [handleClose, isOpen]);

  if (!isOpen) {
    return null;
  }

  const validate = (): TodoFieldErrors => {
    const nextErrors: TodoFieldErrors = {};

    if (!title.trim()) {
      nextErrors.title = 'Title is required.';
    } else if (title.trim().length < 3) {
      nextErrors.title = 'Title must be at least 3 characters.';
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
        title: title.trim(),
        type,
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to save todo right now.');
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    resetForm();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/45 pt-3 px-0 pb-0 sm:items-center sm:justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-todo-title"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-borderSubtle bg-bgPanel p-4"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 id="add-todo-title" className="text-lg font-bold text-textPrimary">
              Add Todo
            </h2>
            <p className="text-sm text-textMuted">Capture a task and organize it by frequency.</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="focus-ring touch-target inline-flex h-9 w-9 items-center justify-center rounded-xl text-textMuted hover:bg-white/10"
            aria-label="Close add todo form"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        <form className="space-y-3" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="todo-title" className="mb-1 block text-sm font-semibold text-textPrimary">
              Title
            </label>
            <input
              id="todo-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="focus-ring w-full rounded-xl border border-borderSubtle bg-bgBase px-3 py-2.5 text-base text-textPrimary"
              placeholder="e.g. Pay internet bill"
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? 'todo-title-error' : undefined}
              required
              autoFocus
            />
            {errors.title ? (
              <p id="todo-title-error" className="mt-1 text-xs text-danger">
                {errors.title}
              </p>
            ) : null}
          </div>

          <div>
            <p className="mb-1 block text-sm font-semibold text-textPrimary" id="todo-type-label">
              Type
            </p>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-labelledby="todo-type-label">
              {TODO_TYPES.map((item) => {
                const Icon = todoTypeMeta[item].icon;
                const selected = type === item;

                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setType(item)}
                    className={`focus-ring min-h-20 rounded-lg border px-2 py-2 text-center transition ${
                      selected
                        ? 'border-accent bg-accent/20 text-textPrimary'
                        : 'border-borderSubtle bg-bgBase text-textMuted hover:bg-white/5 hover:text-textPrimary'
                    }`}
                    role="radio"
                    aria-checked={selected}
                  >
                    <Icon aria-hidden="true" className="mx-auto h-4 w-4" />
                    <span className="mt-1 block text-xs font-bold">{todoTypeMeta[item].label}</span>
                    <span className="mt-0.5 block text-[10px] font-semibold opacity-75">{todoTypeMeta[item].helper}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {submitError ? <p className="text-sm text-danger">{submitError}</p> : null}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="focus-ring touch-target flex-1 rounded-xl border border-borderSubtle bg-transparent px-3 py-2.5 text-sm font-semibold text-textPrimary hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="focus-ring touch-target flex-1 rounded-xl bg-accent px-3 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Saving...' : 'Save Todo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

