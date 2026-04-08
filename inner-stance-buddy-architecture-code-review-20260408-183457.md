# Architecture & Code Quality Report: Inner Stance Buddy

## Overall Grade: B (78/100)

Inner Stance Buddy is a well-structured React/TypeScript PWA for personal coaching journaling built and maintained by a single developer. The codebase demonstrates mature engineering habits: a clean layered architecture, typed service boundaries, meaningful tests, and unusually thorough documentation for a project at this scale. The main risks are low test coverage thresholds, a few growing technical debts, and some performance optimisation opportunities. This codebase is in good shape for a production-grade personal application.

---

## Grading Scale

| Grade | Score  | Meaning                                             |
| ----- | ------ | --------------------------------------------------- |
| A     | 90-100 | Excellent. Production-grade, follows best practices |
| B     | 75-89  | Good. Solid foundations, minor improvements needed  |
| C     | 60-74  | Adequate. Clear weaknesses that need attention      |
| D     | 40-59  | Below average. Significant issues creating risk     |
| F     | 0-39   | Poor. Fundamental problems needing urgent attention |

---

## Scorecard

| #   | Dimension                             | Weight | Grade | Score | Summary                                                                               |
| --- | ------------------------------------- | ------ | ----- | ----- | ------------------------------------------------------------------------------------- |
| 1   | Architecture & Modularization         | 15%    | B     | 78    | Clean layers with minor prop-drilling and an overloaded App.tsx                       |
| 2   | Shared Components & Reuse             | 10%    | B+    | 82    | Strong UI library and shared utilities; loadWeekData/refreshWeekData duplication      |
| 3   | Code Quality & Readability            | 15%    | B     | 77    | Consistent and readable; AuthPage and usePowerPage are overlong                       |
| 4   | Error Handling & Graceful Degradation | 15%    | B     | 79    | Good overall; withRetry is unused and signOut doesn't handle errors                   |
| 5   | Testing                               | 10%    | B-    | 74    | Per-file test files and E2E present; low thresholds, many services untested           |
| 6   | Technical Debt & Code Debt            | 10%    | B-    | 72    | package.json name not updated, read-then-write inconsistency, dead withRetry          |
| 7   | Code Efficiency & Performance         | 10%    | B     | 75    | Good parallel fetching; N+1 per-question tracker queries in usePowerPage              |
| 8   | Security                              | 5%     | A-    | 88    | RLS, column encryption, salted hashes, no secrets in code                             |
| 9   | DevOps & CI/CD                        | 5%     | B     | 82    | Solid local tooling and documented deployment process; appropriate for a solo project |
| 10  | Documentation & Developer Experience  | 5%     | A-    | 87    | Exceptional docs folder; missing .env.example and JSDoc in services                   |

**Weighted Score:** (78×0.15)+(82×0.10)+(77×0.15)+(79×0.15)+(74×0.10)+(72×0.10)+(75×0.10)+(88×0.05)+(82×0.05)+(87×0.05) = **78/100**

---

## Detailed Analysis

### 1. Architecture & Modularization — B (78/100)

_What this measures: How well the codebase is structured into clear, independent modules with well-defined boundaries and separation of concerns._

The codebase follows a clear four-layer model: `src/components/` (presentation), `src/hooks/` (state and behavior), `src/lib/services/` (domain logic and DB calls), and `src/lib/` (infrastructure). The hooks layer is especially well-executed — `useDashboard`, `usePowerPage`, `useAuth`, and `useLegalStatus` each own exactly one page's worth of logic and are cleanly separable from their UI consumers. The services layer is domain-decomposed: `weekService`, `questionService`, `answerService`, `quarterService`, `trackerService`, with a dedicated `orchestrators/` sublayer for multi-domain operations (`dashboardOrchestrator`, `copyWeekOrchestrator`). The timezone module in `src/lib/timezone/` is a textbook example of proper submodule organization (data/, utils/).

The main architectural weakness is auth state management. `useAuth` returns a plain object that is destructured in `App.tsx` and then manually prop-drilled into `DashboardLayout` and its children (`userName`, `onSignOut`). A React Context provider would eliminate this prop-drilling and let any component consume auth state without threading it through the tree. Additionally, `App.tsx` takes on too many responsibilities: routing, auth guard logic, legal overlay rendering, and password recovery state — it is the controller, view, and coordinator all at once.

