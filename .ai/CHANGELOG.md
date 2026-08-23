# CHANGELOG

All notable changes to the Niooon Chat project will be documented in this file.

## [1.5.6] - 2026-08-23
### Fixed
- Fixed Capacitor 8 build failure by providing standalone Gradle 8.14.3 runner in GitHub Actions.
- Aligned `variables.gradle` and build scripts with Capacitor 8 requirements (compileSdkVersion 36, AGP 8.13.0, google-services 4.4.4).
- Fixed XML namespace conflict in `android/capacitor-cordova-android-plugins/src/main/AndroidManifest.xml`.

## [1.5.5] - 2026-08-23
### Fixed
- Fixed GitHub Actions Step `Setup Gradle` failure by replacing external action with direct native Gradle Wrapper execution (`./gradlew assembleDebug`).
- Added `npx cap sync android` step to ensure assets and native plugin configs are cleanly generated.
- Optimized gradle-wrapper distribution to fast binary package (`gradle-8.11.1-bin.zip`).

## [1.5.4] - 2026-08-23
### Fixed
- Fixed remaining AGP `8.13.0` reference in `android/capacitor-cordova-android-plugins/build.gradle` by updating it to stable `8.7.3`.
- Replaced throwing `servicesJSON.text` check in `android/app/build.gradle` with safe `servicesJSON.exists()`.
- Removed unused `@capacitor/push-notifications` reflection entry from `android/app/src/main/assets/capacitor.plugins.json`.

## [1.5.3] - 2026-08-23
### Fixed
- Fixed Android build failure caused by non-existent AGP version (`8.13.0` -> `8.7.3`) and Gradle version (`8.14.3` -> `8.11.1`).
- Replaced mismatched AndroidX dependencies in `variables.gradle` with verified Maven Central versions (compileSdk 34, appcompat 1.7.0, activity 1.9.3, splashscreen 1.0.1).
- Updated Gradle distribution URL and setup-gradle action to Gradle 8.11.1.

## [1.5.2] - 2026-08-23
### Fixed
- Fixed GitHub Actions Android release workflow by adopting official `gradle/actions/setup-gradle@v4` action with Gradle 8.14.3.
- Added executable permissions `chmod +x gradlew` and ran `./gradlew assembleDebug --no-daemon --stacktrace` directly from the android directory.
- Hardened dependency installation with `npm ci || npm install --legacy-peer-deps`.

## [1.5.1] - 2026-08-23
### Fixed
- Fixed GitHub Actions Android release workflow by restoring `npm install --no-audit --no-fund` step. This ensures Gradle can locate Capacitor's native bridge and plugin libraries in `node_modules/@capacitor/*`.
- Kept the live remote URL wrapper configuration intact without unnecessary web asset building.

## [1.4.1] - 2026-08-23
### Fixed
- Fixed Android status bar clock and battery indicator overlap by configuring automatic `max(env(safe-area-inset-*), 36px/16px)` fallback offsets in CSS.
- Configured Android theme `styles.xml` with `android:fitsSystemWindows="true"` and `android:windowDrawsSystemBarBackgrounds="true"` to prevent WebView content from underlapping the system status bar.
- Ensured authentication views (`LoginScreen`, `SignupScreen`, `WelcomeScreen`) and top headers always remain well clear of notches, punch-holes, and system indicators.

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
