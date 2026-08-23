# PROJECT CONTEXT

## Project Overview
- **Project Name:** Niooon Chat
- **Project Type:** Real-time Direct Messaging Web & Mobile Application
- **Project Purpose:** Fast, privacy-focused, username-based 1-on-1 messaging platform with end-to-end user experience and dark aesthetic.
- **Target Platform:** Web (SPA) & Android (via Capacitor)

## Technology Stack
- **Frontend Framework:** React 19 (TypeScript)
- **Bundler & Build Tool:** Vite 6.2 + Tailwind CSS v4
- **Mobile Runtime:** Capacitor 8 (Android & Web hybrid)
- **Backend & Database:** Supabase (PostgreSQL, Supabase Auth, Realtime Postgres Changes)
- **Icons & UI:** Lucide React, Motion (Framer Motion)
- **Hosting / Deployment:** Google Cloud Run / Containerized Nginx & Static Serving

## Key Configurations & Identifiers
- **Supabase Project Reference:** `bjwzqafnspaeuwgnxnyn`
- **GitHub Repository:** `https://github.com/saiqul211/niooonchat` (branch: `main`)
- **Default Port:** 3000

## Major Modules
1. **Authentication Module:** Supabase Email/Password Auth, Session Management, Persistent Auth Listener.
2. **Inbox / Home Module:** Realtime conversation list, unread message badges, last message previews, relative timestamps.
3. **Chat Room Module:** Realtime 1-on-1 direct messaging, read receipts (Sent/Seen), auto-scroll, message deduplication.
4. **Search Module:** Chatted contacts filtering, exact username lookup & automatic direct navigation to chat.
5. **Profile Module:** Account details, full name, username badge, member since date, sign out.
