# Project Instructions

The user has specified the following persistent rules for this application. These rules must be strictly followed for all future development:

1. **Strict Dark Mode:** The application design MUST always be in dark mode. Use black (`bg-black`), dark neutral backgrounds (`bg-neutral-950`), and light/white text (`text-neutral-100`). Do not implement light mode designs.
2. **Granular Routing & Deep Linking:** Every new page, popup, modal, major section, and distinct option MUST have its own separate, distinct URL link/route (e.g., using a routing library). Avoid monolithic views where popups and sections lack a navigable, shareable link.
3. **Database Integration with Supabase:** Whenever database, data persistence, authentication, tables, real-time data, or backend storage is mentioned or needed, ALWAYS use **Supabase** (Project Ref: `bjwzqafnspaeuwgnxnyn`) via `@niooon/github` and standard Supabase integration. For any database schema changes, table creation, alterations, or policy changes, strictly follow the Supabase Mandatory Permission Rule (ask explicit permission with action name & impact scope before executing).
4. **Continuous GitHub Auto-Sync (saiqul211/niooonchat):** Whenever any new feature, bug fix, or codebase change is completed in this application, automatically commit and push the entire updated codebase to the GitHub repository `https://github.com/saiqul211/niooonchat` (branch: `main`) using Git/`@niooon/github`.
