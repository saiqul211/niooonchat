# FEATURE REGISTRY

## Status Legend
- `[✓]` Completed & Stable
- `[~]` In Progress
- `[ ]` Planned
- `[!]` Broken / Needs Fix
- `[-]` Deprecated

---

## 1. Authentication & Onboarding
- `[✓]` Welcome Landing Screen
- `[✓]` Email & Password Sign Up with Username & Full Name
- `[✓]` Email & Password Log In
- `[✓]` Persistent Session Detection & Auto-Redirect
- `[✓]` Sign Out & Session Teardown

## 2. Realtime 1-on-1 Direct Messaging
- `[✓]` Message Sending with Instant Optimistic Rendering
- `[✓]` Realtime Message Receiving (Supabase Realtime Postgres Changes)
- `[✓]` Read Receipts (`Sent` / `Seen`)
- `[✓]` Automatic Scroll to Latest Message
- `[✓]` Formatted Timestamps (12-hour AM/PM format)
- `[✓]` Username-based Navigation (`#/chat?user=:username`)

## 3. Inbox / Home Dashboard
- `[✓]` Active Conversation Threads List
- `[✓]` Latest Message Preview with "You:" Prefix
- `[✓]` Relative Timestamps (e.g. "Just now", "5m", "Yesterday")
- `[✓]` Unread Message Count Badges
- `[✓]` Filter Tabs ("All Chats", "Unread")
- `[✓]` Realtime Inbox List Auto-Update on new messages

## 4. Search & Discovery
- `[✓]` Chatted Contacts List (Filtered solely to existing message partners)
- `[✓]` Realtime Sync of Chatted Contacts on new conversations
- `[✓]` Exact Username Direct Chat Navigation (Type `@username` -> Instant Chat)
- `[✓]` Zero Unsolicited Public Auto-Suggestions

## 5. Profile & Settings
- `[✓]` Profile Information View (Full Name, Username, Member Date)
- `[✓]` Private Email Display (Visible only to authenticated owner)
- `[✓]` User Status Bio Display
- `[✓]` Safe Logout Action Button

## 6. System Architecture & Project Management
- `[✓]` Granular Deep-Linking Hash Router
- `[✓]` Strict Dark Mode UI
- `[✓]` 100% English-Only UI Strings & Labels
- `[✓]` Continuous GitHub Auto-Sync Integration
- `[✓]` `.ai/` Project Memory & Intelligence System