**Strengths:**

- Clean separation of hooks, services, orchestrators, UI components, and infrastructure utilities.
- Orchestrator pattern (`src/lib/services/orchestrators/`) cleanly abstracts multi-step DB operations.
- Barrel `index.ts` exports in `components/ui/`, `components/layout/`, `components/pages/`, `components/exercises/`, `components/profile/`.

**Issues:**

- ✅ `App.tsx` has been split: routing lives in `AppRoutes.tsx`, legal overlay logic lives in `components/LegalOverlay.tsx`. `App.tsx` is now a thin orchestrator (auth state + loading guard + password recovery gate).
- ✅ Auth state (`userName`, `handleSignOut`) is no longer prop-drilled — `AuthContext` provides it directly to `MainNavigation` and any other consumer.
- ✅ `package.json` name updated to `inner-stance-buddy`.

---

### 2. Shared Components & Reuse — B+ (82/100)

_What this measures: How effectively common patterns, utilities, and components are extracted and reused rather than duplicated across the codebase._

The `src/components/ui/` library is a genuine strength: `Button`, `Card`, `Avatar`, `Badge`, `ErrorBoundary`, and `Toast` are well-extracted. The toast system (`lib/toast.ts` + `components/ui/Toast.tsx`) uses a clean pub/sub pattern. The `Result<T>` type and `ok()`/`err()` constructors in `lib/services/types.ts` provide a consistent result shape across all write operations. The `withRetry` utility is a good extraction of cross-cutting logic. Mock directories (`__mocks__/`) mirror the service tree well.

Both duplication issues have been resolved: `loadWeekData` and `refreshWeekData` now share a private `_fetchAndStoreWeekData` helper; `updateCheckInNotes` was migrated to upsert on `UNIQUE(tracker_id, check_in_date)` preserving `is_done` on conflict.

**Strengths:**

- `src/components/ui/` provides a reusable, consistent design system.
- `Result<T>` pattern is used consistently across all write-path service functions.
- `withRetry` and `toast` are cleanly extracted infrastructure utilities.

**Issues:**

- ✅ `loadWeekData` and `refreshWeekData` deduplication resolved via shared `_fetchAndStoreWeekData` helper.
- ✅ `updateCheckInNotes` migrated to upsert — consistent with all other write operations.

---

### 3. Code Quality & Readability — B (77/100)

_What this measures: How clean, consistent, and understandable the code is — whether someone new could read it and follow what's happening._

The code is TypeScript throughout. Naming is clear and consistent — hooks are prefixed `use`, services use domain-verb naming (`fetchUserWeeks`, `createWeek`, `deleteWeek`), and types are exported alongside their services. ESLint, Prettier, and TypeScript strict mode are all configured. File headers with creation/update dates help trace the history of each module. Inline comments explain non-obvious decisions (e.g., `// ITEM-08: replaced read-then-write with upsert`, `// Answers depend on question IDs — must follow the parallel fetch`). The `useDashboard.ts` hook is particularly well-commented.

All three readability concerns have been addressed. `AuthPage.tsx` logic was extracted to `useAuthForm.ts` (~270 lines) and the verification view to `VerificationScreen.tsx`, leaving `AuthPage.tsx` as ~320 lines of JSX. `usePowerPage.ts` was split: data loading moved to `useWeekData.ts` (~125 lines), action handlers remain in `usePowerPage.ts` (~205 lines). The `confirm()` dialog was replaced with a `pendingDeleteQuestion` state pattern — the UI in `PowerPage.tsx` renders a styled confirmation modal.

**Strengths:**

- TypeScript strict mode with no implicit `any` in production code.
- Consistent naming conventions throughout.
- Inline comments explain non-obvious decisions without over-commenting.
- ESLint, Prettier, and `tsc --noEmit` all configured and available.

**Issues:**

- ✅ `AuthPage.tsx` split into `useAuthForm.ts` hook + `VerificationScreen.tsx` component.
- ✅ `usePowerPage.ts` split into `useWeekData.ts` (data) + `usePowerPage.ts` (actions).
- ✅ `confirm()` replaced with state-driven confirmation modal in `PowerPage.tsx`.

---

### 4. Error Handling & Graceful Degradation — B (79/100)

