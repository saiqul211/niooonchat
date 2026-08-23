# Feature Specification: Direct Messaging & Inbox

## 1. Purpose
Enables real-time 1-on-1 direct messaging between users with read receipts and inbox conversation management.

## 2. User Flow
1. User clicks a conversation card from `#/home` or searches a username in `#/search`.
2. App routes to `#/chat?user=:username`.
3. Displays complete chronological chat history between current user and target user.
4. Sending a message adds an optimistic chat bubble and pushes an insert query to Supabase.
5. Incoming messages arrive instantly via Supabase Realtime channel.
6. Messages sent by partner are automatically marked as `is_read = true` upon viewing.

## 3. UI Components
- `ChatScreen.tsx`
- `HomeScreen.tsx` (Conversation list, unread badges, filter tabs)

## 4. Database & Realtime Dependencies
- `messages` table
- `profiles` table
- Postgres Realtime subscription on `messages` table

## 5. Security & Access Control
- RLS ensures users can only read messages where `sender_id = auth.uid()` or `receiver_id = auth.uid()`.
