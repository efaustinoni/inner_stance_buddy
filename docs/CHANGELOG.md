# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
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
