# Feature Specification: Search & Contact Discovery

## 1. Purpose
Provides privacy-first contact lookup and chatted partner filtering with zero unsolicited public directory exposures.

## 2. Key Behaviors
1. **Chatted Contacts Filter:** The search screen lists only users with whom the current user has already exchanged messages. Typing in the search input filters this private list.
2. **Exact Username Direct Navigation:** To chat with a new user, the current user types their exact `@username` and clicks **Chat** (or presses Enter).
3. **Automatic Navigation:** Upon finding an exact matching user profile in Supabase, the app immediately transitions to `#/chat?user=:username`.
4. **No Auto-Suggestions:** The app never suggests or browses general public users while typing.

## 3. UI Components
- `SearchScreen.tsx`

## 4. Database Dependencies
- `messages` table (to extract unique chatted partner IDs)
- `profiles` table (to fetch metadata and verify exact username queries)
