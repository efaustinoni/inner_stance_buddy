# ADR-0004: pgsodium column-level encryption for exercise content

**Date:** 2025-12-22
**Status:** Accepted

## Context

Exercise questions and user answers contain personal coaching content — reflective answers to
questions about the user's mindset, habits, and goals. This content is sensitive and should not be
readable by anyone with direct database access (including the Supabase team, a compromised service
role key, or a future database dump).

Transport-layer encryption (TLS) protects data in transit but leaves data readable at rest in the
database. Row Level Security (RLS) prevents other users from reading each other's rows, but does
not encrypt the content from database administrators or anyone with the service role key.

## Decision

Use Supabase's **pgsodium** extension for column-level encryption on `exercise_questions.question_text`
and `exercise_answers.answer_text`. Decrypted reads are served exclusively through RLS-protected
database views (`decrypted_exercise_questions`, `decrypted_exercise_answers`). The application
never reads from the raw `exercise_questions` or `exercise_answers` tables directly.

## Consequences

**Positive**

- Sensitive content is encrypted at rest in the database. A database dump, a compromised service
  role key, or direct DB console access would expose ciphertext, not plaintext.
- The encryption is transparent to the application layer: the decrypted views look and behave like
  regular tables.
- RLS policies on the views ensure that a user can only decrypt their own content — the views are
  `SECURITY INVOKER`, so the caller's JWT is used for row filtering.
- No application-level encryption key management required — pgsodium uses Vault-managed keys
  stored separately from the data.

**Negative / trade-offs**

- Question text and answer text cannot be indexed for full-text search in the database because the
  raw columns store ciphertext. Client-side filtering (via React `useMemo`) is used instead.
- The decrypted views add one layer of indirection that must be understood when writing new queries.
  Any new table that stores sensitive content must explicitly opt into this pattern.
- pgsodium is a Supabase-specific extension. Migrating to a different PostgreSQL host would require
  either installing pgsodium or re-implementing with pgcrypto.
- The `question_label` field (short label like "Reflectie 1a") is **not** encrypted because it is
  non-sensitive and used for display purposes.

**Scope of encryption**
| Field | Encrypted | Rationale |
|-------|-----------|-----------|
| `exercise_questions.question_text` | Yes | Personal coaching content |
| `exercise_answers.answer_text` | Yes | Personal reflections |
| `exercise_questions.question_label` | No | Non-sensitive display label |
| `user_profiles.security_answer_hash` | No (hashed) | SHA-256 + salt; one-way |
