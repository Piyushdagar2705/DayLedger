import type { FirebaseError } from 'firebase/app';
import { doc, getDocFromServer, onSnapshot, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { User, UserInput } from '../types';

const USERS_COLLECTION = 'Users';

function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.toLowerCase();
  }

  return '';
}

export function classifyUserProfileError(error: unknown): 'missing-database' | 'blocked-client' | 'unknown' {
  const firebaseError = error as FirebaseError | undefined;
  const message = normalizeErrorMessage(error);
  const code = firebaseError?.code;

  const missingDatabaseByCode =
    code === 'failed-precondition' &&
    (message.includes('database (default) does not exist') ||
      (message.includes('database') && message.includes('does not exist')));

  if (missingDatabaseByCode) {
    return 'missing-database';
  }

  if (message.includes('err_blocked_by_client') || message.includes('blocked_by_client')) {
    return 'blocked-client';
  }

  return 'unknown';
}

export function getUserProfileErrorMessage(error: unknown): string {
  const category = classifyUserProfileError(error);

  if (category === 'missing-database') {
    return 'Firestore database is not created yet for this Firebase project. Open Firebase Console > Firestore Database > Create database, then retry.';
  }

  if (category === 'blocked-client') {
    return 'Browser blocked Firestore network calls (ERR_BLOCKED_BY_CLIENT). Disable ad blockers/privacy shields for localhost and retry.';
  }

  return error instanceof Error ? error.message : 'Unable to load user profile right now.';
}

export async function getUser(uid: string): Promise<User | null> {
  const userRef = doc(db, USERS_COLLECTION, uid);

  try {
    // Avoid snapshot-listener transport for profile reads to reduce listen-channel retries
    // in environments where browser privacy tooling blocks Firestore watch endpoints.
    const snapshot = await getDocFromServer(userRef);

    if (!snapshot.exists()) {
      return null;
    }

    return snapshot.data() as User;
  } catch (error) {
    const firebaseError = error as FirebaseError | undefined;

    // Backward-compatible fallback for projects still using stricter legacy rules
    // where reading a missing user profile can return permission-denied.
    if (firebaseError?.code === 'permission-denied') {
      return null;
    }

    throw error;
  }
}

export async function createUser(input: UserInput): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, input.userId);

  await setDoc(userRef, {
    ...input,
    createdAt: Timestamp.now(),
  });
}

export function subscribeToUser(
  uid: string,
  onData: (user: User | null) => void,
  onError?: (error: Error) => void,
): () => void {
  const userRef = doc(db, USERS_COLLECTION, uid);

  return onSnapshot(
    userRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(null);
        return;
      }

      onData(snapshot.data() as User);
    },
    (error) => {
      onError?.(error);
    },
  );
}
