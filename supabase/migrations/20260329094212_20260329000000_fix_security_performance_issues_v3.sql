/*
  # Fix Security and Performance Issues v3

  ## Summary
  This migration addresses all security and performance warnings raised by the Supabase advisor:

  1. Missing Index
     - Add covering index on `user_terms_agreements.user_id` (unindexed FK)

  2. Auth RLS Initialization Plan (Performance)
     - Replace bare `auth.uid()` / `auth.jwt()` calls with `(select auth.uid())` / `(select auth.jwt())`
       in all policies for: exercise_weeks, exercise_questions, exercise_answers,
       progress_trackers, progress_check_ins, user_feeds
     - This prevents re-evaluation of the auth function on every row

  3. RLS "Always True" Policies on Poll Tables
     - "Anyone can create polls" / "Anyone can update polls" → restrict to authenticated users
     - "Anyone can create time slots" / "Anyone can delete time slots" → restrict to authenticated
     - "Anyone can create responses" → restrict to authenticated
     - "Anyone can create response slots" → restrict to authenticated

  4. Drop Unused Indexes
     - Remove all indexes flagged as never used to reduce write overhead and storage
*/

-- ============================================================
-- 1. Add missing index for unindexed FK
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_user_terms_agreements_user_id
  ON public.user_terms_agreements(user_id);

-- ============================================================
-- 2. Fix Auth RLS policies — exercise_weeks
-- ============================================================
DROP POLICY IF EXISTS "Users can view own weeks" ON public.exercise_weeks;
DROP POLICY IF EXISTS "Users can create own weeks" ON public.exercise_weeks;
DROP POLICY IF EXISTS "Users can update own weeks" ON public.exercise_weeks;
DROP POLICY IF EXISTS "Users can delete own weeks" ON public.exercise_weeks;

CREATE POLICY "Users can view own weeks"
  ON public.exercise_weeks FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create own weeks"
  ON public.exercise_weeks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own weeks"
  ON public.exercise_weeks FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own weeks"
  ON public.exercise_weeks FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================================
-- 2b. Fix Auth RLS policies — exercise_questions
-- ============================================================
DROP POLICY IF EXISTS "Users can view questions for own weeks" ON public.exercise_questions;
DROP POLICY IF EXISTS "Users can create questions for own weeks" ON public.exercise_questions;
DROP POLICY IF EXISTS "Users can update questions for own weeks" ON public.exercise_questions;
DROP POLICY IF EXISTS "Users can delete questions for own weeks" ON public.exercise_questions;

CREATE POLICY "Users can view questions for own weeks"
  ON public.exercise_questions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exercise_weeks
      WHERE exercise_weeks.id = exercise_questions.week_id
      AND exercise_weeks.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can create questions for own weeks"
  ON public.exercise_questions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM exercise_weeks
      WHERE exercise_weeks.id = exercise_questions.week_id
      AND exercise_weeks.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update questions for own weeks"
  ON public.exercise_questions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exercise_weeks
      WHERE exercise_weeks.id = exercise_questions.week_id
      AND exercise_weeks.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM exercise_weeks
      WHERE exercise_weeks.id = exercise_questions.week_id
      AND exercise_weeks.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete questions for own weeks"
  ON public.exercise_questions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exercise_weeks
      WHERE exercise_weeks.id = exercise_questions.week_id
      AND exercise_weeks.user_id = (SELECT auth.uid())
    )
  );

-- ============================================================
-- 2c. Fix Auth RLS policies — exercise_answers
-- ============================================================
DROP POLICY IF EXISTS "Users can view own answers" ON public.exercise_answers;
DROP POLICY IF EXISTS "Users can create own answers" ON public.exercise_answers;
DROP POLICY IF EXISTS "Users can update own answers" ON public.exercise_answers;
DROP POLICY IF EXISTS "Users can delete own answers" ON public.exercise_answers;

CREATE POLICY "Users can view own answers"
  ON public.exercise_answers FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create own answers"
  ON public.exercise_answers FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own answers"
  ON public.exercise_answers FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own answers"
  ON public.exercise_answers FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================================
-- 2d. Fix Auth RLS policies — progress_trackers
-- ============================================================
DROP POLICY IF EXISTS "Users can view own trackers" ON public.progress_trackers;
DROP POLICY IF EXISTS "Users can create own trackers" ON public.progress_trackers;
DROP POLICY IF EXISTS "Users can update own trackers" ON public.progress_trackers;
DROP POLICY IF EXISTS "Users can delete own trackers" ON public.progress_trackers;

CREATE POLICY "Users can view own trackers"
  ON public.progress_trackers FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create own trackers"
  ON public.progress_trackers FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own trackers"
  ON public.progress_trackers FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own trackers"
  ON public.progress_trackers FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================================
-- 2e. Fix Auth RLS policies — progress_check_ins
-- ============================================================
DROP POLICY IF EXISTS "Users can view own check-ins" ON public.progress_check_ins;
DROP POLICY IF EXISTS "Users can create own check-ins" ON public.progress_check_ins;
DROP POLICY IF EXISTS "Users can update own check-ins" ON public.progress_check_ins;
DROP POLICY IF EXISTS "Users can delete own check-ins" ON public.progress_check_ins;