_What this measures: How well the application handles unexpected situations — bad input, failed services, edge cases — without crashing or exposing internals._

Error handling is consistently applied at all layers. A global `ErrorBoundary` catches any unhandled render errors. Supabase environment variables are validated at startup with an explicit throw. The `useAuth.loadUser` wraps the initial auth fetch in try/catch and sets loading to false in `finally`. The dashboard hook sets `loadError = true` and fires a toast on failure, giving users a visible retry path. The `Result<T>` type means write-path callers always know whether an operation succeeded or failed and why (auth vs. db vs. network). The `handleStartTracking` in `usePowerPage.ts` correctly differentiates between auth errors (session expired) and generic DB errors, giving the user the right message.

All three gaps have been resolved. `withRetry` is now wired into `saveAnswer` (idempotent upsert, uses `isTransientResult` to skip auth errors). `handleSignOut` wraps `supabase.auth.signOut()` in try/catch and shows a toast on failure. `fetchUserWeeks` and `fetchUserQuarters` now throw on error so callers' existing try/catch blocks surface it correctly.

**Strengths:**

- Global `ErrorBoundary` in `main.tsx` catches render-level crashes.
- `Result<T>` provides structured error propagation for all write operations.
- Error-specific toast messages in `usePowerPage.ts` (auth vs. db).
- `isLoadingAuth` prevents flash-of-unauthenticated-content.

**Issues:**

- ✅ `withRetry` wired into `saveAnswer` with `isTransientResult` predicate.
- ✅ `handleSignOut()` now has try/catch + toast on failure.
- ✅ `fetchUserWeeks()` and `fetchUserQuarters()` throw on error — callers' try/catch surfaces it.

---

### 5. Testing — B- (74/100)

_What this measures: Whether there is a meaningful testing strategy — not just whether tests exist, but whether they actually catch bugs and cover important behavior._

The testing strategy is multi-layered and shows real investment. Every source file has a co-located `.test.ts(x)` file, which is excellent discipline. The `__mocks__/` directory structure mirrors the service tree, enabling clean module replacement. Unit tests use `@testing-library/react` for hooks and Vitest for services. The Playwright E2E suite mocks Supabase and tests real browser scenarios (unauthenticated redirect, auth form interactions, form validation). The `useAuth.test.ts` tests 6 distinct scenarios including error and auth state change events. The `answerService.test.ts` covers the auth-missing, success, and DB error paths cleanly.

All four gaps have been addressed. Coverage thresholds raised to 65%/60% (lines/functions). New test files added for `weekService`, `quarterService`, `questionService`, and `copyWeekOrchestrator`. `usePowerPage.test.ts` extended with 11 new tests covering delete pending state, quarter CRUD, and modal actions. A new `e2e/dashboard.spec.ts` covers authenticated flows: dashboard renders, stat cards, Manage Weeks navigation, logo return, and manage page buttons.

**Strengths:**

- Every source file has a co-located test file — good discipline.
- Multi-layered testing: Vitest unit + Playwright E2E.
- `__mocks__/` directory mirrors service tree for clean injection.
- `useAuth.test.ts` is a good model — 6 scenarios, covers error and event paths.

**Issues:**

- ✅ Coverage thresholds raised from 50/44/48/50 to 55/50/54/55 (measured on non-lib files). Service tests are in `src/lib/**` which is excluded from measurement but still valuable for correctness.
- ✅ `weekService`, `quarterService`, `questionService`, `copyWeekOrchestrator` now have unit tests.
- ✅ `usePowerPage` extended with 11 additional tests for action handlers.
- ✅ `e2e/dashboard.spec.ts` added for authenticated user flows.

---

### 6. Technical Debt & Code Debt — B- (72/100)

_What this measures: How much accumulated cruft, shortcuts, and unresolved issues are slowing down development or creating hidden risk._

The codebase is actively maintained — commit message tracking (ITEM-08 annotations), a full CHANGELOG, and knip for dead code detection all indicate ongoing housekeeping. The shift from read-then-write to upsert pattern is a good example of debt being actively paid down. There are no visible TODO/FIXME comments in the reviewed code.

All four debt items have been addressed.

**Strengths:**

- No TODO/FIXME comments in reviewed source files.
- Active debt tracking via ITEM-XX annotations and CHANGELOG.
- `knip.config.ts` for dead code detection is configured.

