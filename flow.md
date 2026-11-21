# flow.md - Expense & Todo Tracker PWA

## Phase 1: Project Initialization & Core Setup
1. **Scaffold Project:**
   - Initialize a Vite React project (TypeScript recommended for strict schema enforcement with the AI agent).
   - Install dependencies: `react-router-dom`, `firebase`, `vite-plugin-pwa`, `date-fns` (for reliable date/time logic), `lucide-react` (for structural icons).
2. **Environment & Firebase Configuration:**
   - Setup `.env` for Firebase config.
   - Initialize Firebase App, Auth, and Firestore in `src/config/firebase.ts`.
   - **Crucial Addition:** Enable Firestore offline persistence (`enableMultiTabIndexedDbPersistence`) to ensure the PWA functions seamlessly offline.
3. **PWA Configuration:**
   - Configure `vite-plugin-pwa` in `vite.config.ts`.
   - Set up `manifest.json` generation (name, short_name, icons, theme_color, background_color).
   - Configure basic service worker for caching static assets.

## Phase 2: Data Models & Security (Agent Context)
1. **TypeScript Interfaces / Prop Validation:**
   - Define strict models mirroring the required Firestore Data Structure:
     - `User`: `userId`, `name`, `email`, `monthlyBudget`, `createdAt`.
     - `Expense`: `id`, `userId`, `amount`, `category`, `date` (Timestamp), `note`, `createdAt`.
     - `Todo`: `id`, `userId`, `title`, `type` ('daily' | 'weekly' | 'monthly'), `completed`, `createdAt`.
2. **Firebase Security Rules (to be deployed):**
   - Write Firestore rules ensuring `read`/`write` access is strictly limited to `request.auth.uid == resource.data.userId`.

## Phase 3: Authentication & State Management
1. **Auth Context (`AuthContext.tsx`):**
   - Implement Google Sign-In via Firebase.
   - Track `currentUser` state.
   - Handle loading states during auth initialization.
2. **First Login / Onboarding Flow:**
   - Logic: Upon successful authentication, query the `Users` collection.
   - If user exists, proceed to Dashboard.
   - If user does NOT exist, route to a setup screen to input `monthlyBudget`.
   - Save the new `User` document to Firestore.

## Phase 4: App Shell & Routing Structure
1. **Protected Routes:**
   - Wrap core app routes in a `<ProtectedRoute>` component that redirects unauthenticated users to the Login view.
2. **Layout Architecture (`MainLayout.tsx`):**
   - Define a fixed App Shell.
   - Provide an injection point for the **Bottom Navigation Bar** (4 tabs: Home/Dashboard, Expenses, Todos, Profile/Settings).
   - Provide an injection point for the **Floating Action Button (FAB)**. The FAB should trigger a contextual modal or action sheet based on the current active route (e.g., "+ Expense" on Expenses tab, "+ Todo" on Todos tab).

## Phase 5: Feature Implementation - Dashboard (Home)
1. **Data Aggregation Hooks:**
   - Fetch current month's expenses. Calculate `Total Spent` and `Remaining Budget`.
   - Fetch today's incomplete Todos.
   - Fetch the 5 most recent expenses.
2. **Reminder System Logic (7 PM Check):**
   - Create a hook `useEveningReminder()`.
   - Logic: 
     - Check current system time. If `time >= 19:00` (7 PM).
     - Query `Expenses` for `date == today` and `userId == currentUser.uid`.
     - Output state: `hasLoggedToday` (boolean).
   - Render Injection: Place a dynamic banner component at the top of the Dashboard. Display "You haven’t logged today’s expenses" or "Great! You tracked your expenses today" based on the state.
3. **Optional Enhancement Prep:**
   - Calculate `(Total Spent / Monthly Budget) * 100`. Expose a boolean `isBudgetWarning` if $> 80\%$.

## Phase 6: Feature Implementation - Expenses
1. **Data Layer:**
   - Hook for CRUD operations on `Expenses` collection.
2. **Structure:**
   - **Form Injection:** Provide fields for Amount (number, required), Category (select: Food, Travel, Rent, Other), Date (date picker, default today), Note (text, optional).
   - **List View:** Render expenses sorted by `date` descending.
   - **Filter Logic:** Implement state toggles to filter the list view by `Category` and a date range (Month/Week/Day).

## Phase 7: Feature Implementation - Todos
1. **Data Layer:**
   - Hook for CRUD operations on `Todos` collection.
2. **Structure:**
   - **Form Injection:** Provide fields for Title (text, required), Type (select: Daily, Weekly, Monthly).
   - **Tab Navigation:** Implement horizontal tabs to switch between Daily, Weekly, and Monthly views.
   - **List View:** Render tasks based on the active tab. Include a toggle action to flip the `completed` boolean, and a delete action.

## Phase 8: Final Integration & Deployment Prep
1. **Global Error Handling & Loading States:**
   - Implement generic loading skeletons or spinners for data-fetching phases.
   - Add toast notifications for successful actions (e.g., "Expense added", "Task completed") and error states.
2. **Vercel Deployment:**
   - Ensure `vercel.json` is configured for client-side routing (rewriting all traffic to `index.html`).
   - Agent instruction: Document required environment variables for the deployment environment.