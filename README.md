# DayLedger

A mobile-first Progressive Web App (PWA) for personal finance and daily productivity. Built with React, TypeScript, and Firebase, DayLedger brings together real-time expense tracking, budget analytics, daily-resetting task management, and rich-text notes in one place.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React, Vite, TypeScript, Tailwind CSS |
| **Rich Text** | Tiptap Editor |
| **Authentication** | Firebase Authentication (Google Sign-In, Email/Password, optional Phone OTP) |
| **Database** | Cloud Firestore (with offline persistence) |
| **PWA** | `vite-plugin-pwa` (Workbox `generateSW`) |
| **Deployment** | Vercel |

---

## Features

### Authentication & Onboarding
* **Multiple Sign-In Options:** Google Sign-In, Email/Password, and optional Phone OTP via Firebase Auth.
* **First-Login Onboarding:** Guided setup to configure your monthly budget.
* **Protected Routes:** User-scoped data access pattern ensuring private, secure data per account.

### Expense Tracking & Dashboard
* **Expense CRUD:** Add, list, and delete expenses with category and date-based filtering.
* **Analytics Dashboard:** Real-time aggregation showing total spent, remaining balance, budget usage percentage, and category-wise breakdown.
* **Evening Reminder:** Automated 7:00 PM reminder banner triggered if no expenses have been logged for the day.

### Daily Productivity & Notes
* **Todo CRUD:** Add, list by type, toggle completion, and delete tasks with daily reset support.
* **Rich-Text Editor:** Integrated Tiptap editor for formatting notes and descriptions.
* **Context-Aware FAB:** Floating action button that adapts to the active view for quick **Add Expense** and **Add Todo** modals.

### UI, UX & Offline Support
* **Mobile-First Navigation:** Bottom navigation bar with 4 tabs — **Home**, **Expenses**, **Todos**, and **Dashboard**.
* **Real-Time & Offline Ready:** Live Firestore listeners with offline persistence enabled.
* **Polished States:** Toast notifications, loading skeletons, and accessible touch/focus states.
* **Installable PWA:** Includes web manifest and service worker (`generateSW`) with PWA icons.

---

## Local Setup

### Prerequisites
* Node.js (v18 or higher)
* npm
* A Firebase project with **Authentication** and **Cloud Firestore** enabled

### Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Piyushdagar2705/DayLedger.git
   cd DayLedger
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create your local environment file:**
   ```bash
   cp .env.example .env
   ```

4. **Add your Firebase credentials:**
   Fill in the `.env` values using your Firebase project configuration (from **Firebase Console → Project Settings → Your Apps → Web App**).

5. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open the local URL shown in your terminal (default: `http://localhost:5173`).

6. **Build for production:**
   ```bash
   npm run build
   ```

---

## Environment Variables

See `.env.example` for all required Firebase values:

* `VITE_FIREBASE_API_KEY`
* `VITE_FIREBASE_AUTH_DOMAIN`
* `VITE_FIREBASE_PROJECT_ID`
* `VITE_FIREBASE_STORAGE_BUCKET`
* `VITE_FIREBASE_MESSAGING_SENDER_ID`
* `VITE_FIREBASE_APP_ID`

---

## Manual Steps Required

* Provide real Firebase credentials in `.env` (local) and Vercel project settings (production).
* Replace placeholder PWA icons in `public/icons/icon-192.png` and `public/icons/icon-512.png` with custom brand assets before launch.
* Deploy `firestore.rules` manually via Firebase CLI or the Firebase Console (**Firestore Database → Rules**).

---

## Deployment Notes (Vercel)

* `vercel.json` is pre-configured with rewrite rules for SPA client-side routing.
* Configure all six `VITE_FIREBASE_*` environment variables in your Vercel project settings before deploying.

---

## Author

**Piyush Dagar**
* GitHub: [@Piyushdagar2705](https://github.com/Piyushdagar2705)
* LinkedIn: [piyushdagar2705](https://www.linkedin.com/in/piyushdagar2705)