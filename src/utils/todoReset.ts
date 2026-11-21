import type { Todo } from '../types';
import { toDate } from './format';

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDayTimestamp(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function getDailyCycleIndex(anchor: Date, value: Date): number {
  return Math.floor((startOfDayTimestamp(value) - startOfDayTimestamp(anchor)) / DAY_MS);
}

function getWeeklyCycleIndex(anchor: Date, value: Date): number {
  return Math.floor(getDailyCycleIndex(anchor, value) / 7);
}

function getMonthlyCycleIndex(anchor: Date, value: Date): number {
  return value.getFullYear() * 12 + value.getMonth() - (anchor.getFullYear() * 12 + anchor.getMonth());
}

function isCompletionInCurrentCycle(todo: Todo, now: Date): boolean {
  const anchor = toDate(todo.createdAt);
  const completedAt = todo.completedAt ? toDate(todo.completedAt) : anchor;

  if (todo.type === 'daily') {
    return getDailyCycleIndex(anchor, completedAt) === getDailyCycleIndex(anchor, now);
  }

  if (todo.type === 'weekly') {
    return getWeeklyCycleIndex(anchor, completedAt) === getWeeklyCycleIndex(anchor, now);
  }

  return getMonthlyCycleIndex(anchor, completedAt) === getMonthlyCycleIndex(anchor, now);
}

export function shouldResetTodoCompletion(todo: Todo, now: Date = new Date()): boolean {
  if (!todo.completed) {
    return false;
  }

  return !isCompletionInCurrentCycle(todo, now);
}

export function normalizeTodosForPeriodReset(todos: Todo[], now: Date = new Date()) {
  const todoIdsToReset: string[] = [];

  const normalizedTodos = todos.map((todo) => {
    if (!shouldResetTodoCompletion(todo, now)) {
      return todo;
    }

    todoIdsToReset.push(todo.id);

    return {
      ...todo,
      completed: false,
      completedAt: null,
    };
  });

  return {
    normalizedTodos,
    todoIdsToReset,
  };
}
