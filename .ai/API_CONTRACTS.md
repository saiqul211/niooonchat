# API CONTRACTS & SUPABASE METHODS

## 1. Authentication APIs (Supabase Auth)

### Sign Up
- **Method:** `supabase.auth.signUp({ email, password, options: { data: { username, full_name } } })`
- **Output:** `{ data: { user, session }, error }`
- **Side Effect:** Automatically creates corresponding row in `profiles` table via client-side check or database triggers.

### Log In
- **Method:** `supabase.auth.signInWithPassword({ email, password })`
- **Output:** `{ data: { user, session }, error }`

### Sign Out
- **Method:** `supabase.auth.signOut()`
- **Output:** `{ error }`

---

## 2. Profiles APIs

### Fetch Public Profile by Username
- **Query:** `supabase.from('profiles').select('id, full_name, username, avatar_url, status, created_at').ilike('username', cleanUsername).maybeSingle()`
- **Response:** `PublicProfile | null`

### Fetch User Profile by ID
- **Query:** `supabase.from('profiles').select('*').eq('id', userId).single()`
- **Response:** `Profile | null`

---

## 3. Messages & Conversations APIs

### Fetch Chatted Partners List
- **Query:** `supabase.from('messages').select('sender_id, receiver_id').or('sender_id.eq.UID,receiver_id.eq.UID')`
- **Follow-up:** Extract unique partner IDs and fetch from `profiles` where `id IN (...)`.

### Fetch Chat History
- **Query:**
  ```ts
  supabase
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${myId},receiver_id.eq.${targetId}),and(sender_id.eq.${targetId},receiver_id.eq.${myId})`)
    .order('created_at', { ascending: true })
  ```

### Send Message
- **Mutation:**
  ```ts
  supabase
    .from('messages')
    .insert({
      sender_id: currentUserId,
      receiver_id: targetUserId,
      content: messageText.trim(),
      is_read: false
    })
  ```

### Mark Messages as Read
- **Mutation:**
  ```ts
  supabase
    .from('messages')
    .update({ is_read: true })
    .eq('sender_id', targetUserId)
    .eq('receiver_id', currentUserId)
    .eq('is_read', false)
  ```
