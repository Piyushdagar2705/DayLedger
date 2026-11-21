import { useCallback, useEffect, useMemo, useState } from 'react';
import { addTodo, deleteTodo, subscribeToTodos, toggleTodo, updateTodoTitle } from '../services/todoService';
import type { Todo, TodoInput, TodoType } from '../types';
import { normalizeTodosForPeriodReset } from '../utils/todoReset';

interface UseTodosOptions {
  subscribe?: boolean;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong while processing todos.';
}

export function useTodos(userId: string | null | undefined, options: UseTodosOptions = {}) {
  const { subscribe = true } = options;
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<TodoType>('daily');

  useEffect(() => {
    if (!userId) {
      const timeoutId = window.setTimeout(() => {
        setTodos([]);
        setLoading(false);
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }

    if (!subscribe) {
      const timeoutId = window.setTimeout(() => {
        setLoading(false);
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }

    let unsubscribe: (() => void) | undefined;
    const timeoutId = window.setTimeout(() => {
      setLoading(true);
      setError(null);

      unsubscribe = subscribeToTodos(
        userId,
        (todoList) => {
          const { normalizedTodos, todoIdsToReset } = normalizeTodosForPeriodReset(todoList);

          setTodos(normalizedTodos);

          if (todoIdsToReset.length > 0) {
            void Promise.allSettled(todoIdsToReset.map((todoId) => toggleTodo(todoId, false)));
          }

          setLoading(false);
        },
        (serviceError) => {
          setError(getErrorMessage(serviceError));
          setLoading(false);
        },
      );
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      unsubscribe?.();
    };
  }, [userId, subscribe]);

  const filteredTodos = useMemo(() => {
    return todos.filter((todo) => todo.type === activeType);
  }, [todos, activeType]);

  const addNewTodo = useCallback(
    async (input: TodoInput) => {
      if (!userId) {
        throw new Error('You must be logged in to add a todo.');
      }

      try {
        await addTodo(userId, input);
      } catch (serviceError) {
        const message = getErrorMessage(serviceError);
        setError(message);
        throw new Error(message);
      }
    },
    [userId],
  );

  const toggleTodoCompletion = useCallback(
    async (todoId: string, completed: boolean) => {
      const previousTodos = todos;
      const target = previousTodos.find((todo) => todo.id === todoId);

      if (!target) {
        return;
      }

      setTodos((previous) =>
        previous.map((todo) => (todo.id === todoId ? { ...todo, completed } : todo)),
      );

      try {
        await toggleTodo(todoId, completed);
      } catch (serviceError) {
        setTodos(previousTodos);

        const message = getErrorMessage(serviceError);
        setError(message);
        throw new Error(message);
      }
    },
    [todos],
  );

  const removeTodo = useCallback(
    async (todoId: string) => {
      const previousTodos = todos;

      setTodos((previous) => previous.filter((todo) => todo.id !== todoId));

      try {
        await deleteTodo(todoId);
      } catch (serviceError) {
        setTodos(previousTodos);

        const message = getErrorMessage(serviceError);
        setError(message);
        throw new Error(message);
      }
    },
    [todos],
  );

  const renameTodo = useCallback(
    async (todoId: string, title: string) => {
      const nextTitle = title.trim();
      const previousTodos = todos;

      setTodos((previous) =>
        previous.map((todo) => (todo.id === todoId ? { ...todo, title: nextTitle } : todo)),
      );

      try {
        await updateTodoTitle(todoId, nextTitle);
      } catch (serviceError) {
        setTodos(previousTodos);

        const message = getErrorMessage(serviceError);
        setError(message);
        throw new Error(message);
      }
    },
    [todos],
  );

  return {
    todos,
    filteredTodos,
    activeType,
    setActiveType,
    loading,
    error,
    addNewTodo,
    toggleTodoCompletion,
    removeTodo,
    renameTodo,
  };
}
