/*
  # Drop Unused Scheduling and Feed Tables

  ## Summary
  Removes all tables and functions from the meeting scheduler and calendar feed
  features that were never integrated into the active application.

  ## Tables Dropped (in dependency order)
  - poll_purge_audit - audit log for poll purges
  - poll_response_slots - user slot selections within poll responses
  - poll_responses - user responses to polls
  - poll_time_slots - proposed time slots for polls
  - polls - meeting availability polls
  - user_feeds - ICS calendar feed subscriptions

  ## Functions Dropped
  - get_expired_open_polls - finds expired open polls
  - cancel_time_slots - cancels time slots
  - confirm_time_slot - confirms a time slot

  ## Notes
  - These tables contained no active application references
  - The corresponding migration files were already removed from the repo
  - This cleans up the live database to match the current application scope
*/

DROP TABLE IF EXISTS poll_purge_audit CASCADE;
DROP TABLE IF EXISTS poll_response_slots CASCADE;
DROP TABLE IF EXISTS poll_responses CASCADE;
DROP TABLE IF EXISTS poll_time_slots CASCADE;
DROP TABLE IF EXISTS polls CASCADE;
DROP TABLE IF EXISTS user_feeds CASCADE;

DROP FUNCTION IF EXISTS public.get_expired_open_polls(uuid);
DROP FUNCTION IF EXISTS public.cancel_time_slots(uuid[]);
DROP FUNCTION IF EXISTS public.confirm_time_slot(uuid, uuid);
