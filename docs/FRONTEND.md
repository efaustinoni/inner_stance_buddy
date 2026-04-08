# Frontend Documentation

## 33 Components

All React components live under `src/components/`. Subdirectories group related components by feature or layer.

---

### Root Components

#### AddToHomeScreenButton

`src/components/AddToHomeScreenButton.tsx`
PWA "Add to Home Screen" prompt handler. Listens for the browser `beforeinstallprompt` event, stores it, and shows a customised install button on iOS and Android. Handles iOS-specific detection separately since iOS never fires the standard event.

#### AuthPage

`src/components/AuthPage.tsx`
Authentication page with email/password sign-in, sign-up, and a link to the forgot-password flow. Manages form state, validation errors, and Supabase auth calls. The default entry point for unauthenticated users.

#### ForgotPasswordPage

`src/components/ForgotPasswordPage.tsx`
Password reset request page. Accepts a user's email address and calls the `password-reset` edge function to verify their security question before sending a Supabase reset link.

#### LegalAcceptanceBanner

`src/components/LegalAcceptanceBanner.tsx`
Sticky banner that appears when the active legal documents (terms/privacy) have been updated and the user has not yet accepted the new versions. Delegates acceptance handling to the parent via callback.

#### LegalOverlay

`src/components/LegalOverlay.tsx`
Wrapper component that owns the public-path exclusion list and the needs-update check for legal documents. Renders `LegalAcceptanceBanner` only when the current route requires re-acceptance. Reads the current path via wouter internally so the app shell does not need to know about public-path logic.

#### LegalPage

`src/components/LegalPage.tsx`
Full-screen viewer for the Terms of Service and Privacy Policy PDFs. Fetches the active document URLs from Supabase and renders them in an iframe. Supports switching between the two documents via tabs.

#### ProfilePage

`src/components/ProfilePage.tsx`
User profile management page. Allows updating display name, avatar URL, timezone (via TimezonePicker), and security question/answer. Also handles account deletion flow (soft-delete with 15-day grace period).

#### SecurityQuestionModal

`src/components/SecurityQuestionModal.tsx`
Modal for setting or updating a user's security question and answer. The answer is hashed client-side before being sent to the server. Used during profile setup and password recovery verification.

#### SimpleHeader

`src/components/SimpleHeader.tsx`
Minimal branded header used on standalone pages (auth, legal, password reset) that do not show the full dashboard navigation. Displays the app logo and title only.

#### TimezonePicker

`src/components/TimezonePicker.tsx`
Searchable timezone selector grouped by continent. Powered by the `src/lib/timezone/` library. Used in ProfilePage to let users set their local timezone for accurate date display.

#### UpdatePasswordPage

`src/components/UpdatePasswordPage.tsx`
Page for setting a new password after the user has clicked a password-reset email link. Rendered when Supabase fires the `PASSWORD_RECOVERY` auth event. Calls `supabase.auth.updateUser` on submit.

#### VersionBadge

`src/components/VersionBadge.tsx`
Small fixed badge in the corner of the screen that displays the app version string from `src/lib/appConfig.ts`. Useful for identifying deployed builds during testing.

#### WelcomePage

`src/components/WelcomePage.tsx`
Landing screen shown to new or returning unauthenticated visitors. Presents the app value proposition and navigation links to sign-in and sign-up.

---

### exercises/ Components

#### BulkImportModal

`src/components/exercises/BulkImportModal.tsx`
Modal for importing exercise questions in bulk. Supports three input modes: plain-text paste (with Dutch/English label detection), CSV file upload (with column mapping), and AI-powered image extraction via the `extract-questions-from-image` edge function. Exports the `parseExerciseText` helper.

#### ExerciseQuestionCard

`src/components/exercises/ExerciseQuestionCard.tsx`
Card component that displays a single exercise question alongside an editable textarea for the user's answer. Shows Save / saved state, and provides buttons to start or view a progress tracker for the question.

#### QuarterModal

`src/components/exercises/QuarterModal.tsx`
Modal for managing exercise quarters (user-defined groupings of weeks). Supports creating new quarters, inline renaming with duplicate detection, and deletion. Used from PowerPage.

#### QuestionModal

`src/components/exercises/QuestionModal.tsx`
Simple modal for adding or editing a single exercise question. Collects a label (e.g. "Reflectie 1a") and the full question text. Used inline on PowerPage when a user wants to add a question to an existing week.

#### WeekModal

`src/components/exercises/WeekModal.tsx`
Large modal for creating or editing an exercise week. Supports four import modes: manual question entry, CSV upload, text-paste, and image upload (AI extraction). Also provides a "Copy to Quarter" panel for duplicating a week with or without answers.

#### WeekSelector

`src/components/exercises/WeekSelector.tsx`
Quarter-filter badge strip rendered at the top of PowerPage. Displays "All", one badge per quarter, and optionally an "Unassigned" badge. Controlled component — filter state lives in the parent.

---

### layout/ Components

#### DashboardLayout

`src/components/layout/DashboardLayout.tsx`
Shell layout that wraps all authenticated page content. Renders `MainNavigation` above a centred content area (`max-w-5xl`). Accepts only `onNavigate` and `children` — auth state is read from `AuthContext` by `MainNavigation` directly.

#### MainNavigation

`src/components/layout/MainNavigation.tsx`
Sticky top navigation bar. Displays the Exercise Journal brand logo/name on the left and a user avatar button + sign-out button on the right. Reads `userName` and `handleSignOut` from `AuthContext` — no auth props needed from the parent.

