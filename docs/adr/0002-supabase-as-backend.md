# ADR-0002: Supabase as the backend

**Date:** 2025-12-21
**Status:** Accepted

## Context

The app needs user authentication, a relational database with per-user data isolation, server-side
logic for sensitive operations (password reset, account deletion), and at-rest encryption for
personally sensitive content (exercise questions and answers). The project is maintained by a single
developer who cannot operate and maintain a custom backend server.

## Decision

Use **Supabase** as the complete backend: PostgreSQL database, Auth, Edge Functions (Deno), and the
`pgsodium` extension for column-level encryption.

## Consequences

**Positive**

- **Row Level Security (RLS)**: every table has RLS enabled. Users can only read/write their own
  rows, enforced at the DB layer regardless of what the frontend sends — a strong server-side
  security guarantee.
- **Column-level encryption via pgsodium**: exercise questions and answers are encrypted at rest,
  not just in transit. Decrypted reads are served through database views (`decrypted_exercise_*`)
  that are themselves RLS-protected.
- **Edge Functions (Deno)**: sensitive flows (custom password reset with security-question
  verification, account deletion with audit trail, AI image extraction) run as Supabase Edge
  Functions instead of exposing service-role keys to the client.
- **Auth**: provides JWT-based sessions, email confirmation, password breach detection via
  HaveIBeenPwned, and social providers — all without writing authentication code.
- **JS client** (`@supabase/supabase-js`): typed query builder that integrates naturally with
  TypeScript.
- **Zero infrastructure operations**: no servers to patch, scale, or back up — Supabase manages it.

**Negative / trade-offs**

- Vendor lock-in: migrating away from Supabase would require rewriting authentication, RLS policies,
  Edge Functions, and the pgsodium encryption setup.
- The `pgsodium` column-level encryption is a Supabase-specific feature. Standard PostgreSQL would
  need an alternative (e.g. `pgcrypto`).
- The JS client's query builder is not a full ORM; complex multi-table queries require `Promise.all`
  orchestration written by hand.
- Free tier has request rate limits; production load must stay within the Pro plan quotas.

**Alternatives considered**

- Firebase: lacks native relational queries and column-level encryption.
- PlanetScale + Auth0: two separate vendors with separate billing and integration overhead.
- Custom Express/Fastify API: would require infrastructure management that is out of scope for a
  solo-developer personal project.
