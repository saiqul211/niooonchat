# Feature Specification: User Profile

## 1. Purpose
Displays the authenticated user's credentials, account status, connection details, and account termination / sign out controls.

## 2. User Flow
1. User navigates to `#/profile`.
2. View fetches active user profile from `profiles` table.
3. Shows Full Name, `@username`, private Email Address, and Member Since timestamp.
4. Provides a prominent Sign Out button that invalidates the session and redirects to `#/welcome`.

## 3. UI Components
- `ProfileScreen.tsx`

## 4. Database Dependencies
- `profiles` table (queried with `auth.uid()`)
- Supabase Auth session
