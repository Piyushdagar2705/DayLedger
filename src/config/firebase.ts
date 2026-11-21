import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const hasLikelyValidApiKey =
  typeof firebaseConfig.apiKey === 'string' &&
  firebaseConfig.apiKey.trim().length > 0 &&
  !firebaseConfig.apiKey.includes('your_');

export const firebaseConfigError = hasLikelyValidApiKey
  ? null
  : 'Firebase web config is missing or invalid. Update VITE_FIREBASE_* values in .env using the Firebase Web app config.';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = hasLikelyValidApiKey ? getAuth(app) : null;
export const db = getFirestore(app);

// Google Auth Provider
export const googleProvider = hasLikelyValidApiKey ? new GoogleAuthProvider() : null;

// Enable offline persistence for PWA constraints
try {
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Offline persistence can be enabled in only one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.warn('Offline persistence is not supported by this browser.');
    }
  });
} catch (error) {
  console.error('Error enabling offline persistence:', error);
}