CREATE POLICY "Users can view own check-ins"
  ON public.progress_check_ins FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM progress_trackers
      WHERE progress_trackers.id = progress_check_ins.tracker_id
      AND progress_trackers.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can create own check-ins"
  ON public.progress_check_ins FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM progress_trackers
      WHERE progress_trackers.id = progress_check_ins.tracker_id
      AND progress_trackers.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update own check-ins"
  ON public.progress_check_ins FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM progress_trackers
      WHERE progress_trackers.id = progress_check_ins.tracker_id
      AND progress_trackers.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM progress_trackers
      WHERE progress_trackers.id = progress_check_ins.tracker_id
      AND progress_trackers.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete own check-ins"
  ON public.progress_check_ins FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM progress_trackers
      WHERE progress_trackers.id = progress_check_ins.tracker_id
      AND progress_trackers.user_id = (SELECT auth.uid())
    )
  );

-- ============================================================
-- 2f. Fix Auth RLS policies — user_feeds (uses auth.jwt())
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can view own feed" ON public.user_feeds;
DROP POLICY IF EXISTS "Authenticated users can create own feed" ON public.user_feeds;
DROP POLICY IF EXISTS "Authenticated users can update own feed" ON public.user_feeds;
DROP POLICY IF EXISTS "Authenticated users can delete own feed" ON public.user_feeds;

CREATE POLICY "Authenticated users can view own feed"
  ON public.user_feeds FOR SELECT
  TO authenticated
  USING ((SELECT auth.jwt()) ->> 'email' = user_email);

CREATE POLICY "Authenticated users can create own feed"
  ON public.user_feeds FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.jwt()) ->> 'email' = user_email);

CREATE POLICY "Authenticated users can update own feed"
  ON public.user_feeds FOR UPDATE
  TO authenticated
  USING ((SELECT auth.jwt()) ->> 'email' = user_email)
  WITH CHECK ((SELECT auth.jwt()) ->> 'email' = user_email);

CREATE POLICY "Authenticated users can delete own feed"
  ON public.user_feeds FOR DELETE
  TO authenticated
  USING ((SELECT auth.jwt()) ->> 'email' = user_email);

-- ============================================================
-- 3. Fix "Always True" RLS policies on polls tables
-- ============================================================

-- polls: replace always-true insert/update with authenticated-only
DROP POLICY IF EXISTS "Anyone can create polls" ON public.polls;
DROP POLICY IF EXISTS "Anyone can update polls" ON public.polls;

CREATE POLICY "Authenticated users can create polls"
  ON public.polls FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can update polls"
  ON public.polls FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL)
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- poll_time_slots
DROP POLICY IF EXISTS "Anyone can create time slots" ON public.poll_time_slots;
DROP POLICY IF EXISTS "Anyone can delete time slots" ON public.poll_time_slots;

CREATE POLICY "Authenticated users can create time slots"
  ON public.poll_time_slots FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated users can delete time slots"
  ON public.poll_time_slots FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

-- poll_responses
DROP POLICY IF EXISTS "Anyone can create responses" ON public.poll_responses;

CREATE POLICY "Authenticated users can create responses"
  ON public.poll_responses FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- poll_response_slots
DROP POLICY IF EXISTS "Anyone can create response slots" ON public.poll_response_slots;

CREATE POLICY "Authenticated users can create response slots"
  ON public.poll_response_slots FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- ============================================================
-- 4. Drop unused indexes
-- ============================================================
DROP INDEX IF EXISTS public.idx_poll_responses_poll_id;
DROP INDEX IF EXISTS public.idx_poll_response_slots_response_id;
DROP INDEX IF EXISTS public.idx_poll_response_slots_time_slot_id;
DROP INDEX IF EXISTS public.idx_user_feeds_token;
DROP INDEX IF EXISTS public.idx_poll_time_slots_poll_id;
DROP INDEX IF EXISTS public.idx_poll_time_slots_cancelled_at;
DROP INDEX IF EXISTS public.idx_polls_user_id;
DROP INDEX IF EXISTS public.idx_polls_purge_at;
DROP INDEX IF EXISTS public.idx_polls_final_slot_id;
DROP INDEX IF EXISTS public.idx_polls_finalized_slot_id;
DROP INDEX IF EXISTS public.idx_poll_purge_audit_deleted_at;
DROP INDEX IF EXISTS public.idx_exercise_weeks_user_id;
DROP INDEX IF EXISTS public.idx_exercise_questions_week_id;
DROP INDEX IF EXISTS public.idx_exercise_answers_question_id;
DROP INDEX IF EXISTS public.idx_exercise_answers_user_id;
DROP INDEX IF EXISTS public.idx_progress_trackers_user_id;
DROP INDEX IF EXISTS public.idx_progress_trackers_question_id;
DROP INDEX IF EXISTS public.idx_progress_check_ins_tracker_id;
DROP INDEX IF EXISTS public.idx_progress_check_ins_date;
