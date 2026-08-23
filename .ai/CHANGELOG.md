# CHANGELOG

All notable changes to the Niooon Chat project will be documented in this file.

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
