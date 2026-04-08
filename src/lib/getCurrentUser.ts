// Created: 2026-04-08
// Cached auth helper — eliminates redundant supabase.auth.getUser() network calls.
//
// supabase.auth.getUser() makes a network round-trip on every call to validate the JWT.
// For service functions that only need the user ID as a DB query constraint (with RLS
// providing the actual server-side security), this is wasteful.
//
// This module keeps a single cached User object and refreshes it automatically via
// onAuthStateChange. The first call in a session still validates via getUser();
// every subsequent call within the same session returns the cached value.

import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

// undefined = not yet initialized; null = confirmed unauthenticated
let _cached: User | null | undefined = undefined;

// Mirror every auth state transition into the cache
supabase.auth.onAuthStateChange((_event, session) => {
  _cached = session?.user ?? null;
});

/**
 * Returns the currently authenticated user.
 *
 * - **First call per session**: calls `supabase.auth.getUser()` (one network round-trip)
 *   and populates the cache.
 * - **Subsequent calls**: returns the cached value immediately — zero network calls.
 * - **After sign-in / sign-out / token refresh**: `onAuthStateChange` keeps the cache
 *   in sync automatically.
 *
 * RLS policies enforce the actual server-side security guarantee —
 * this cache is purely a performance optimisation.
 */
export async function getCurrentUser(): Promise<User | null> {
  if (_cached !== undefined) return _cached;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  _cached = user;
  return user;
}