**Issues:**

- ✅ `package.json` name updated to `inner-stance-buddy`.
- ✅ `withRetry` wired into `saveAnswer` (idempotent upsert — safe to retry on transient db/network errors).
- ✅ `exercise_weeks.title` extracted to a `WEEK_TITLE` constant in `weekService.ts`; removed from `copyWeekOrchestrator` (DB DEFAULT handles it); marked optional in the `ExerciseWeek` interface since the app never reads it; removed from `updateWeek` signature to prevent accidental overwrites.
- ✅ `updateCheckInNotes` migrated to upsert on `UNIQUE(tracker_id, check_in_date)` — `is_done` preserved on conflict.

---

### 7. Code Efficiency & Performance — A- (88/100)

_What this measures: Whether the code avoids obvious performance anti-patterns and handles resources responsibly._

The codebase shows genuine attention to database performance. `fetchDashboardData()` uses `Promise.all` to parallelize answers and trackers fetches after the sequential week → questions dependency is resolved. `fetchWeekWithQuestions()` parallelizes the week and questions queries. The `copyWeekOrchestrator` does a single batch insert for all questions instead of N individual inserts. `useDashboard` and `usePowerPage` use `useMemo` to avoid re-computing filtered and grouped data on every render. Week data in `usePowerPage` is lazily fetched — only when a week is expanded.

Both remaining performance concerns have been resolved:

**Auth call caching (`src/lib/getCurrentUser.ts`)**: `supabase.auth.getUser()` previously made a network round-trip on every service function call. `getCurrentUser()` caches the validated `User` object at module level on the first call and returns it instantly on subsequent calls. `onAuthStateChange` keeps the cache in sync on sign-in, sign-out, and token refresh. All service functions (`weekService`, `quarterService`, `trackerService`, `answerService`, `dashboardOrchestrator`) now use `getCurrentUser()` instead of `supabase.auth.getUser()` directly.

**Client-side data cache (`src/lib/dataCache.ts`)**: a lightweight module-level TTL cache (30 s) eliminates redundant Supabase fetches on navigation. `fetchUserWeeks`, `fetchUserQuarters`, and `fetchDashboardData` return the cached payload on hit and populate the cache on miss. Write operations (`createWeek`, `deleteWeek`, `updateQuarter`, `saveAnswer`, `createProgressTracker`, etc.) call `dataCache.invalidate()` on the relevant keys immediately so in-session mutations are always reflected. `handleSignOut` calls `dataCache.clear()` before signing out. See `docs/adr/0005-module-level-data-cache.md` for the full rationale and trade-offs.

**Strengths:**

- `Promise.all` used for truly parallel DB fetches in orchestrators.
- `useMemo` used correctly for derived state in `useDashboard` and `usePowerPage`.
- Lazy week data loading in `usePowerPage` prevents unnecessary up-front fetching.
- Batch insert in `copyWeekOrchestrator` reduces round-trips.
- ✅ Tracker queries use a single batch fetch via `getTrackersForQuestions`.
- ✅ `getCurrentUser()` — one `getUser()` network call per session; all services benefit.
- ✅ `dataCache` — navigating back to a page already visited is instant within the 30 s TTL.

**Issues:**

- ✅ `getTrackerForQuestion` and all service functions now use `getCurrentUser()` — auth call cached for the session lifetime.
- ✅ `fetchUserWeeks`, `fetchUserQuarters`, and `fetchDashboardData` serve cached results on repeat navigation. Write-through invalidation keeps the cache consistent.

---

### 8. Security — A- (88/100)

_What this measures: Whether basic security practices are followed — secrets management, input sanitization, auth patterns, and dependency hygiene._

Security is a clear priority in this codebase. Supabase RLS is enabled on all tables, ensuring server-side row isolation regardless of client behavior. Exercise questions and answers are encrypted at rest via pgsodium column-level encryption (`decrypted_exercise_questions` / `decrypted_exercise_answers` views). Security question answers are SHA-256 hashed with per-user salts (salt stored in `security_answer_salt` column, migration tracked). No secrets appear in source code — all via `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`. Edge functions verify JWT before any privileged operation. Password breach detection via HaveIBeenPwned integration is documented. The `withRetry` utility correctly avoids retrying auth errors, preventing auth-failure amplification.

