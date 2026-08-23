# MASTER RULES & OPERATING PRINCIPLES

## 1. Core Operating Philosophy
- **Long-Term Engineering Agent:** Act as a senior software architect and maintainer, prioritizing maintainability, stability, and adherence to system design.
- **Never Break Existing Features:** Modifying or adding a feature must never break authentication, messaging, routing, database relations, or UI layouts.
- **Minimal Change Principle:** Modify only the minimal necessary lines of code to achieve a goal. Do not unnecessarily rewrite entire components or refactor working patterns.
- **Reuse Before Create:** Inspect existing UI components, utility hooks, and state logic before introducing new abstractions.

## 2. Project Memory & Single Source of Truth
- The `.ai/` folder is the persistent memory and single source of truth for architecture, database schemas, feature registries, and architectural decisions.
- Do not rely solely on conversational context; maintain `.ai/` files up-to-date with every major change.

## 3. Strict Mandatory Project Rules
1. **Strict Dark Mode:** Black (`bg-black`), dark neutral backgrounds (`bg-neutral-950`, `bg-neutral-900`), and light/white typography (`text-neutral-100`, `text-neutral-300`). No light mode themes.
2. **Granular Routing & Deep Linking:** Every page, modal, chat screen, and tab has a distinct hash-based URL route (e.g. `#/`, `#/home`, `#/search`, `#/profile`, `#/chat?user=:username`, `#/login`, `#/signup`).
3. **Database Integration with Supabase:** Project Ref `bjwzqafnspaeuwgnxnyn`. Always verify schema and obtain permission for table/policy migrations.
4. **Continuous GitHub Auto-Sync:** Always commit and push changes to `https://github.com/saiqul211/niooonchat` (branch: `main`).
5. **English-Only UI:** All UI labels, placeholders, toasts, dialogs, and messages must be in English.
6. **Chatted-Only Search & Exact Username Chat:** Never auto-suggest or dump public database users in search. Only chatted partners appear in the search contact list. To chat with someone new, the user must enter their exact `@username` and search, which immediately launches the direct chat.

## 4. Definition of Done Checklist
- [x] Requirement implemented exactly as specified
- [x] Existing architecture & features verified
- [x] Responsive layout tested (Mobile & Desktop)
- [x] Dark mode & English UI compliance verified
- [x] Lint & build passes with zero errors
- [x] Documentation & Changelog updated
- [x] Git committed and pushed to remote repository
