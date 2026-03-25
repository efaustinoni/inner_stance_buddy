/*
  # Fix remaining RLS and function security issues
  
  1. Fix user_feeds RLS policies with proper auth function initialization
    - The issue is that auth.jwt() needs to be called once per statement, not per row
    - Use a subquery pattern that forces Postgres to use an initPlan
  
  2. Drop old confirm_time_slot function without search_path
    - Remove the version without proper search_path configuration
  
  3. Notes
    - Unused indexes are expected for new/scheduled job indexes
    - Auth DB Connection Strategy: Configure in Supabase Dashboard → Settings → Database
    - Leaked Password Protection: Enable in Supabase Dashboard → Authentication → Providers
*/

-- 1. Fix user_feeds RLS policies
-- Drop all existing policies
DROP POLICY IF EXISTS "Authenticated users can view own feed" ON user_feeds;
DROP POLICY IF EXISTS "Authenticated users can create own feed" ON user_feeds;
DROP POLICY IF EXISTS "Authenticated users can update own feed" ON user_feeds;
DROP POLICY IF EXISTS "Authenticated users can delete own feed" ON user_feeds;

-- Recreate with proper subquery pattern to force initPlan
-- The key is wrapping just auth.jwt() in SELECT, not the entire expression
CREATE POLICY "Authenticated users can view own feed"
  ON user_feeds
  FOR SELECT
  TO authenticated
  USING (user_email = (select auth.jwt()->>'email'));

CREATE POLICY "Authenticated users can create own feed"
  ON user_feeds
  FOR INSERT
  TO authenticated
  WITH CHECK (user_email = (select auth.jwt()->>'email'));

CREATE POLICY "Authenticated users can update own feed"
  ON user_feeds
  FOR UPDATE
  TO authenticated
  USING (user_email = (select auth.jwt()->>'email'))
  WITH CHECK (user_email = (select auth.jwt()->>'email'));

CREATE POLICY "Authenticated users can delete own feed"
  ON user_feeds
  FOR DELETE
  TO authenticated
  USING (user_email = (select auth.jwt()->>'email'));

-- 2. Drop the old confirm_time_slot function without search_path
-- There are two versions - one with confirmation_timestamp and one without
-- Drop the one without search_path configuration
DROP FUNCTION IF EXISTS confirm_time_slot(uuid);

-- Ensure the correct version exists with search_path
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