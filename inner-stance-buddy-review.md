# Architecture & Code Quality Report: Inner Stance Buddy

## Overall Grade: B (78/100)

Inner Stance Buddy is a well-structured React/TypeScript PWA with a Supabase backend for a coaching and exercise-tracking use case. The codebase is clean, well-typed, and shows thoughtful decisions around security (column-level encryption, hashed security answers, security headers). The main areas holding it back are a monolithic service layer, basic error handling that silently swallows failures, and a lack of CI/CD automation.

## Grading Scale

| Grade | Score  | Meaning                                             |
| ----- | ------ | --------------------------------------------------- |
| A     | 90-100 | Excellent. Production-grade, follows best practices |
| B     | 75-89  | Good. Solid foundations, minor improvements needed  |
| C     | 60-74  | Adequate. Clear weaknesses that need attention      |
| D     | 40-59  | Below average. Significant issues creating risk     |
| F     | 0-39   | Poor. Fundamental problems needing urgent attention |

## Scorecard

| #   | Dimension                             | Weight | Grade | Score | Summary                                                                           |
| --- | ------------------------------------- | ------ | ----- | ----- | --------------------------------------------------------------------------------- |
| 1   | Architecture & Modularization         | 15%    | B     | 78    | Clear folder structure but App.tsx is a monolithic router                         |
| 2   | Shared Components & Reuse             | 10%    | B     | 76    | Good UI library and service layer, but exerciseService.ts is oversized            |
| 3   | Code Quality & Readability            | 15%    | B+    | 82    | Clean TypeScript, consistent conventions, proper tooling                          |
| 4   | Error Handling & Graceful Degradation | 15%    | C+    | 72    | Errors caught but silently swallowed — no user-facing feedback                    |
| 5   | Testing                               | 10%    | C     | 68    | Infrastructure in place, but 29 test files for 66 source files with unclear depth |
| 6   | Technical Debt & Code Debt            | 10%    | A-    | 88    | Zero TODOs/FIXMEs, clean codebase, minor stale artifacts                          |
| 7   | Code Efficiency & Performance         | 10%    | B     | 77    | Good use of memoization, but sequential DB calls where batching is possible       |
| 8   | Security                              | 5%     | A-    | 88    | Column encryption, hashed answers, security headers, RLS, secrets scan            |
| 9   | DevOps & CI/CD                        | 5%     | C+    | 73    | Husky hooks and commitlint, but no CI/CD pipeline or containerization             |
| 10  | Documentation & Developer Experience  | 5%     | A     | 92    | 11 docs covering security, deployment, legal, PWA, and more                       |

## Detailed Analysis

### 1. Architecture & Modularization — B (78/100)

_What this measures: How well the codebase is structured into clear, independent modules with well-defined boundaries and separation of concerns._

The project has a logical folder structure that organizes components by domain: `components/exercises/`, `components/layout/`, `components/pages/`, `components/profile/`, and `components/ui/`. Each domain uses barrel `index.ts` files for clean imports. The `lib/` directory separates service logic from UI, and Supabase edge functions and migrations live in their own `supabase/` directory.

The main architectural weakness is `App.tsx` (318 lines). It serves as router, auth manager, legal status checker, timezone detector, and profile loader all in one file. The routing is done manually via `window.location.pathname` matching instead of using a routing library. This means route-level code splitting isn't possible, and adding new routes requires editing this single file.

There's no state management beyond React's `useState`. All global state (user, legal status, userName) lives in `App.tsx` and is threaded through props. This works at the current scale, but will become unwieldy as features are added.

**Strengths:**

- Clear domain-based folder structure (`exercises/`, `layout/`, `pages/`, `profile/`, `ui/`)
- Barrel exports via `index.ts` for clean import paths
- Service layer (`lib/`) cleanly separated from UI

**Issues:**

- `App.tsx` is a monolithic router + state manager (318 lines)
- Manual routing via `window.history.pushState` instead of a routing library
- No state management beyond prop-drilling from App.tsx

---

### 2. Shared Components & Reuse — B (76/100)

_What this measures: How effectively common patterns, utilities, and components are extracted and reused rather than duplicated across the codebase._

