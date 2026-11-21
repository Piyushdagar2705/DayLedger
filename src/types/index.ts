import { Timestamp } from 'firebase/firestore';

export type Category = 'Food' | 'Travel' | 'Rent' | 'Other';
export const CATEGORIES: Category[] = ['Food', 'Travel', 'Rent', 'Other'];

export type TodoType = 'daily' | 'weekly' | 'monthly';
export const TODO_TYPES: TodoType[] = ['daily', 'weekly', 'monthly'];

export interface User {
  userId: string;
  name: string;
  email: string;
  monthlyBudget: number;
  createdAt: Timestamp;
}

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  category: Category;
  date: Timestamp;
  note?: string;
  createdAt: Timestamp;
}

export interface Todo {
  id: string;
  userId: string;
  title: string;
  type: TodoType;
  completed: boolean;
  completedAt?: Timestamp | null;
  createdAt: Timestamp;
}

export interface UserInput {
  userId: string;
  name: string;
  email: string;
  monthlyBudget: number;
}

export type ExpenseInput = Pick<Expense, 'amount' | 'category' | 'note'> & {
  date: Date;
};

export type TodoInput = Pick<Todo, 'title' | 'type'>;

export type ExpenseDateFilter = 'all' | 'day' | 'week' | 'month';