---

### pages/ Components

#### DashboardPage

`src/components/pages/DashboardPage.tsx`
Main dashboard that lists all exercise questions grouped by quarter and then by week. Provides filtering by quarter, by week, by tracking status (tracked/untracked/all), and by free-text search. Shows summary stats (total, answered, tracked).

#### PowerPage

`src/components/pages/PowerPage.tsx`
Week management page ("Manage Weeks"). Shows a collapsible list of weeks with quarter-filter badge strip. Each week expands to show its question cards inline. Hosts the WeekModal, QuestionModal, BulkImportModal, QuarterModal, and WeekSelector modals.

#### ProgressTrackingPage

`src/components/pages/ProgressTrackingPage.tsx`
Daily check-in tracker for a single exercise question. Renders a scrollable list of calendar dates from the tracker's start date to today. Each date row can be toggled done/undone and has an expandable notes field.

---

### auth/ Components

#### VerificationScreen

`src/components/auth/VerificationScreen.tsx`
Standalone view shown after a successful sign-up when email confirmation is required. Displays a check-your-email message, a resend button, and a back-to-sign-in link. Extracted from `AuthPage` to keep that component focused on form rendering.

---

### profile/ Components

#### DeleteConfirmModal

`src/components/profile/DeleteConfirmModal.tsx`
Confirmation modal for account deletion. Requires the user to type the word `DELETE` before the confirm button becomes active. Displays a clear summary of what deletion entails (soft-delete + 15-day hard-delete).

#### DeletionScheduledView

`src/components/profile/DeletionScheduledView.tsx`
Full-screen informational view shown when the authenticated user's account has already been soft-deleted and is awaiting hard deletion. Shows the scheduled hard-delete date and prompts the user to acknowledge and sign out.

---

### ui/ Components

#### Avatar

`src/components/ui/Avatar.tsx`
User avatar component with three render states: photo (`src` prop), generated initials with deterministic background colour (from `name` prop), or a fallback icon. Five size variants (xs – xl). Also exports `AvatarGroup` for stacked avatar lists.

#### Badge

`src/components/ui/Badge.tsx`
Inline badge/chip with six colour variants (default, primary, success, warning, error, gold) and two sizes. Pill and rounded-rect shapes. Also exports `NotificationBadge` (absolute-positioned count dot) and `StatusDot` (online/offline/busy/away indicator).

#### Button

`src/components/ui/Button.tsx`
Styled button with five variants (primary, secondary, dark, ghost, danger), three sizes, loading spinner state, and optional left/right icon slot. Extends native `ButtonHTMLAttributes`.

#### Card

`src/components/ui/Card.tsx`
Container card with four variants (light, dark, glass, elevated), four padding options, and an optional hover-lift animation. Also exports `CardHeader`, `CardTitle`, `CardContent`, and `CardFooter` sub-components.

#### ErrorBoundary

`src/components/ui/ErrorBoundary.tsx`
React error boundary component that catches unhandled render errors in its subtree and displays a fallback UI instead of crashing the whole page.

#### Toast

`src/components/ui/Toast.tsx`
Toast notification renderer. Subscribes to the `src/lib/toast.ts` event bus and renders transient success/error/info messages in a fixed overlay. Consumed by the root app shell.

---

## 6 Hooks

Custom React hooks live in `src/hooks/`. Each hook owns a specific slice of state and logic, keeping page components focused purely on rendering.

#### useAuth

`src/hooks/useAuth.ts`
Manages the global authentication state. Loads the current user on mount via `supabase.auth.getUser`, subscribes to `onAuthStateChange` for live updates, auto-fills the user's timezone if still set to UTC, and exposes `handleSignOut`. Called once inside `AuthProvider` — consumers access the result through the auth context hook.

#### useAuthForm

`src/hooks/useAuthForm.ts`
Owns all state, effects, validation, and submit logic for the sign-in / sign-up forms. Extracted from `AuthPage.tsx` to keep that component focused on rendering. Manages mode switching, browser autofill detection, form validation memos, `handleSubmit`, `handleResendVerification`, `switchMode`, and `handleBackToSignIn`.

#### useDashboard

`src/hooks/useDashboard.ts`
Owns all state and logic for `DashboardPage`. Loads weeks, questions, answers, and tracker data via `fetchDashboardData`. Exposes filter state (selectedWeek, selectedQuarter, filterMode, searchQuery), derived values (filteredQuestions, stats, groupedByQuarterAndWeek), collapse state, and all action handlers. Extracted in ITEM-03.

#### useLegalStatus

`src/hooks/useLegalStatus.ts`
Manages legal acceptance state for the current user. Fetches the active legal manifest and checks whether the user has accepted the current terms/privacy versions. Exposes `handleAcceptTerms` which calls `recordUserAgreement` (authenticated) or `setLocalAcceptance` (guest).

#### usePowerPage

`src/hooks/usePowerPage.ts`
Owns modal state and all CRUD action handlers for `PowerPage` (Manage Weeks). Data loading and expand-state are delegated to `useWeekData`. Manages week/quarter/question create, update, delete, and copy operations; bulk import; answer saving; progress tracker creation; and a `pendingDeleteQuestion` state that drives the inline question-delete confirmation modal.

#### useWeekData

`src/hooks/useWeekData.ts`
Manages week and quarter data for `usePowerPage`: loading, expand/collapse, active quarter filter, lazy week-with-questions fetching, and tracker batch queries. Extracted from `usePowerPage` so the two concerns (data vs. actions) live in separate, testable units.
