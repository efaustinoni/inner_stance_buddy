/*
  # Fix Security and Performance Issues

  ## 1. Add Missing Foreign Key Indexes
    - Add index on `polls.final_slot_id` to improve join performance
    - Add index on `polls.finalized_slot_id` to improve join performance

  ## 2. Optimize RLS Policies (Auth RLS Initialization)
    - Update `user_feeds` policies to use `(select auth.jwt())` pattern
    - Update `user_terms_agreements` policies to use `(select auth.uid())` pattern
    - Update `user_profiles` policies to use `(select auth.uid())` pattern
    - This prevents re-evaluation of auth functions for each row, improving query performance at scale

  ## 3. Remove Unused Indexes
    - Drop unused indexes that add overhead to write operations without providing query benefits:
      - `idx_polls_creator_email`
      - `idx_polls_status`
      - `idx_poll_time_slots_status`
      - `idx_user_terms_agreements_agreed_at`
      - `idx_legal_documents_type_active`
      - `idx_polls_user_id`
      - `user_profiles_email_idx`
      - `idx_polls_cancellation_reason`

  ## 4. Fix Function Search Paths
    - Set explicit search_path for functions to prevent security vulnerabilities
    - Applied to: `handle_new_user`, `update_slot_sequence`, `get_expired_open_polls`

  ## Security Notes
    - All changes improve security posture and query performance
    - RLS policies remain functionally identical but more efficient
    - Removing unused indexes reduces write overhead and improves insert/update performance
*/

-- ============================================================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- ============================================================================

-- Add index for final_slot_id foreign key
CREATE INDEX IF NOT EXISTS idx_polls_final_slot_id 
  ON polls(final_slot_id) 
  WHERE final_slot_id IS NOT NULL;

-- Add index for finalized_slot_id foreign key
CREATE INDEX IF NOT EXISTS idx_polls_finalized_slot_id 
  ON polls(finalized_slot_id) 
  WHERE finalized_slot_id IS NOT NULL;

-- ============================================================================
-- 2. OPTIMIZE RLS POLICIES - USER_FEEDS TABLE
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view own feed" ON user_feeds;
DROP POLICY IF EXISTS "Authenticated users can create own feed" ON user_feeds;
DROP POLICY IF EXISTS "Authenticated users can update own feed" ON user_feeds;
DROP POLICY IF EXISTS "Authenticated users can delete own feed" ON user_feeds;

-- Recreate with optimized pattern using subquery
CREATE POLICY "Authenticated users can view own feed"
  ON user_feeds FOR SELECT
  TO authenticated
  USING ((select auth.jwt() ->> 'email') = user_email);

CREATE POLICY "Authenticated users can create own feed"
  ON user_feeds FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.jwt() ->> 'email') = user_email);

CREATE POLICY "Authenticated users can update own feed"
  ON user_feeds FOR UPDATE
  TO authenticated
  USING ((select auth.jwt() ->> 'email') = user_email)
  WITH CHECK ((select auth.jwt() ->> 'email') = user_email);

CREATE POLICY "Authenticated users can delete own feed"
  ON user_feeds FOR DELETE
  TO authenticated
  USING ((select auth.jwt() ->> 'email') = user_email);

-- ============================================================================
-- 3. OPTIMIZE RLS POLICIES - USER_TERMS_AGREEMENTS TABLE
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own terms agreements" ON user_terms_agreements;
DROP POLICY IF EXISTS "Users can insert own terms agreement" ON user_terms_agreements;

-- Recreate with optimized pattern
CREATE POLICY "Users can read own terms agreements"
  ON user_terms_agreements FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own terms agreement"
  ON user_terms_agreements FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- ============================================================================
-- 4. OPTIMIZE RLS POLICIES - USER_PROFILES TABLE
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON user_profiles;

-- Recreate with optimized pattern
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Service role can insert profiles"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

-- ============================================================================
-- 5. REMOVE UNUSED INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_polls_creator_email;
DROP INDEX IF EXISTS idx_polls_status;
DROP INDEX IF EXISTS idx_poll_time_slots_status;
DROP INDEX IF EXISTS idx_user_terms_agreements_agreed_at;
DROP INDEX IF EXISTS idx_legal_documents_type_active;
DROP INDEX IF EXISTS idx_polls_user_id;
DROP INDEX IF EXISTS user_profiles_email_idx;
DROP INDEX IF EXISTS idx_polls_cancellation_reason;

-- ============================================================================
-- 6. FIX FUNCTION SEARCH PATHS
-- ============================================================================

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, display_name, timezone)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'timezone', 'UTC')
  );
  RETURN new;
END;
$$;

-- Fix update_slot_sequence function
CREATE OR REPLACE FUNCTION public.update_slot_sequence()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.poll_time_slots
    SET sequence = sequence - 1
    WHERE poll_id = OLD.poll_id AND sequence > OLD.sequence;
    RETURN OLD;
  ELSIF TG_OP = 'INSERT' THEN
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Fix get_expired_open_polls function
CREATE OR REPLACE FUNCTION public.get_expired_open_polls()
RETURNS TABLE (
  poll_id uuid,
  poll_title text,
  creator_email text,
  poll_start_time timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.creator_email,
    p.start_time
  FROM public.polls p
  WHERE p.status = 'open'
    AND p.start_time < NOW()
    AND p.cancelled_at IS NULL;
END;
$$;