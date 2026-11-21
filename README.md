# Expense & Todo Tracker (PWA)

Mobile-first React + TypeScript + Firebase progressive web app for personal expense tracking and todo management.

## Stack

- React + Vite + TypeScript
- Firebase Authentication (Google Sign-In)
- Cloud Firestore (with offline persistence)
- Tailwind CSS
- vite-plugin-pwa
- Vercel deployment target

## Features Implemented

- Authentication flow with Google, email/password, and optional phone OTP
- First-login onboarding for monthly budget
- Protected routes
- Home, Expenses, Todos, Dashboard views
- Bottom navigation with 4 tabs: Home, Expenses, Todos, Dashboard
- Context-aware FAB with Add Expense / Add Todo modals
- Expense CRUD (add, list, delete) with category/date filtering
- Todo CRUD (add, list by type, toggle complete, delete)
- 7 PM evening reminder banner based on whether today has expenses
- Dashboard aggregation: spent, remaining, budget usage, category breakdown
- Realtime Firestore listeners and user-scoped data access pattern
- Toast notifications, loading skeletons, accessible touch/focus states
- PWA manifest + service worker (`generateSW`) with placeholder icons

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create your local env file:

```bash
cp .env.example .env
```

3. Fill the `.env` values using your Firebase project config.

4. Start the dev server:

```bash
npm run dev
```

5. Build for production:

```bash
npm run build
```

## Environment Variables

See `.env.example` for all required Firebase values:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## Manual Steps Required

- Provide real Firebase credentials in `.env` (local) and Vercel project settings (production).
- Replace placeholder PWA icons in `public/icons/icon-192.png` and `public/icons/icon-512.png` with brand assets before launch.
- Deploy `firestore.rules` manually via Firebase CLI or Firebase Console.

## Deployment Notes

- `vercel.json` includes rewrite rules for SPA client-side routing.
- Configure all `VITE_FIREBASE_*` env vars in Vercel before deploy.
