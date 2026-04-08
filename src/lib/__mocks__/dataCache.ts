// Test mock: always returns null (cache miss) so tests control Supabase responses directly.
// Without this, module-level cache state leaks between tests.

export const dataCache = {
  get: () => null,
  set: () => {},
  invalidate: () => {},
  clear: () => {},
};

export const CACHE_KEY = {
  WEEKS: 'weeks',
  QUARTERS: 'quarters',
  DASHBOARD: 'dashboard',
} as const;
