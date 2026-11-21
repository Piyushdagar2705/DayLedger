import { collection, deleteDoc, doc, getDocs, onSnapshot, query, setDoc, Timestamp, where } from 'firebase/firestore';
import { endOfDay, startOfDay } from 'date-fns';
import { db } from '../config/firebase';
import type { Expense, ExpenseInput } from '../types';
import { toDate } from '../utils/format';

const EXPENSES_COLLECTION = 'Expenses';

const expenseCollectionRef = collection(db, EXPENSES_COLLECTION);

function mapExpense(id: string, data: Omit<Expense, 'id'>): Expense {
  return {
    id,
    ...data,
    note: data.note ?? '',
  };
}

function sortByExpenseDateDesc(a: Expense, b: Expense): number {
  return toDate(b.date).getTime() - toDate(a.date).getTime();
}

export async function addExpense(userId: string, data: ExpenseInput): Promise<string> {
  const docRef = doc(expenseCollectionRef);

  await setDoc(docRef, {
    id: docRef.id,
    userId,
    amount: data.amount,
    category: data.category,
    date: Timestamp.fromDate(data.date),
    note: data.note?.trim() ?? '',
    createdAt: Timestamp.now(),
  });

  return docRef.id;
}

export function subscribeToExpenses(
  userId: string,
  onData: (expenses: Expense[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const scopedQuery = query(expenseCollectionRef, where('userId', '==', userId));

  return onSnapshot(
    scopedQuery,
    (snapshot) => {
      const expenses = snapshot.docs
        .map((item) => mapExpense(item.id, item.data() as Omit<Expense, 'id'>))
        .sort(sortByExpenseDateDesc);

      onData(expenses);
    },
    (error) => {
      onError?.(error);
    },
  );
}

export async function deleteExpense(expenseId: string): Promise<void> {
  await deleteDoc(doc(db, EXPENSES_COLLECTION, expenseId));
}

export async function getTodayExpenses(userId: string, today: Date = new Date()): Promise<Expense[]> {
  const scopedQuery = query(expenseCollectionRef, where('userId', '==', userId));
  const snapshot = await getDocs(scopedQuery);
  const start = startOfDay(today).getTime();
  const end = endOfDay(today).getTime();

  return snapshot.docs
    .map((item) => mapExpense(item.id, item.data() as Omit<Expense, 'id'>))
    .filter((expense) => {
      const current = toDate(expense.date).getTime();
      return current >= start && current <= end;
    })
    .sort(sortByExpenseDateDesc);
}
