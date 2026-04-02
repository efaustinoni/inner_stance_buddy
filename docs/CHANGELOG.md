# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- 2026-04-02 16:34 UTC: Dashboard week improvements
  - Each week row is now collapsible/expandable (click the week header to toggle questions)
  - Quarter selector shown on every week (not just unassigned), allowing quarter reassignment directly from the dashboard
- 2026-04-02 16:20 UTC: Image-to-questions extraction using OpenAI vision
  - New Supabase Edge Function `extract-questions-from-image` calls OpenAI vision API (model and key read from `OPENAI_API_KEY` / `OPENAI_MODEL` secrets)
  - Images are compressed client-side (max 2048 px, JPEG 85%) before upload to stay within payload limits
  - **BulkImportModal**: new "From Image" tab — upload or photograph an exercise sheet; AI extracts questions, labels and answers automatically with a live spinner and image preview
  - **WeekModal**: same "From Image" tab available when creating a new week
  - Extracted week number and theme auto-fill the form fields; questions shown in the preview list before saving
  - Error handling for extraction failures with user-friendly messages
- 2026-04-02 12:00 UTC: Quarter aggregation for weeks
  - New `exercise_quarters` table with user-defined labels (e.g. "2026-Q2", "Q2 - Effectiveness")
  - Weeks can optionally belong to a quarter; existing weeks are preserved as "Unassigned"
  - `UNIQUE(user_id, week_number)` constraint replaced with `UNIQUE(user_id, quarter_id, week_number)` — same week number allowed across different quarters
  - **QuarterModal**: create, edit and delete quarters with duplicate label validation
  - **WeekModal**: quarter selector on create and edit; changing quarter on edit performs a Move
  - **WeekModal**: "Copy to Quarter" button with target quarter picker and "Include answers" checkbox
  - **WeekSelector**: quarter badge filter row to show only weeks from a selected quarter; unassigned weeks flagged with "(no quarter)"
  - **DashboardPage**: quarter filter dropdown; questions grouped by quarter then by week with collapsible quarter headers
  - **PowerPage**: "Manage Quarters" button to open QuarterModal
  - New service functions: `fetchUserQuarters`, `createQuarter`, `updateQuarter`, `deleteQuarter`, `moveWeekToQuarter`, `copyWeekToQuarter`
- 2026-03-29: CSV import now supports optional `label_N` columns
  - If `label_N` is omitted the parser falls back to `Vraag N` (fully backward compatible)
  - Updated CSV format hint in the Bulk Import modal to document `label_N` and `|` separator usage
  - Multi-part answers can be separated with `|` and will be displayed on individual lines in the answer field

### Fixed
- 2026-04-02 16:20 UTC: Edge function JWT verification disabled for extract-questions-from-image (fixes 401 errors)
- 2026-04-02 16:15 UTC: Image extraction error messages now show actual failure reason
- 2026-04-02 15:55 UTC: Quarter filter on dashboard had no effect (missing dependency in useMemo)
- 2026-04-02 12:00 UTC: Quarter management only allowed adding new quarters, not editing or deleting
  - QuarterModal redesigned as a full management panel listing all quarters with inline rename and delete per row
  - PowerPage handlers updated to match the new interface
- 2026-04-02: Unassigned weeks could not be assigned to a quarter from the dashboard
  - Added "Assign to quarter..." dropdown on each unassigned week header in the dashboard
  - Selecting a quarter immediately moves the week and refreshes the view
- 2026-04-02: WeekModal CSV parser was a separate, outdated implementation
  - Only supported 6 questions (now 10)
  - Only supported `answer_Na/Nb` sub-letter format (now supports `answer_N` directly)
  - Did not support `label_N`, `|` separators, BOM, or `thema` header
  - Now fully aligned with BulkImportModal CSV parsing