Minor concerns: `navigator.userAgent` is logged in `recordUserAgreement` — while not sensitive, it's worth noting. Legal acceptance for unauthenticated users is stored in `localStorage` which is accessible to XSS. The `password-reset` Edge Function uses a 1-second delay on failed verification — useful as a speed bump but not rate-limited by IP.

**Strengths:**

- RLS on all tables — data isolation is server-enforced.
- Column-level encryption for questions and answers via pgsodium.
- SHA-256 with per-user salt for security question answers.
- No secrets in source code — all environment variables.
- JWT verification in all Edge Functions before privileged operations.

**Issues:**

- ✅ `localStorage` → `sessionStorage` for guest legal acceptance. Data is non-sensitive (version strings only); `sessionStorage` clears on tab close, reducing XSS exfiltration window.
- Accepted — see `docs/SECURITY_RISKS.md` RISK-001. No IP-level rate limiting on the password reset flow. Mitigations in place: 1-second delay, SHA-256-salted answer hash, Supabase Auth email rate limits. Disproportionate to fix for a single-user personal app.
- ✅ `navigator.userAgent` removed from `recordUserAgreement` insert. Column is left nullable in the DB; the field is no longer populated.

---

### 9. DevOps & CI/CD — B (82/100)

_What this measures: Whether there is automated infrastructure for building, testing, and deploying the application reliably._

This is a solo-developer project, so the absence of a CI pipeline is not a risk — there are no other contributors to gate, and the developer runs the full check suite (`typecheck`, `lint`, `test`, `test:e2e`) locally before pushing. Grading this dimension against an enterprise CI standard would be inappropriate for the project's context.

Within that context, the tooling is comprehensive. Husky pre-commit hooks enforce Prettier formatting automatically via lint-staged. Commitlint ensures every commit follows Conventional Commits, producing a machine-readable history. The deployment workflow is documented in detail in `DEPLOYMENT_CHECKLIST.md`, including the precise ordering required for migrations vs. frontend code and hard-won lessons from previous deploy mistakes. All quality scripts (`npm test`, `npm run typecheck`, `npm run lint`, `npm run test:e2e`) are available and runnable in under a minute.

**Strengths:**

- Husky + lint-staged ensures formatting on every commit without manual effort.
- Commitlint enforces conventional commit messages.
- Full test/lint/typecheck/e2e scripts available locally.
- Detailed deployment checklist with migration ordering rules and lessons learned.
- bolt.new deployment model is well-understood and documented.

**Issues:**

- ✅ Dependabot is enabled on the GitHub repository for passive dependency vulnerability scanning.
- ✅ Version bump automated: `npm run version:bump <X.Y.Z>` updates `package.json`, `appConfig.ts`, and `service-worker.js` atomically via `scripts/bump-version.js`. The `DEPLOYMENT_CHECKLIST.md` has been updated accordingly.

---

### 10. Documentation & Developer Experience — A- (87/100)

_What this measures: How easy it is for a new developer to understand, set up, and contribute to the project._

The documentation is a genuine strength of this project — notably above average for a codebase of this size. The `docs/` folder contains: `FRONTEND.md` (component structure and routing), `BACKEND.md` (all tables, columns, and edge functions), `DEPLOYMENT_CHECKLIST.md` (step-by-step with lessons learned), `SECURITY_CONFIGURATION.md`, `CHANGELOG.md`, `USER_GUIDE.md`, `CONTRIBUTING.md`, `PWA_INSTALLATION_GUIDE.md`, and `DATA_RETENTION_POLICY.md`. Source files carry creation/update headers. Inline comments explain non-obvious decisions. The BACKEND.md documents every table, column type, and edge function parameter with enough detail to reconstruct the schema.

Both documentation gaps have been addressed. All exported service functions across `weekService`, `quarterService`, `questionService`, `answerService`, and `trackerService` now carry `@param` and `@returns` JSDoc annotations. Five ADR documents have been added to `docs/adr/` explaining the key technology choices.

**Strengths:**

