# SECURITY RULES & COMPLIANCE

## 1. Authentication & Session Security
- User sessions are managed via Supabase Auth with secure JWT storage in browser local storage.
- Auto-refresh tokens handled securely by `@supabase/supabase-js`.
- Always verify active user session before granting access to protected views (`home`, `chat`, `profile`, `search`).

## 2. Row Level Security (RLS) Rules
- **Direct Messages (`messages` table):**
  - Read access is strictly restricted to sender or receiver.
  - Insert access is restricted to sender matching `auth.uid()`.
  - Update access (for marking `is_read`) is restricted to receiver matching `auth.uid()`.
- **User Profiles (`profiles` table):**
  - Update access is restricted to owner matching `auth.uid()`.
  - Sensitive fields (such as user email) must NEVER be exposed in public directory queries.

## 3. Privacy & Anti-Scraping Safeguards
- **Chatted-Only Search Scope:** Public user directories are never queried or dumped en masse.
- **Exact-Match Querying:** Un-chatted users can only be discovered and messaged by explicitly entering their exact unique `@username`.
- **No Wildcard Auto-Suggestions:** Search inputs do not execute broad wildcard queries across un-chatted users.

## 4. Environment & Secrets Management
- No backend secrets or service-role keys in client source code.
- Only the Supabase anonymous key (`supabaseAnonKey`) is utilized on the client side, relying strictly on Postgres RLS for access control.
