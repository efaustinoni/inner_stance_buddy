// Created: 2026-04-08
// Module-level data cache — prevents redundant Supabase fetches when navigating between pages.
//
// Strategy: stale-while-revalidate-lite
//   - Reads return the cached value within the TTL window.
//   - Write operations call invalidate() on the relevant keys immediately.
//   - The TTL (30 s) is a safety net for any missed invalidation.
//   - Cache is cleared entirely on sign-out.

const TTL_MS = 30_000;

interface Entry<T> {
  data: T;
  expiresAt: number;
}

class DataCache {
  private store = new Map<string, Entry<unknown>>();

  /** Returns cached data if present and not expired; removes stale entry and returns null otherwise. */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  /** Stores data under `key` for TTL_MS milliseconds. */
  set<T>(key: string, data: T): void {
    this.store.set(key, { data, expiresAt: Date.now() + TTL_MS });
  }

  /** Removes specific keys — call after any write operation that affects cached data. */
  invalidate(...keys: string[]): void {
    for (const k of keys) this.store.delete(k);
  }

  /** Wipes the entire cache — call on sign-out. */
  clear(): void {
    this.store.clear();
  }
}

export const dataCache = new DataCache();

/** Cache key constants — one source of truth for all service modules. */
export const CACHE_KEY = {
  /** Result of fetchUserWeeks() */
  WEEKS: 'weeks',
  /** Result of fetchUserQuarters() */
  QUARTERS: 'quarters',
  /** Result of fetchDashboardData() */
  DASHBOARD: 'dashboard',
} as const;