- 2026-03-29: Bulk import answers were not saved after import
  - Root cause: questions inserted in batch with `.insert().select()` did not guarantee return order, causing answer-to-question ID mapping to be incorrect
  - Fix: questions are now inserted one-by-one to guarantee ID order before answers are mapped
  - Answer insert failures now return `false` and propagate correctly instead of being silently ignored

- 2026-02-13: Security question management in profile page
  - Users can now update their security question and answer from their profile
  - Requires verification of current answer before allowing changes
  - New SecurityQuestionModal component with masked input fields and show/hide toggles
  - All answers continue to be hashed with SHA-256
  - Success notifications and comprehensive error handling
- 2026-02-13: Security Configuration Guide documentation
  - Comprehensive guide for enabling leaked password protection with HaveIBeenPwned
  - Security best practices and monitoring guidelines
  - Database optimization documentation
- 2026-02-06: Email verification UI after signup with "Check Your Email" screen and "Resend Verification Email" button
- 2026-02-06: Forgot Password flow with hybrid security question + email reset approach
  - User enters email, answers security question, then receives password reset email
  - Two-factor protection: requires both knowledge of security answer AND email access
  - New `password-reset` Edge Function handles question retrieval and answer verification
- 2026-02-06: Set New Password page that handles Supabase PASSWORD_RECOVERY redirect
  - Automatically shown when user clicks the password reset link from their email
  - Password confirmation field with visibility toggles
- 2026-02-06: "Forgot password?" link on the sign-in form

### Fixed
- 2026-02-13: Database optimization - removed unused index `idx_user_terms_agreements_user_id`
  - Index had 0 scans since creation, indicating it was not being used
  - Improves INSERT/UPDATE/DELETE performance by eliminating index maintenance overhead
  - Foreign key constraint and data integrity preserved
  - Will be re-evaluated when table grows beyond 1000 rows
- 2026-02-07: Logo display issue - added `object-contain` to preserve aspect ratio for non-square logos
- 2026-02-07: Critical sign-up bug - security question and terms agreement were not being saved
  - Root cause: RLS policies blocked database operations because user isn't authenticated until email confirmed
  - Fix: Now pass all signup data through Supabase user metadata
  - Updated `handle_new_user` trigger to extract and store security question, answer hash, and terms agreement
- 2026-02-07: password-reset Edge Function now correctly deployed with `verify_jwt: false`
- 2026-02-06: Critical security fix - security answers now hashed with SHA-256 before storage
  - Previously stored as plaintext in `security_answer_hash` column
  - Migration converts all existing plaintext answers to SHA-256 hashes
  - New signups hash answers client-side before sending to database
  - Edge Function uses matching SHA-256 hash comparison for verification

### Changed
- 2025-12-28: Timezone picker completely redesigned with hierarchical navigation
  - Removed "Popular" section
  - Added continent-level grouping (North America and South America as separate continents)
  - Added country-level grouping within each continent with expand/collapse support
  - Capital cities now correctly display actual capital names (e.g., "Brasilia" for Brazil, "Beijing" for China)
  - Countries with single timezone display directly; multi-timezone countries are collapsible
  - Search functionality works across city, country, continent, and IANA timezone strings
  - Capital cities marked with badge and building icon, shown first in each country
- 2025-12-26: Application streamlined to focus on authentication and profile management
  - Removed all poll and scheduling functionality
  - Removed calendar subscription features
  - Simplified to core auth features: sign-in, sign-up, profile management
  - Database cleaned: removed 6 poll-related tables, kept 4 user/legal tables
  - Reduced bundle size by ~22% (from 426 kB to 332 kB)
  - Updated documentation to reflect new scope

## [0.1.0] - 2025-12-21

### Added
- User authentication with email/password via Supabase
- User profile management with display name and timezone
- Account deletion with soft delete and 15-day retention period
- Legal document management (Terms of Service and Privacy Policy)
- Legal document acceptance tracking
- Progressive Web App (PWA) support with installability
- Version badge for beta/staging environments
- Comprehensive RLS security policies
