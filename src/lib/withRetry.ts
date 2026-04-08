// Created: 2026-04-08
// Utility: withRetry
// Retries an async operation when a predicate says the result is transient.
// Uses exponential backoff. Callers stay in their loading state for the full duration.

export interface RetryOptions {
  /** Total number of attempts (1 = no retry). Default: 3 */
  attempts?: number;
  /** Delay before first retry in ms. Doubles on each subsequent retry. Default: 500 */
  delayMs?: number;
}

/**
 * Retries `fn` up to `attempts` times while `shouldRetry(result)` returns true.
 * The caller never sees intermediate failures — only the final result is returned.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  shouldRetry: (result: T) => boolean,
  options: RetryOptions = {}
): Promise<T> {
  const { attempts = 3, delayMs = 500 } = options;
  let result = await fn();
  let delay = delayMs;

  for (let attempt = 1; attempt < attempts; attempt++) {
    if (!shouldRetry(result)) break;
    await new Promise<void>((resolve) => setTimeout(resolve, delay));
    result = await fn();
    delay *= 2;
  }

  return result;
}

/**
 * Predicate for Result<T> — retry on db/network codes, never on auth.
 * Auth failures are permanent: retrying won't help a logged-out user.
 */
export const isTransientResult = (result: { ok: boolean; error?: { code: string } }): boolean =>
  !result.ok && (result as { ok: false; error: { code: string } }).error.code !== 'auth';
