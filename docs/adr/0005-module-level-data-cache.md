# ADR-0005: Module-level data cache instead of React Query / SWR

**Date:** 2026-04-08
**Status:** Accepted

## Context

Every page navigation in the app triggered a full re-fetch of its data from Supabase, even when
the data had not changed. For a single-user PWA where the same data (weeks, quarters, dashboard)
is displayed on multiple pages, this produced redundant network round-trips and perceived lag when
switching between the Dashboard and Manage Weeks pages.

The standard solution in the React ecosystem is to adopt a server-state management library such as
**React Query** (TanStack Query) or **SWR**. Both would solve the problem but require:

- Adding a new dependency and wrapper provider.
- Refactoring all data-fetching hooks to use the library's conventions.
- Learning the library's cache key, invalidation, and refetch-on-focus semantics.

## Decision

Implement a **lightweight module-level TTL cache** in `src/lib/dataCache.ts` rather than adopting
React Query or SWR.

The cache is a plain ES module singleton (`Map<string, { data, expiresAt }>`). Service functions
read from it on cache hit and populate it on miss. Write operations call `cache.invalidate()` on
the relevant keys immediately. A 30-second TTL acts as a safety net for any missed invalidation.
The cache is cleared entirely on sign-out.

A companion module `src/lib/getCurrentUser.ts` applies the same pattern to `supabase.auth.getUser()`
calls: one network round-trip per session, then a module-level cached value kept in sync by
`onAuthStateChange`.

## Consequences

**Positive**

- Zero new runtime dependencies — the cache is ~50 lines of TypeScript.
- Navigating between Dashboard and Manage Weeks is now instant on the second visit (within the
  TTL window) because the service functions return the cached payload immediately.
- Write-through invalidation means in-session mutations are always reflected correctly; the TTL
  only protects against missed invalidations, not normal use.
- The pattern is transparent to hook consumers — they still call the same service functions.
- Easy to test: `__mocks__/dataCache.ts` always returns null, so unit tests control responses via
  the mocked Supabase client without cache interference.

**Negative / trade-offs**

- No automatic background refetching (refetch on window focus, refetch on reconnect) — a user who
  edits data in another tab will see stale data for up to 30 seconds.
- No pagination or infinite scroll support — React Query handles these patterns natively.
- Cache invalidation is manual: adding a new write path requires explicitly calling `invalidate()`.
  Missing an invalidation leads to a brief period of stale data (bounded by the TTL).
- The cache lives in module memory; a browser page reload always starts fresh.

**When this decision should be revisited**
If the app evolves to support multi-user collaboration, real-time subscriptions, or offline-first
behaviour, React Query or SWR would be the appropriate upgrade because they provide background
sync, optimistic updates, and persistence adapters that go far beyond what this cache offers.
