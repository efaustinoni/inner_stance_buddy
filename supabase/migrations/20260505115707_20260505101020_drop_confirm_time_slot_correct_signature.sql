/*
  # Drop remaining confirm_time_slot function

  The previous migration used the wrong argument types for confirm_time_slot.
  The actual signature is (uuid, timestamptz). Dropping it now.
*/

DROP FUNCTION IF EXISTS public.confirm_time_slot(uuid, timestamptz);
