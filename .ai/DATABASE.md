# DATABASE DOCUMENTATION

## 1. Database Engine & Connection
- **Engine:** PostgreSQL 15+ (Hosted on Supabase)
- **Project Ref:** `bjwzqafnspaeuwgnxnyn`
- **Client Library:** `@supabase/supabase-js`

---

## 2. Table Schemas

### `profiles` Table
Stores public and private profile information for registered users.

| Column Name | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | Primary Key, References `auth.users(id)` ON DELETE CASCADE | Unique user identifier |
| `full_name` | `text` | NOT NULL | User's display name |
| `username` | `text` | NOT NULL, UNIQUE, Lowercase | Unique username identifier |
| `email` | `text` | Optional | User's email (Private) |
| `avatar_url` | `text` | Optional | URL to avatar image |
| `status` | `text` | Optional, Default: `'Hey there! I am using Niooon Chat.'` | User custom status bio |
| `created_at` | `timestamptz` | Default: `now()` | Account creation timestamp |

**Security & RLS Policies:**
- `SELECT`: Publicly readable for public fields (`id, full_name, username, avatar_url, status, created_at`).
- `INSERT` / `UPDATE`: Only authenticated users can insert or update their own profile (`auth.uid() = id`).

---

### `messages` Table
Stores direct messages sent between users.

| Column Name | Data Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | Primary Key, Default: `gen_random_uuid()` | Unique message ID |
| `sender_id` | `uuid` | NOT NULL, References `profiles(id)` | Sender user ID |
| `receiver_id` | `uuid` | NOT NULL, References `profiles(id)` | Recipient user ID |
| `content` | `text` | NOT NULL | Message text body |
| `is_read` | `boolean` | Default: `false` | Read receipt status |
| `created_at` | `timestamptz` | Default: `now()` | Message sent timestamp |

**Security & RLS Policies:**
- `SELECT`: Users can only view messages where they are the `sender_id` or `receiver_id` (`auth.uid() = sender_id OR auth.uid() = receiver_id`).
- `INSERT`: Users can only send messages with `sender_id = auth.uid()`.
- `UPDATE`: Users can update `is_read` for messages sent to them (`receiver_id = auth.uid()`).

---

## 3. Realtime Publications
- `supabase_realtime` publication enabled for table `messages` to support live chat and inbox updates.