A reusable UI component library exists in `components/ui/` with `Card`, `Button`, `Badge`, and `Avatar` — all with variant support and clean TypeScript interfaces. The `Card` component, for example, supports four visual variants (`light`, `dark`, `glass`, `elevated`) and configurable padding.

The service layer in `lib/exerciseService.ts` centralizes all Supabase database operations, which avoids scattering queries across components. However, this file has grown to 951 lines with 25+ exported functions. It's essentially a god-module that covers exercises, weeks, quarters, questions, answers, progress trackers, check-ins, dashboard data, and image extraction.

The `lib/timezone/` directory shows good modular thinking — it splits timezone logic into `data/`, `utils/`, and `types.ts` with a clean barrel export.

**Strengths:**

- Reusable UI components (`Card`, `Button`, `Badge`, `Avatar`) with variant support
- Centralized service layer keeps DB queries out of components
- Well-structured timezone module as an example of good decomposition

**Issues:**

- `exerciseService.ts` at 951 lines is a god-module — should be split by domain (quarters, weeks, questions, trackers, dashboard)
- Only 4 shared UI components — some patterns (e.g., loading spinners, empty states) are repeated inline across pages

---

### 3. Code Quality & Readability — B+ (82/100)

_What this measures: How clean, consistent, and understandable the code is — whether someone new could read it and follow what's happening._

TypeScript is used throughout with well-defined interfaces for all data types (`ExerciseWeek`, `ExerciseQuestion`, `QuestionWithAnswer`, `WeekWithQuestions`, etc.). Naming conventions are consistent: PascalCase for components, camelCase for functions and variables.

The tooling setup is solid: ESLint with TypeScript support, Prettier for formatting, lint-staged with Husky pre-commit hooks, and commitlint for conventional commits. Every source file has a creation date and last-updated timestamp in the header comments, which is a nice touch for traceability.

Code is generally clean and readable. Functions are well-named and mostly focused on a single task. The `DashboardPage.tsx` uses `useMemo` effectively for derived state like filtering and grouping.

**Strengths:**

- TypeScript throughout with clear interface definitions
- Consistent naming conventions
- Prettier + ESLint + lint-staged + commitlint = enforced consistency
- File-level timestamps for traceability

**Issues:**

- Some components are long (DashboardPage: 544 lines) — the `QuestionCard` sub-component at the bottom could be its own file
- `supabase.ts` contains stale `Poll`, `PollTimeSlot`, `PollResponse`, and `PollResponseSlot` types that appear unused (4 references, all definitions)

---

### 4. Error Handling & Graceful Degradation — C+ (72/100)

_What this measures: How well the application handles unexpected situations — bad input, failed services, edge cases — without crashing or exposing internals._

Error handling follows a consistent pattern across the codebase: every Supabase call is wrapped in try-catch or checks for an error response, and errors are logged to `console.error`. The problem is that errors are then silently swallowed — functions return `null`, `false`, or `[]`, and the UI shows no feedback to the user.

For example, if `fetchDashboardData()` fails, the user sees an empty dashboard with no indication that something went wrong. If `saveAnswer()` fails, the user gets no feedback that their answer wasn't saved. This is particularly risky for data loss scenarios.

The `extractQuestionsFromImage` function in `exerciseService.ts` is a better example: it checks for network errors, HTTP status, and unexpected response shapes. But even there, the user doesn't get a meaningful error message.

Loading states are implemented (spinner shown during auth check and data fetches), which is good. But there's no error state UI anywhere.

**Strengths:**

- Consistent error catching — no uncaught promise rejections
- Proper null checks and optional chaining throughout
- Loading states for async operations

**Issues:**

- All errors silently swallowed (`console.error` + return null/false/[])
- No user-facing error messages, toasts, or error boundaries
- No retry logic for failed network requests
- Data loss risk: user edits could silently fail without feedback

---

### 5. Testing — C (68/100)

_What this measures: Whether there is a meaningful testing strategy — not just whether tests exist, but whether they actually catch bugs and cover important behavior._

Test infrastructure is in place: Vitest as the test runner, Testing Library for component testing, Playwright for E2E tests, and proper mock files in `lib/__mocks__/` for `supabase`, `exerciseService`, `legalService`, and `crypto`.

