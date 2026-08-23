# Feature Specification: Authentication

## 1. Purpose
Provides secure account creation, user login, persistent session management, and logout using Supabase Auth.

## 2. User Flow
1. Visitor lands on `#/welcome` (or `#/`).
2. Can choose **Log In** (`#/login`) or **Create New Account** (`#/signup`).
3. Signup requires Full Name, unique Username, Email, and Password.
4. On success, profile record is validated and user is routed to `#/home`.
5. Session is stored in local storage and refreshed automatically.
6. Logout button in `#/profile` clears session and redirects to `#/welcome`.

## 3. UI Components
- `WelcomeScreen.tsx`
- `LoginScreen.tsx`
- `SignupScreen.tsx`

## 4. Backend & Database Dependencies
- Supabase Auth Service
- `profiles` table in PostgreSQL

## 5. Security & Validation
- Username is sanitized and converted to lowercase alphanumeric characters.
- Password minimum length validated before submission.
- Client catches and displays localized English error messages.
