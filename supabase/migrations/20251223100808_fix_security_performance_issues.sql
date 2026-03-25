/*
  # Fix security and performance issues
  
  1. Add missing indexes for foreign keys
    - Add index on `polls.final_slot_id` (polls_final_slot_id_fkey)
    - Add index on `polls.finalized_slot_id` (polls_finalized_slot_id_fkey)
  
  2. Optimize RLS policies (Auth RLS Initialization)
    - Fix `user_feeds` policies to wrap auth.jwt() properly
    - Fix `user_profiles` policies to use (select auth.uid()) instead of auth.uid()
    - This prevents re-evaluation of auth functions for each row, improving performance
  
  3. Fix function search_path security
    - Set explicit search_path for `cancel_time_slots` function
    - Set explicit search_path for `confirm_time_slot` function
  
  4. Notes
    - "Unused Index" warnings are expected for newly created indexes (they'll be used as system runs)
    - Auth DB Connection Strategy: Must be changed in Supabase Dashboard (cannot be set via migration)
    - Leaked Password Protection: Must be enabled in Supabase Dashboard Auth settings
*/

-- 1. Add missing indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_polls_final_slot_id ON polls(final_slot_id);
CREATE INDEX IF NOT EXISTS idx_polls_finalized_slot_id ON polls(finalized_slot_id);

-- 2. Fix user_feeds RLS policies for optimal performance
-- user_feeds uses user_email, and the policies already use SELECT but need to wrap the entire expression
DROP POLICY IF EXISTS "Authenticated users can view own feed" ON user_feeds;
DROP POLICY IF EXISTS "Authenticated users can create own feed" ON user_feeds;
DROP POLICY IF EXISTS "Authenticated users can update own feed" ON user_feeds;
DROP POLICY IF EXISTS "Authenticated users can delete own feed" ON user_feeds;

-- Recreate with properly wrapped auth.jwt() calls
CREATE POLICY "Authenticated users can view own feed"
  ON user_feeds
  FOR SELECT
  TO authenticated
  USING (user_email = (SELECT auth.jwt()->>'email'));

CREATE POLICY "Authenticated users can create own feed"
  ON user_feeds
  FOR INSERT
  TO authenticated
  WITH CHECK (user_email = (SELECT auth.jwt()->>'email'));

CREATE POLICY "Authenticated users can update own feed"
  ON user_feeds
  FOR UPDATE
  TO authenticated
  USING (user_email = (SELECT auth.jwt()->>'email'))
  WITH CHECK (user_email = (SELECT auth.jwt()->>'email'));

CREATE POLICY "Authenticated users can delete own feed"
  ON user_feeds
  FOR DELETE
  TO authenticated
  USING (user_email = (SELECT auth.jwt()->>'email'));

-- 3. Fix user_profiles RLS policies for optimal performance
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Recreate with optimized auth.uid() calls
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id AND deleted_at IS NULL);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id AND deleted_at IS NULL)
  WITH CHECK ((SELECT auth.uid()) = id AND deleted_at IS NULL);

-- 4. Fix function search_path security issues
-- Recreate cancel_time_slots with explicit search_path
CREATE OR REPLACE FUNCTION cancel_time_slots(
  slot_ids uuid[],
  cancellation_timestamp timestamptz
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE poll_time_slots
  SET 
    status = 'cancelled',
    cancelled_at = cancellation_timestamp
  WHERE id = ANY(slot_ids);
END;
$$;

-- Recreate confirm_time_slot with explicit search_path
CREATE OR REPLACE FUNCTION confirm_time_slot(
  slot_id uuid,
  confirmation_timestamp timestamptz
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE poll_time_slots
  SET 
    status = 'confirmed',
    cancelled_at = NULL
  WHERE id = slot_id;
END;
$$;