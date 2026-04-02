/*
  # Fix Security Definer View warnings on decrypted views

  The decrypted_* views call app_decrypt() which is a SECURITY DEFINER function.
  This causes Supabase to flag the views as "Security Definer Views", meaning
  they may bypass Row Level Security on the underlying tables.

  Fix: Set security_invoker = true on each view so they run in the context of
  the calling user, respecting their RLS policies. The app_decrypt() function
  itself still runs as its owner (needed to access vault.decrypted_secrets),
  but the view no longer bypasses table-level RLS.
*/

ALTER VIEW public.decrypted_exercise_questions SET (security_invoker = true);
ALTER VIEW public.decrypted_exercise_answers SET (security_invoker = true);
ALTER VIEW public.decrypted_progress_check_ins SET (security_invoker = true);
