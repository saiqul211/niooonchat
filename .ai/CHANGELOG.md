# CHANGELOG

All notable changes to the Niooon Chat project will be documented in this file.

## [1.4.0] - 2026-08-23
### Fixed
- Fixed rigid smartphone width constraint that was preventing the application from fitting naturally across different phone screen sizes, orientations, and displays.
- Resolved rubber-band viewport pulling and entire window scrolling by locking root layout with `position: fixed; inset: 0; height: 100dvh; overscroll-behavior: none;`.
- Fixed list container overflow and layout jumping by adding `min-h-0`, `overscroll-contain`, and flex-1 constraints in `HomeScreen`, `SearchScreen`, and `ChatScreen`.
- Added flexible scroll containment on authentication screens (`WelcomeScreen`, `LoginScreen`, `SignupScreen`) for short screens or when virtual keyboards appear.

## [1.3.0] - 2026-08-23
### Fixed
- Resolved Android system status bar (notch, battery, network, clock) overlapping and colliding with the application header.
- Added dedicated `safe-top` insets in `App.tsx` and `ChatScreen.tsx` top headers so controls sit in a dedicated active bar below system indicators.
- Added `safe-bottom` padding to the bottom navigation bar and chat message input form to prevent collision with Android gesture navigation bars.
- Configured Android theme `styles.xml` with dark status bar and navigation bar colors.

## [1.2.0] - 2026-08-23
### Added
- Created complete `.ai/` Project Memory and Intelligence System (`MASTER_RULES.md`, `PROJECT_CONTEXT.md`, `ARCHITECTURE.md`, `DATABASE.md`, `API_CONTRACTS.md`, `DESIGN_SYSTEM.md`, `SECURITY_RULES.md`, `FEATURE_REGISTRY.md`, `CURRENT_TASK.md`, `CHANGELOG.md`).
- Added Feature Specifications in `.ai/features/` (`authentication.md`, `messaging.md`, `search.md`, `profile.md`).
- Added Architectural Decision Records in `.ai/decisions/` (`ADR-001`, `ADR-002`, `ADR-003`).

## [1.1.0] - 2026-08-23
### Added
- Exact `@username` direct chat navigation feature in Search screen.
- Real-time subscription for automatic sync of newly chatted partners in the search screen.

### Changed
- Restricted search list scope to display and filter only users with whom the current user has chatted.
- Converted all remaining UI strings and labels across all screens to English.

## [1.0.0] - 2026-08-22
### Added
- Initial release of Niooon Chat SPA with Supabase Authentication and Realtime Direct Messaging.
- Granular URL Hash-Routing and deep-linking system.
- Strict Dark Mode visual aesthetic.
- Continuous auto-sync with GitHub repository `saiqul211/niooonchat`.