There are 29 test files for approximately 66 source files (44% file coverage). Every component has a co-located `.test.tsx` file, which is good practice. The E2E suite has 2 specs (`auth.spec.ts` at 72 lines, `smoke.spec.ts` at 42 lines) — enough for basic smoke testing but not comprehensive.

The main concern is test depth. The service layer (`exerciseService.ts` at 951 lines with 25+ functions) has no unit tests — only a mock file. This is the most critical business logic in the app, and it's entirely untested.

**Strengths:**

- Vitest + Testing Library + Playwright = good test tooling
- Co-located test files for every component
- Proper mocks for external dependencies
- Husky pre-push hook runs tests

**Issues:**

- Service layer (`exerciseService.ts`, `legalService.ts`) has zero unit tests — only mocks
- E2E suite is minimal (2 specs, 114 lines total)
- No test coverage thresholds configured

---

### 6. Technical Debt & Code Debt — A- (88/100)

_What this measures: How much accumulated cruft, shortcuts, and unresolved issues are slowing down development or creating hidden risk._

The codebase is remarkably clean. A grep for TODO, FIXME, HACK, and XXX across all source files returns zero results. Dependencies are modern and not wildly outdated. The Knip tool is configured for detecting dead code and unused exports.

The few debt items are minor: the stale `Poll`-related types in `supabase.ts` (4 type definitions that appear unused), some migration files with double `.sql.sql` extensions (e.g., `20260329094212_...sql.sql`), and a few CSV data files in `src/data/` that may be leftover from an import process.

**Strengths:**

- Zero TODO/FIXME/HACK comments in the entire codebase
- Modern, up-to-date dependencies
- Knip configured for dead code detection
- `depcheck` available for unused dependency detection

**Issues:**

- Stale `Poll*` type definitions in `supabase.ts` (from a previous project iteration?)
- Migration files with double `.sql.sql` extensions (naming inconsistency)
- CSV files in `src/data/` may be stale import artifacts

---

### 7. Code Efficiency & Performance — B (77/100)

_What this measures: Whether the code avoids obvious performance anti-patterns and handles resources responsibly._

The `DashboardPage` makes good use of `useMemo` for filtering, grouping, and stats computation — ensuring expensive operations don't re-run on every render. The `fetchDashboardData` function in the service layer uses `Map` lookups for joining data, which is efficient.

However, there are patterns that could be improved. `fetchWeekWithQuestions` makes 3 sequential Supabase calls (week, questions, answers) that could potentially be combined or parallelized. `bulkImportQuestions` inserts questions one-by-one in a loop ("to guarantee order and get reliable IDs"), but this means N+1 round trips to the database for N questions. `copyWeekToQuarter` has a similar sequential pattern.

The PWA setup with service worker and proper cache headers for static assets is good for client-side performance.

**Strengths:**

- Effective `useMemo` usage for derived state in components
- `Map`-based lookups in `fetchDashboardData` for efficient joins
- PWA with service worker and proper cache headers (`immutable` for hashed assets)

**Issues:**

- Sequential DB calls in `fetchWeekWithQuestions` — 3 round-trips instead of 1 joined query
- `bulkImportQuestions` does N sequential inserts instead of batch
- `copyWeekToQuarter` also uses sequential inserts in a loop

---

### 8. Security — A- (88/100)

_What this measures: Whether basic security practices are followed — secrets management, input sanitization, auth patterns, and dependency hygiene._

Security is a clear strength. The project implements column-level encryption using `pgcrypto` with a symmetric key stored in Supabase Vault. Sensitive data (answers, question text, check-in notes) is encrypted at rest, with decrypted views for authenticated access. Security answers are hashed with SHA-256 before storage.

The `_headers` file configures security headers: `X-Frame-Options: DENY`, `X-XSS-Protection`, `X-Content-Type-Options: nosniff`, and a strict referrer policy. The `.env` file is properly gitignored. A `secrets-scan.sh` script exists for detecting leaked secrets. Supabase Row Level Security (RLS) is referenced in migrations.

**Strengths:**

- Column-level encryption via pgcrypto + Vault for sensitive user data
- SHA-256 hashed security answers (`lib/crypto.ts`)
- Security headers configured (`X-Frame-Options: DENY`, `nosniff`, etc.)
- `.env` in `.gitignore`, secrets scan script available
- RLS policies in Supabase migrations

