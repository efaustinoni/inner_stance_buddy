/*
  # Fix auth RLS initialization pattern for user_feeds
  
  1. Update user_feeds policies to match exact Supabase recommended pattern
    - Place (select auth.jwt()->>'email') on LEFT side of comparison
    - This ensures Postgres optimizer recognizes the initPlan pattern
  
  2. The key difference: (select auth.function()) = column vs column = (select auth.function())
    - Left-side placement may help optimizer recognize the pattern better
*/

-- Drop all existing user_feeds policies
DROP POLICY IF EXISTS "Authenticated users can view own feed" ON user_feeds;
DROP POLICY IF EXISTS "Authenticated users can create own feed" ON user_feeds;
DROP POLICY IF EXISTS "Authenticated users can update own feed" ON user_feeds;
DROP POLICY IF EXISTS "Authenticated users can delete own feed" ON user_feeds;

-- Recreate with auth function on LEFT side of comparison (matching Supabase docs pattern)
CREATE POLICY "Authenticated users can view own feed"
  ON user_feeds
  FOR SELECT
  TO authenticated
  USING ((select auth.jwt()->>'email') = user_email);

CREATE POLICY "Authenticated users can create own feed"
  ON user_feeds
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.jwt()->>'email') = user_email);

CREATE POLICY "Authenticated users can update own feed"
  ON user_feeds
  FOR UPDATE
  TO authenticated
  USING ((select auth.jwt()->>'email') = user_email)
  WITH CHECK ((select auth.jwt()->>'email') = user_email);

CREATE POLICY "Authenticated users can delete own feed"
  ON user_feeds
  FOR DELETE
  TO authenticated
  USING ((select auth.jwt()->>'email') = user_email);