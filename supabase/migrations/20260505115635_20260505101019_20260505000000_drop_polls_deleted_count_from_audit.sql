/*
  # Fix SECURITY DEFINER Function Execute Privileges

  ## Summary
  Supabase flagged multiple SECURITY DEFINER functions as callable by anon/authenticated
  roles via the REST API, which is unintentional for all of them.

  ## Changes

  ### 1. Drop dead poll functions (tables were dropped in 20260402101117)
  These functions reference tables that no longer exist and should never be callable:
  - `cancel_time_slots`
  - `confirm_time_slot`
  - `get_expired_open_polls`
  - `update_slot_sequence`

  ### 2. Revoke EXECUTE on trigger-only functions
  These are internal trigger functions invoked by the trigger mechanism as the
  function owner (SECURITY DEFINER). They must never be callable directly via RPC:
  - `handle_new_user`
  - `trigger_encrypt_answer`
  - `trigger_encrypt_checkin_notes`
  - `trigger_encrypt_question`

  ### 3. Revoke EXECUTE on app_encrypt from public roles
  `app_encrypt` is called only by SECURITY DEFINER trigger functions that run as
  postgres. The authenticated/anon roles do not need direct execute access.

  ### Note on app_decrypt
  `app_decrypt` retains EXECUTE for the `authenticated` role because the
  `decrypted_exercise_*` views use SECURITY INVOKER, meaning they call
  `app_decrypt` as the querying user. Revoking would break those views.
*/

-- 1. Drop orphaned poll functions (all tables they referenced were dropped)
DROP FUNCTION IF EXISTS public.cancel_time_slots(uuid[], timestamptz);
DROP FUNCTION IF EXISTS public.confirm_time_slot(uuid, uuid);
DROP FUNCTION IF EXISTS public.get_expired_open_polls();
DROP FUNCTION IF EXISTS public.update_slot_sequence();

-- 2. Revoke EXECUTE on trigger-only functions from all public-facing roles
-- These are invoked exclusively by triggers (as function owner); no role needs RPC access.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_encrypt_answer() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_encrypt_checkin_notes() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_encrypt_question() FROM PUBLIC, anon, authenticated;

-- 3. Revoke EXECUTE on app_encrypt from public-facing roles
-- Only called by SECURITY DEFINER trigger functions running as postgres owner.
REVOKE EXECUTE ON FUNCTION public.app_encrypt(text) FROM PUBLIC, anon, authenticated;
