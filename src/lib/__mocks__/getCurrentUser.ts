import { supabase } from '../supabase';

// Test mock: always delegates to the mocked supabase — no module-level caching.
// This ensures each test controls the returned user independently via vi.mocked(supabase.auth.getUser).
export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
