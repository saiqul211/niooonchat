# ARCHITECTURE DOCUMENTATION

## 1. System Architecture Diagram

```
+-------------------------------------------------------------+
|                     Client Application                      |
|  +-------------------------------------------------------+  |
|  |           React 19 + TypeScript + Vite                |  |
|  |  +----------------+  +----------------+  +---------+  |  |
|  |  |  Hash Router   |  |   Navigation   |  | Lucide  |  |  |
|  |  +----------------+  +----------------+  +---------+  |  |
|  |  +-------------------------------------------------+  |  |
|  |  | UI Screens: Welcome | Home | Search | Chat |     |  |
|  |  |              Profile | Login | Signup           |  |
|  |  +-------------------------------------------------+  |  |
|  +---------------------------+---------------------------+  |
+------------------------------|------------------------------+
                               |
                   Supabase JS Client SDK
                               |
+------------------------------v------------------------------+
|                   Supabase Cloud Platform                   |
|  +--------------------+  +-------------------------------+  |
|  |   Supabase Auth    |  |     PostgreSQL Database       |  |
|  | (Tokens & Sessions)|  | (Tables: profiles, messages)  |  |
|  +--------------------+  +-------------------------------+  |
|  +-------------------------------------------------------+  |
|  |             Realtime WebSocket Subscriptions          |  |
|  +-------------------------------------------------------+  |
+-------------------------------------------------------------+
```

## 2. Layered Breakdown

### A. Routing & State Layer (`src/App.tsx`)
- **Hash-based granular deep linking:** Handles routes such as `#/home`, `#/search`, `#/profile`, `#/login`, `#/signup`, `#/chat?user=:username`.
- **Global Auth & Online Presence:** Subscribes to `supabase.auth.onAuthStateChange` to keep session state in sync.
- **Top Header & Bottom Navigation Bar:** Provides responsive tab switching and title tracking based on current route.

### B. Component Layer (`src/components/`)
- `HomeScreen.tsx`: Queries unique conversation threads with latest messages and unread counts, listens to realtime `messages` table changes.
- `ChatScreen.tsx`: Direct 1-on-1 messaging screen with instant sending, optimistic updates, mark-as-read triggers, and realtime message delivery.
- `SearchScreen.tsx`: Chatted contacts list with live filtering and exact `@username` lookup that directly routes into conversation rooms.
- `ProfileScreen.tsx`: Displays profile credentials, username, join date, and logout triggers.
- `LoginScreen.tsx` & `SignupScreen.tsx`: Auth credential forms with client-side validation and Supabase Auth integration.
- `WelcomeScreen.tsx`: Landing entry view for unauthenticated visitors.

### C. Data & Backend Layer (`src/lib/supabase.ts`)
- Supabase Client instance connecting to `https://bjwzqafnspaeuwgnxnyn.supabase.co`.
- Direct Postgres queries guarded by Row Level Security (RLS) policies.
- Realtime channels for instant notification of new messages.
