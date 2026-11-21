import { collection, deleteDoc, doc, onSnapshot, query, setDoc, Timestamp, updateDoc, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Todo, TodoInput } from '../types';
import { toDate } from '../utils/format';

const TODOS_COLLECTION = 'Todos';

const todoCollectionRef = collection(db, TODOS_COLLECTION);

function mapTodo(id: string, data: Omit<Todo, 'id'>): Todo {
  return {
    id,
    ...data,
  };
}

function sortByCreatedAtDesc(a: Todo, b: Todo): number {
  return toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime();
}

export async function addTodo(userId: string, data: TodoInput): Promise<string> {
  const docRef = doc(todoCollectionRef);

  await setDoc(docRef, {
    id: docRef.id,
    userId,
    title: data.title.trim(),
    type: data.type,
    completed: false,
    completedAt: null,
    createdAt: Timestamp.now(),
  });

  return docRef.id;
}

export function subscribeToTodos(
  userId: string,
  onData: (todos: Todo[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const scopedQuery = query(todoCollectionRef, where('userId', '==', userId));

  return onSnapshot(
    scopedQuery,
    (snapshot) => {
      const todos = snapshot.docs
        .map((item) => mapTodo(item.id, item.data() as Omit<Todo, 'id'>))
        .sort(sortByCreatedAtDesc);

      onData(todos);
    },
    (error) => {
      onError?.(error);
    },
  );
}

export async function toggleTodo(todoId: string, completed: boolean): Promise<void> {
  await updateDoc(doc(db, TODOS_COLLECTION, todoId), {
    completed,
    completedAt: completed ? Timestamp.now() : null,
  });
}

export async function updateTodoTitle(todoId: string, title: string): Promise<void> {
  await updateDoc(doc(db, TODOS_COLLECTION, todoId), {
    title: title.trim(),
  });
}

export async function deleteTodo(todoId: string): Promise<void> {
  await deleteDoc(doc(db, TODOS_COLLECTION, todoId));
}