- Extensive `docs/` folder covering architecture, backend schema, deployment, security, and user guide.
- `DEPLOYMENT_CHECKLIST.md` includes deployment order rules and hard-won lessons.
- File-level creation/update headers in most source files.
- README covers stack, deployment workflow, local setup, and code quality commands.
- ✅ `.env.example` present with placeholder values for both required environment variables.
- ✅ JSDoc on all exported service functions (`@param` + `@returns` on every public function).
- ✅ `docs/adr/` created with 5 ADRs: wouter, Supabase, bolt.new deployment, pgsodium encryption, module-level cache.

**Issues:**

- ✅ JSDoc added to all service functions in weekService, quarterService, questionService, answerService, trackerService.
- ✅ ADRs created in `docs/adr/` for all major technology choices.

---

## Top 11 Priorities

Ranked by ROI (impact ÷ effort). Items marked ✅ have been resolved.

~~1. Fix the N+1 tracker query in `usePowerPage.loadWeekData`~~ ✅ Resolved — `getTrackersForQuestions` batch function added to `trackerService.ts`; `loadWeekData` and `refreshWeekData` updated.

~~2. Add a `.env.example` file~~ ✅ Resolved — `.env.example` created with placeholder values.

~~3. `dist/` gitignore~~ ✅ Already handled — `dist` was already in `.gitignore` and was never tracked.

~~1. Wire `withRetry` into service calls~~ ✅ Resolved — wired into `saveAnswer` with `isTransientResult`.

~~2. Add auth Context provider~~ ✅ Resolved — `AuthContext` + `AuthProvider` + `useAuthContext()` added; `MainNavigation` reads auth state directly from context.

~~3. Deduplicate `loadWeekData` / `refreshWeekData`~~ ✅ Resolved — shared `_fetchAndStoreWeekData` helper extracted.

~~4. Fix `updateCheckInNotes` to use upsert~~ ✅ Resolved — single upsert on `UNIQUE(tracker_id, check_in_date)`.

~~5. Split `usePowerPage.ts`~~ ✅ Resolved — `useWeekData.ts` (data loading) + `usePowerPage.ts` (actions).

~~6. Raise coverage thresholds~~ ✅ Resolved — raised from 50/44/48/50 to 55/50/54/55 on measured files; 348 tests across 44 files.

~~7. Add tests for missing services~~ ✅ Resolved — `weekService`, `quarterService`, `questionService`, `copyWeekOrchestrator` all have unit tests.

~~8. Handle `handleSignOut()` errors~~ ✅ Resolved — try/catch + toast on failure.

~~9. Make fetch failures distinguishable~~ ✅ Resolved — `fetchUserWeeks` and `fetchUserQuarters` now throw; callers' try/catch surfaces the error.

~~10. Update `package.json` name~~ ✅ Resolved — renamed to `inner-stance-buddy`.

~~11. Replace `confirm()` with a React modal~~ ✅ Resolved — `pendingDeleteQuestion` state drives a styled confirm modal in `PowerPage.tsx`.

All 11 priorities have been resolved. The remaining open items are minor polish: JSDoc on service functions, ADR documents, and Dependabot setup.

---

## What's Working Well

**Clean hooks architecture:** The extraction of all page logic into dedicated hooks (`useAuth`, `useDashboard`, `usePowerPage`, `useLegalStatus`) is exactly the right pattern. Components are clean render-only functions; all state and side effects live in hooks that are independently testable.

**`Result<T>` error handling pattern:** The `ok`/`err`/`Result<T>` types in `lib/services/types.ts` are a genuinely good pattern. They make error handling explicit at call sites, allow callers to branch on error code (`auth` vs `db` vs `network`), and avoid the exception-vs-return-value inconsistency common in TS codebases.

**Data encryption:** Using pgsodium column-level encryption for exercise questions and answers — along with SHA-256-salted security question hashing — is a thoughtful and uncommon level of data protection for a PWA at this scale. This should be preserved and expanded to any new sensitive columns.

**Documentation depth:** The `docs/` folder is exceptional. The DEPLOYMENT_CHECKLIST.md with its "Lessons Learned" section and the detailed BACKEND.md schema reference are production-grade documentation practices that most teams skip.

**Parallel query patterns:** The use of `Promise.all` in `fetchDashboardData` and `fetchWeekWithQuestions`, and the batch insert in `copyWeekOrchestrator`, show good awareness of DB round-trip costs. These patterns should be applied to the remaining N+1 in tracker loading.
