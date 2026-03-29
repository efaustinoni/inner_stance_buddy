/*
  # Fix Unindexed Foreign Keys and Unused Index

  ## Summary
  Addresses all unindexed foreign key warnings and removes a newly-flagged unused index.

  1. Add Covering Indexes for Unindexed Foreign Keys
     - exercise_answers.user_id
     - exercise_questions.week_id
     - poll_response_slots.time_slot_id
     - poll_responses.poll_id
     - poll_time_slots.poll_id
     - polls.final_slot_id
     - polls.finalized_slot_id
     - polls.user_id
     - progress_trackers.user_id

  2. Drop Unused Index
     - idx_user_terms_agreements_user_id — flagged as never used; the FK
       is not queried in the child-to-parent direction in current workloads
*/

-- ============================================================
-- 1. Add covering indexes for unindexed foreign keys
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_exercise_answers_user_id
  ON public.exercise_answers(user_id);

CREATE INDEX IF NOT EXISTS idx_exercise_questions_week_id
  ON public.exercise_questions(week_id);

CREATE INDEX IF NOT EXISTS idx_poll_response_slots_time_slot_id
  ON public.poll_response_slots(time_slot_id);

CREATE INDEX IF NOT EXISTS idx_poll_responses_poll_id
  ON public.poll_responses(poll_id);

CREATE INDEX IF NOT EXISTS idx_poll_time_slots_poll_id
  ON public.poll_time_slots(poll_id);

CREATE INDEX IF NOT EXISTS idx_polls_final_slot_id
  ON public.polls(final_slot_id);

CREATE INDEX IF NOT EXISTS idx_polls_finalized_slot_id
  ON public.polls(finalized_slot_id);

CREATE INDEX IF NOT EXISTS idx_polls_user_id
  ON public.polls(user_id);

CREATE INDEX IF NOT EXISTS idx_progress_trackers_user_id
  ON public.progress_trackers(user_id);

-- ============================================================
-- 2. Drop unused index (FK covered above where needed)
-- ============================================================

DROP INDEX IF EXISTS public.idx_user_terms_agreements_user_id;
