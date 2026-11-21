# Product Requirements Document (PRD)
**Product Name:** Expense & Todo Tracker (PWA)
**Platform:** Web (Mobile-First Progressive Web App)

## 1. Product Overview
A personal, mobile-first productivity application that combines expense tracking and task management. The app is designed for speed, offline capability, and minimal friction, utilizing a strictly isolated user data model.

## 2. Technology Stack
* **Frontend Environment:** React (via Vite)
* **Styling:** Tailwind CSS (Strictly mobile-first approach)
* **Backend & Database:** Firebase Authentication, Cloud Firestore
* **PWA Integration:** `vite-plugin-pwa`
* **Deployment Environment:** Vercel

## 3. Core Features & Functional Requirements

### 3.1 Authentication & User Initialization
* **Method:** Google Sign-In exclusive (via Firebase Authentication).
* **Data Isolation:** All read/write operations must be strictly scoped to the authenticated user's ID.
* **Onboarding:** On initial login, the system must prompt the user to input a "Monthly Budget". This value is saved to the user's profile in Firestore.

### 3.2 Dashboard
The primary aggregation view displaying:
* Total spent in the current month.
* Remaining monthly budget.
* List of the 5 most recent expenses.
* List of today's pending Todo tasks.
* *Constraint:* Simple visual summaries only; no complex charting libraries in the core build.

### 3.3 Expense Management
* **Data Entry Fields:**
    * Amount (Required)
    * Category (Required, limited to: Food, Travel, Rent, Other)
    * Date (Defaults to current date)
    * Note (Optional text string)
* **Viewing & Operations:**
    * List all expenses ordered chronologically (latest first).
    * Filter functionality by Category and Date.
    * Calculate and display Total Expenses (Daily and Monthly aggregations).

### 3.4 Todo Management
* **Data Entry Fields:**
    * Title (Required)
    * Type (Required, limited to: Daily, Weekly, Monthly)
* **Viewing & Operations:**
    * Display tasks separated by Type tabs (Daily / Weekly / Monthly).
    * Toggle task completion status.
    * Delete task functionality.

### 3.5 Behavior-Based Reminder System
* **Trigger:** User opens/focuses the application.
* **Condition:** Current local time is >= 7:00 PM.
* **Logic:**
    * Query the database to check if any expense exists for the current date.
    * If `false`: Display banner/popup stating "You haven’t logged today’s expenses".
    * If `true`: Display banner/popup stating "Great! You tracked your expenses today".
* *Constraint:* Do not implement system-level push notifications. This is strictly an in-app check.

### 3.6 Navigation & Core Interactions
* **Bottom Navigation:** Must contain exactly 4 routing tabs:
    1. Home
    2. Expenses
    3. Todos
    4. Dashboard
* **Global Action:** A floating Action Button (FAB) configured with a "+" icon for quick data entry.

## 4. Progressive Web App (PWA) Requirements
* **Manifest:** Valid `manifest.json` including app name, icons, and theme configuration.
* **Installability:** Must trigger the native browser install prompt.
* **Offline Support:** Basic caching of static assets to allow the app shell to load without a network connection.

## 5. Data Architecture (Firestore Schema)

### Collection: `Users`
* `userId` (String, Primary Key)
* `name` (String)
* `email` (String)
* `monthlyBudget` (Number)
* `createdAt` (Timestamp)

### Collection: `Expenses`
* `id` (String, Primary Key)
* `userId` (String, Foreign Key)
* `amount` (Number)
* `category` (String)
* `date` (Timestamp)
* `note` (String)
* `createdAt` (Timestamp)

### Collection: `Todos`
* `id` (String, Primary Key)
* `userId` (String, Foreign Key)
* `title` (String)
* `type` (String: 'daily' | 'weekly' | 'monthly')
* `completed` (Boolean)
* `createdAt` (Timestamp)

## 6. Non-Functional Requirements
* **Architecture:** Component-based structure utilizing React Hooks for state management.
* **Modularity:** Clean, reusable code blocks with basic error handling (try/catch blocks, user feedback on failure).
* **Environment Configuration:** Firebase credentials securely managed via `.env` files and injected during the Vercel build process.

## 7. Phase 2 / Optional Enhancements
*(To be addressed only after Section 1-6 are fully functional)*
* Implementation of charting libraries for expense visualization.
* Dynamic budget warning indicator triggered when current monthly expenses exceed 80% of `monthlyBudget`.
* System-aware or user-toggled Dark Mode integration.