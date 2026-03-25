/*
  # Fix Security and Performance Issues v2

  ## Summary
  This migration addresses security linter findings by fixing RLS policies,
  indexes, and function configurations.

  ## 1. Add Missing Foreign Key Index
    - Add index on `polls.user_id` to improve join performance with auth.users
    - This was previously dropped as "unused" but is required for FK constraint optimization

  ## 2. Optimize RLS Policies - user_feeds Table
    - Replace `auth.jwt()` with `(select auth.jwt())` to prevent per-row re-evaluation
    - This improves query performance significantly at scale
    - Policies remain functionally identical

  ## 3. Drop Unused Indexes
    - Remove `idx_polls_final_slot_id` (never used in queries)
    - Remove `idx_polls_finalized_slot_id` (never used in queries)

  ## 4. Fix Function Search Path
    - Set explicit search_path on `get_expired_open_polls` function
    - Prevents potential security vulnerabilities from mutable search paths

  ## Manual Actions Required (Supabase Dashboard)
    - Auth DB Connection Strategy: Switch to percentage-based allocation
    - Leaked Password Protection: Enable in Auth settings

  ## Security Notes
    - All RLS policies continue to enforce ownership checks
    - Function now has immutable search_path
    - Index on user_id improves FK join performance
*/

-- ============================================================================
-- 1. ADD INDEX FOR polls.user_id FOREIGN KEY
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_polls_user_id ON polls(user_id);

-- ============================================================================
-- 2. FIX RLS POLICIES - user_feeds TABLE (Use subquery pattern)
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated users can view own feed" ON user_feeds;
DROP POLICY IF EXISTS "Authenticated users can create own feed" ON user_feeds;
DROP POLICY IF EXISTS "Authenticated users can update own feed" ON user_feeds;
DROP POLICY IF EXISTS "Authenticated users can delete own feed" ON user_feeds;

CREATE POLICY "Authenticated users can view own feed"
  ON user_feeds FOR SELECT
  TO authenticated
  USING (user_email = (select auth.jwt() ->> 'email'));

CREATE POLICY "Authenticated users can create own feed"
  ON user_feeds FOR INSERT
  TO authenticated
  WITH CHECK (user_email = (select auth.jwt() ->> 'email'));

CREATE POLICY "Authenticated users can update own feed"
  ON user_feeds FOR UPDATE
  TO authenticated
  USING (user_email = (select auth.jwt() ->> 'email'))
  WITH CHECK (user_email = (select auth.jwt() ->> 'email'));

CREATE POLICY "Authenticated users can delete own feed"
  ON user_feeds FOR DELETE
  TO authenticated
  USING (user_email = (select auth.jwt() ->> 'email'));

-- ============================================================================
-- 3. DROP UNUSED INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_polls_final_slot_id;
DROP INDEX IF EXISTS idx_polls_finalized_slot_id;

-- ============================================================================
-- 4. FIX FUNCTION SEARCH PATH - get_expired_open_polls
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_expired_open_polls(p_user_id uuid)
RETURNS TABLE(id uuid, title text, slot_ids uuid[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    array_agg(pts.id) as slot_ids
  FROM public.polls p
  JOIN public.poll_time_slots pts ON pts.poll_id = p.id
  WHERE p.user_id = p_user_id
    AND p.status = 'open'
  GROUP BY p.id, p.title
  HAVING MAX(pts.proposed_datetime + (p.duration_minutes || ' minutes')::interval) < NOW();
END;
$$;