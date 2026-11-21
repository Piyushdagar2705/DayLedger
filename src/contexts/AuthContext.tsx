import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  type Auth,
  type ApplicationVerifier,
  browserLocalPersistence,
  type ConfirmationResult,
  createUserWithEmailAndPassword,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  setPersistence,
  signInWithPhoneNumber,
  signInWithRedirect,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { auth, firebaseConfigError, googleProvider } from '../config/firebase';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  loading: boolean;
  configError: string | null;
  authFlowError: string | null;
  loginWithGoogle: () => Promise<'popup' | 'redirect'>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  registerWithEmail: (email: string, password: string) => Promise<void>;
  loginWithPhone: (phoneNumber: string, verifier: ApplicationVerifier) => Promise<ConfirmationResult>;
  confirmPhoneCode: (confirmation: ConfirmationResult, code: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

let redirectResolutionPromise: Promise<{ user: FirebaseUser | null; error: string | null }> | null = null;

function mapAuthFlowError(error: unknown): string {
  const code = typeof error === 'object' && error && 'code' in error ? (error as { code?: string }).code : undefined;

  switch (code) {
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for Firebase auth. Add localhost in Firebase Console > Authentication > Settings > Authorized domains.';
    case 'auth/configuration-not-found':
      return 'Firebase Authentication configuration was not found. Ensure Google provider is enabled in Firebase Console.';
    case 'auth/operation-not-allowed':
      return 'Google sign-in is disabled. Enable it in Firebase Console > Authentication > Sign-in method.';
    case 'auth/network-request-failed':
      return 'Network request failed. A browser extension or privacy shield is likely blocking Firebase/Google endpoints.';
    default:
      return error instanceof Error ? error.message : 'Unable to complete authentication flow. Please retry.';
  }
}

function shouldFallbackToRedirect(error: unknown): boolean {
  const code = typeof error === 'object' && error && 'code' in error ? (error as { code?: string }).code : undefined;

  return (
    code === 'auth/popup-blocked' ||
    code === 'auth/popup-closed-by-user' ||
    code === 'auth/cancelled-popup-request' ||
    code === 'auth/operation-not-supported-in-this-environment'
  );
}

function resolveRedirectOnce(firebaseAuth: Auth): Promise<{ user: FirebaseUser | null; error: string | null }> {
  if (!redirectResolutionPromise) {
    redirectResolutionPromise = (async () => {
      try {
        const redirectResult = await getRedirectResult(firebaseAuth);
        return { user: redirectResult?.user ?? null, error: null };
      } catch (error) {
        console.error('Error resolving redirect sign-in result:', error);
        return {
          user: null,
          error: mapAuthFlowError(error),
        };
      }
    })();
  }

  return redirectResolutionPromise;
}

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authFlowError, setAuthFlowError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const firebaseAuth = auth;

    let isActive = true;
    const finishInitialization = () => {
      if (isActive) {
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      if (!isActive) {
        return;
      }

      setCurrentUser(user);
      finishInitialization();
    });

    void resolveRedirectOnce(firebaseAuth).then(({ user, error }) => {
      if (!isActive) {
        return;
      }

      if (error) {
        setAuthFlowError(error);
      }

      if (user) {
        setCurrentUser(user);
        setAuthFlowError(null);
      }

      finishInitialization();
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, []);

  const loginWithEmail = async (email: string, password: string) => {
    if (!auth) {
      throw new Error(firebaseConfigError ?? 'Firebase auth is not configured.');
    }

    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error logging in with email/password:', error);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    if (!auth || !googleProvider) {
      throw new Error(firebaseConfigError ?? 'Firebase auth is not configured.');
    }

    setAuthFlowError(null);

    googleProvider.setCustomParameters({
      prompt: 'select_account',
    });

    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithPopup(auth, googleProvider);
      return 'popup' as const;
    } catch (error) {
      if (!shouldFallbackToRedirect(error)) {
        console.error('Error logging in with Google popup:', error);
        throw error;
      }

      try {
        await signInWithRedirect(auth, googleProvider);
        return 'redirect' as const;
      } catch (redirectError) {
        console.error('Error logging in with Google redirect fallback:', redirectError);
        throw redirectError;
      }
    }
  };

  const loginWithPhone = async (phoneNumber: string, verifier: ApplicationVerifier) => {
    if (!auth) {
      throw new Error(firebaseConfigError ?? 'Firebase auth is not configured.');
    }

    try {
      await setPersistence(auth, browserLocalPersistence);
      return await signInWithPhoneNumber(auth, phoneNumber, verifier);
    } catch (error) {
      console.error('Error logging in with phone number:', error);
      throw error;
    }
  };

  const confirmPhoneCode = async (confirmation: ConfirmationResult, code: string) => {
    try {
      await confirmation.confirm(code);
    } catch (error) {
      console.error('Error confirming phone verification code:', error);
      throw error;
    }
  };

  const registerWithEmail = async (email: string, password: string) => {
    if (!auth) {
      throw new Error(firebaseConfigError ?? 'Firebase auth is not configured.');
    }

    try {
      await setPersistence(auth, browserLocalPersistence);
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error registering with email/password:', error);
      throw error;
    }
  };

  const logout = async () => {
    if (!auth) {
      throw new Error(firebaseConfigError ?? 'Firebase auth is not configured.');
    }

    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    loading,
    configError: firebaseConfigError,
    authFlowError,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    loginWithPhone,
    confirmPhoneCode,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