**Issues:**

- Edge function CORS allows `'*'` origin — should be restricted to the app's domain
- No CSP (Content Security Policy) header configured
- SHA-256 for security answers lacks salt — identical answers produce identical hashes

---

### 9. DevOps & CI/CD — C+ (73/100)

_What this measures: Whether there is automated infrastructure for building, testing, and deploying the application reliably._

Local development tooling is solid: Husky pre-commit hooks run lint-staged (Prettier), and a pre-push hook could be running tests. Commitlint enforces conventional commit messages. Scripts exist for docs audit, file size audit, secrets scanning, and test auditing.

However, there are no CI/CD configuration files. No GitHub Actions, no CircleCI, no Docker. This means tests, linting, and builds aren't automatically verified on pull requests. Deployment appears to be manual — a `DEPLOYMENT_CHECKLIST.md` document exists, which implies a human-driven process. For a production app handling user data with encryption, automated CI/CD is important.

**Strengths:**

- Husky pre-commit hooks with lint-staged
- Commitlint for conventional commit messages
- Audit scripts for docs, file sizes, secrets, and test coverage

**Issues:**

- No CI/CD pipeline (no GitHub Actions, no automated testing on PRs)
- No Dockerfile or containerization
- Deployment appears to be manual (deployment checklist doc)
- No automated security/dependency scanning in a pipeline

---

### 10. Documentation & Developer Experience — A (92/100)

_What this measures: How easy it is for a new developer to understand, set up, and contribute to the project._

Documentation is comprehensive. The `docs/` directory contains 11 documents covering: backend architecture, frontend architecture, branding/customization, a changelog, data retention policy, deployment checklist, legal documents guide, PWA installation guide, security configuration, implementation plan, and a user guide.

This level of documentation is unusual for a project this size and indicates serious thought about maintainability and compliance (data retention policy, legal documents guide).

**Strengths:**

- 11 dedicated documentation files covering architecture, security, deployment, legal, and UX
- Data retention policy and legal documents guide (compliance-aware)
- Changelog maintained
- Deployment checklist for operations

**Issues:**

- `README.md` is minimal (2 lines, just a StackBlitz link) — should be the entry point for new developers
- No architecture diagram
- No `CONTRIBUTING.md` or development setup instructions in the README

---

## Top 5 Priorities

1. **Add user-facing error handling** — Replace the silent `console.error + return null` pattern with error states, toast notifications, or error boundaries. This directly impacts user trust and data integrity. Effort: medium (1-2 days).

2. **Split `exerciseService.ts`** — Break the 951-line service file into domain-specific modules: `quarterService.ts`, `weekService.ts`, `questionService.ts`, `trackerService.ts`, `dashboardService.ts`. Effort: small (half a day, no logic changes).

3. **Set up CI/CD** — Add a GitHub Actions workflow that runs `lint`, `typecheck`, `test`, and `build` on every PR. This catches regressions before they merge. Effort: small (a few hours).

4. **Add service layer tests** — The business logic in `exerciseService.ts` is the core of the app and currently has zero unit tests. Even basic tests for `bulkImportQuestions`, `copyWeekToQuarter`, and `fetchDashboardData` would add meaningful safety. Effort: medium (1-2 days).

5. **Introduce a router** — Replace the manual `window.location.pathname` matching in `App.tsx` with a lightweight router (e.g., `wouter` or React Router). This enables code splitting, cleaner route management, and reduces App.tsx complexity. Effort: medium (1 day).

## What's Working Well

- **Security posture** is strong for a project this size — column encryption, hashed security answers, security headers, RLS, and secrets scanning show real security awareness.
- **TypeScript discipline** is excellent — proper interfaces everywhere, no `any` types spotted, consistent conventions.
- **Developer tooling** (Prettier, ESLint, commitlint, lint-staged, Husky, Knip) creates a good baseline for code quality.
- **Documentation breadth** is impressive — 11 docs covering architecture, security, compliance, and operations is rare and valuable.
- **Zero tech debt markers** (no TODOs, FIXMEs, or HACKs) suggests the team is disciplined about not leaving shortcuts in the code.
