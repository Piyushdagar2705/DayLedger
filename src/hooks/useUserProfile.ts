import { useEffect, useState } from 'react';
import { getUser, getUserProfileErrorMessage } from '../services/userService';
import type { User } from '../types';

const PROFILE_LOAD_TIMEOUT_MS = 12000;

function getErrorMessage(error: unknown): string {
  return getUserProfileErrorMessage(error);
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => {
        reject(new Error('Profile loading took too long. Check your Firestore setup and browser network access.'));
      }, timeoutMs);
    }),
  ]);
}

export function useUserProfile(userId: string | null | undefined) {
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let isActive = true;

    const loadProfile = async () => {
      try {
        const user = await withTimeout(getUser(userId), PROFILE_LOAD_TIMEOUT_MS);
        if (!isActive) {
          return;
        }

        setProfile(user);
      } catch (serviceError) {
        if (!isActive) {
          return;
        }

        setError(getErrorMessage(serviceError));
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      isActive = false;
    };
  }, [userId]);

  return {
    profile,
    loading,
    error,
  };
}
