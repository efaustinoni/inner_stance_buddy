// Created: 2026-04-08
// Shared result type for service functions that need to propagate error context to the UI.
// Functions that only return data (fetches) continue to use T | null.
// Use Result<T> for write operations where the failure reason determines the user message.

export type ServiceError = {
  /** Broad error category so callers can branch on cause without parsing strings. */
  code: 'auth' | 'network' | 'db';
  /** Raw message from Supabase or a human-readable description. */
  message: string;
};

export type Result<T = void> = { ok: true; data: T } | { ok: false; error: ServiceError };

/** Convenience constructor for a successful result. */
export const ok = <T>(data: T): Result<T> => ({ ok: true, data });

/** Convenience constructor for a failed result. */
export const err = (code: ServiceError['code'], message: string): Result<never> => ({
  ok: false,
  error: { code, message },
});
