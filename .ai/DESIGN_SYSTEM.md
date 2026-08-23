# DESIGN SYSTEM

## 1. Theme Philosophy: Strict Dark Mode
- **Backgrounds:** Pure Black (`bg-black`), Dark Neutral Shells (`bg-neutral-950`), Surface Cards (`bg-neutral-900`), Sub-surfaces (`bg-neutral-800`).
- **Borders:** Subtle separation borders (`border-neutral-800`, `border-neutral-850`, `border-neutral-700`).
- **Typography:**
  - Headings: `text-neutral-100` (bold/semibold)
  - Body Text: `text-neutral-200`
  - Secondary / Meta Labels: `text-neutral-400` / `text-neutral-500`
  - Monospace (Usernames/Codes): `font-mono text-neutral-300`

## 2. Accents & Indicators
- **Emerald / Green:** Online status dot (`bg-emerald-500`), Seen receipt badge (`text-emerald-400 bg-emerald-950/60 border-emerald-800/80`).
- **Red / Danger:** Error alerts, Logout button (`text-red-400 bg-red-950/30 border-red-900/40`).
- **White / Contrast Action:** Primary action buttons (`bg-neutral-100 text-black hover:bg-white`).

## 3. Typography Scale & Hierarchy
- Display / Logo: `text-base` / `text-lg` with `tracking-tight font-bold`
- Page Titles: `text-sm font-semibold`
- Section Headers: `text-xs font-semibold uppercase tracking-wider`
- Body & Chat Text: `text-xs` / `text-sm`
- Timestamps & Badges: `text-[10px]` / `text-[11px]`

## 4. UI Components & Tokens
- **Inputs:** `bg-neutral-900 border border-neutral-800 rounded-xl py-2.5 px-3.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-700`
- **Primary Buttons:** `py-2.5 px-4 bg-neutral-100 hover:bg-white text-black font-semibold text-xs rounded-xl shadow-sm active:scale-95 transition-all`
- **Secondary Buttons:** `py-2 px-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-neutral-300 hover:text-white text-xs`
- **Chat Bubbles:**
  - Sent by Me: `bg-neutral-100 text-black rounded-2xl rounded-tr-sm p-3`
  - Received: `bg-neutral-900 text-neutral-100 border border-neutral-800 rounded-2xl rounded-tl-sm p-3`
- **Avatars:** Circular or smooth rounded containers with dynamic two-letter uppercase initials.
- **Card Containers:** `bg-neutral-900/50 border border-neutral-800/80 rounded-2xl p-3.5`

## 5. Responsive Design Rules
- Mobile-first container shell with `max-w-md mx-auto` or full viewport responsive scaling.
- Touch target minimum height: 44px on interactive elements.
