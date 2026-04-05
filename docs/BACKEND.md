# Backend Documentation

The backend is entirely hosted on Supabase: PostgreSQL with Row-Level Security, column-level encryption via the `pgsodium` extension, and Deno-based Edge Functions.

---

## 3 Edge Functions

All edge functions live under `supabase/functions/<name>/index.ts` and are deployed to the Supabase project via `supabase functions deploy`.

### delete-account

`supabase/functions/delete-account/index.ts`
Soft-deletes the authenticated user's account.

- Verifies the caller's JWT via `supabase.auth.getUser()`.
- Updates `user_profiles` to set `deleted_at`, `purge_at` (15 days from now), `purge_reason`, and `purge_state = 'SCHEDULED'`.
- Inserts a record into `user_purge_audit` for compliance logging.
- Signs the user out and returns the scheduled purge timestamp.
- Requires: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

### extract-questions-from-image

`supabase/functions/extract-questions-from-image/index.ts`
Extracts structured exercise questions from an uploaded image using OpenAI Vision.

- Accepts `{ imageBase64, mimeType }` in the POST body.
- Sends the image to the OpenAI Chat Completions API with a structured extraction prompt.
- Returns `{ weekNumber, theme, questions: [{ label, text, answer }] }`.
- Requires: `OPENAI_API_KEY`, `OPENAI_MODEL` (defaults to `gpt-4o`).

### password-reset

`supabase/functions/password-reset/index.ts`
Custom two-step password reset flow with security question verification.

- **`action: 'get-question'`** — looks up the user's `security_question` by email (non-deleted accounts only).
- **`action: 'verify-answer'`** — hashes the provided answer with SHA-256 and compares it to `security_answer_hash`. On match, calls `supabase.auth.resetPasswordForEmail` to send the reset link.
- Includes a 1-second delay on failed verification to mitigate brute-force attacks.
- Requires: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

---

## Database Tables

All tables are in the `public` schema with Row-Level Security enabled. Users can only access their own rows unless explicitly noted.

### user_terms_agreements

Tracks each acceptance event for Terms of Service and Privacy Policy.

| Column                   | Type        | Notes                                  |
| ------------------------ | ----------- | -------------------------------------- |
| `id`                     | uuid        | Primary key                            |
| `user_id`                | uuid        | References `auth.users`                |
| `terms_version`          | text        | Date string of accepted terms          |
| `privacy_version`        | text        | Date string of accepted privacy policy |
| `terms_version_string`   | text        | Human-readable version (e.g. "1.2")    |
| `privacy_version_string` | text        | Human-readable version                 |
| `agreed_at`              | timestamptz | When the user accepted                 |

### legal_documents

Registry of active legal documents served from Supabase Storage.

| Column                | Type    | Notes                                  |
| --------------------- | ------- | -------------------------------------- |
| `id`                  | uuid    | Primary key                            |
| `document_type`       | text    | `'terms'` or `'privacy'`               |
| `version`             | text    | Semantic version string                |
| `last_updated`        | date    | Last-updated date                      |
| `file_path`           | text    | Storage path for the PDF               |
| `is_active`           | boolean | Only active documents are served       |
| `requires_acceptance` | boolean | Whether users must re-accept on update |

### user_profiles

Extended profile data for each authenticated user.

| Column                 | Type        | Notes                                        |
| ---------------------- | ----------- | -------------------------------------------- |
| `id`                   | uuid        | References `auth.users`                      |
| `email`                | text        | Denormalised for lookups                     |
| `display_name`         | text        | User-chosen display name                     |
| `avatar_url`           | text        | URL to avatar image                          |
| `timezone`             | text        | IANA timezone string (default `'UTC'`)       |
| `security_question`    | text        | For password recovery                        |
| `security_answer_hash` | text        | SHA-256 hash of lowercased answer            |
| `deleted_at`           | timestamptz | Set on soft delete                           |
| `purge_at`             | timestamptz | Hard-delete date (15 days after soft delete) |
| `purge_reason`         | text        | e.g. `'ACCOUNT_DELETION_15D'`                |
| `purge_state`          | text        | `'SCHEDULED'`, `'COMPLETED'`, etc.           |

### exercise_quarters

User-defined groupings for exercise weeks (e.g. "2026-Q1").

| Column       | Type        | Notes                        |
| ------------ | ----------- | ---------------------------- |
| `id`         | uuid        | Primary key                  |
| `user_id`    | uuid        | Owner                        |
| `label`      | text        | Display name for the quarter |
| `created_at` | timestamptz |                              |
| `updated_at` | timestamptz |                              |

### exercise_weeks

Individual exercise weeks with a number and topic.

| Column        | Type        | Notes                                         |
| ------------- | ----------- | --------------------------------------------- |
| `id`          | uuid        | Primary key                                   |
| `user_id`     | uuid        | Owner                                         |
| `week_number` | integer     | Display number                                |
| `title`       | text        | Always `'Exercise'` (reserved for future use) |
| `topic`       | text        | Theme/topic for the week                      |
| `quarter_id`  | uuid        | FK to `exercise_quarters` (nullable)          |
| `created_at`  | timestamptz |                                               |
| `updated_at`  | timestamptz |                                               |

### exercise_questions (encrypted)

Questions belonging to a week. Question text is encrypted at rest via `pgsodium` column-level encryption.

Accessed through the `decrypted_exercise_questions` view (RLS-protected, `SECURITY INVOKER`).

| Column           | Type      | Notes                     |
| ---------------- | --------- | ------------------------- |
| `id`             | uuid      | Primary key               |
| `week_id`        | uuid      | FK to `exercise_weeks`    |
| `question_label` | text      | e.g. "Reflectie 1a"       |
| `question_text`  | encrypted | Decrypted via view        |
| `sort_order`     | integer   | Display order within week |

### exercise_answers (encrypted)

User answers to exercise questions. Answer text is encrypted at rest.

Accessed through the `decrypted_exercise_answers` view.

| Column        | Type        | Notes                      |
| ------------- | ----------- | -------------------------- |
| `id`          | uuid        | Primary key                |
| `question_id` | uuid        | FK to `exercise_questions` |
| `user_id`     | uuid        | Owner                      |
| `answer_text` | encrypted   | Decrypted via view         |
| `created_at`  | timestamptz |                            |
| `updated_at`  | timestamptz |                            |

### progress_trackers

Links a user to a specific question for daily check-in tracking.

| Column        | Type        | Notes                      |
| ------------- | ----------- | -------------------------- |
| `id`          | uuid        | Primary key                |
| `user_id`     | uuid        | Owner                      |
| `question_id` | uuid        | FK to `exercise_questions` |
| `started_at`  | date        | Start date of tracking     |
| `created_at`  | timestamptz |                            |

### progress_check_ins

Daily check-in records for a progress tracker.

| Column          | Type        | Notes                                |
| --------------- | ----------- | ------------------------------------ |
| `id`            | uuid        | Primary key                          |
| `tracker_id`    | uuid        | FK to `progress_trackers`            |
| `user_id`       | uuid        | Owner                                |
| `check_in_date` | date        | The date of the check-in             |
| `is_done`       | boolean     | Whether the daily goal was completed |
| `notes`         | text        | Optional reflection notes            |
| `created_at`    | timestamptz |                                      |
| `updated_at`    | timestamptz |                                      |
