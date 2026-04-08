# Known Security Risks — Accepted

This document lists security findings that have been reviewed and deliberately accepted rather than
fixed. Each entry records the risk, the analysis, and the conditions under which the decision
should be revisited.

Findings that have been **fixed** are not listed here — see the architecture review report
(`inner-stance-buddy-architecture-code-review-20260408-183457.md`) for the full history.

---

## RISK-001: Password reset flow has no IP-level rate limiting

**Severity:** Low (for a single-user personal application)
**Status:** Accepted — not scheduled for remediation
**Last reviewed:** 2026-04-08

### Finding

The `password-reset` Supabase Edge Function verifies a user's security question before sending a
password reset email. On a failed verification it delays 1 second, but does not enforce any
IP-based or email-based rate limit beyond what Supabase applies to the `resetPasswordForEmail`
call at the end of the flow.

A determined attacker could attempt answers at ~3 600 per hour (bottlenecked by the 1-second
delay), or distribute attempts across IPs to avoid even that constraint.

### Why this is accepted

1. **Attack surface is narrow.** The attacker must already know the target user's registered email
   address before they can probe the security question endpoint.

2. **The security question adds a second factor.** A correct answer is required before the reset
   email is sent. An attacker guessing freely-chosen, case-insensitive personal answers (pet name,
   birth city, etc.) from a dictionary has a very low per-attempt success rate.

3. **Supabase Auth imposes its own limits.** The final `resetPasswordForEmail` call is subject to
   Supabase's project-level email rate limits, which cap the number of reset emails regardless of
   how many answer attempts are made.

4. **This is a personal single-user application.** There is no large user base to protect. The
   risk of targeted brute-force against a known user's personal answers is minimal compared to the
   engineering cost of a proper distributed rate limiter.

5. **Implementation cost is high.** A meaningful IP-based rate limiter requires either a Supabase
   DB table with TTL-managed attempt counters or an external KV store (e.g. Upstash Redis), both
   of which add infrastructure dependencies and operational complexity.

### Mitigation already in place

- 1-second enforced delay on every failed attempt.
- Security answers are stored as SHA-256 hashes with per-user salts — a data breach does not
  expose the plaintext answers that an attacker would need to verify offline.
- Supabase Auth email rate limiting caps the impact even if answer verification is bypassed.

### When to revisit

- If the application is opened to multiple users.
- If a brute-force attempt is detected in the Supabase Auth logs.
- If Supabase adds native rate-limiting configuration for Edge Functions.
