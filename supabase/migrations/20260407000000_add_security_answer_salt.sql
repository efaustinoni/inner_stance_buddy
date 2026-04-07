/*
  # Add security_answer_salt column to user_profiles

  1. Changes
    - Adds `security_answer_salt TEXT` column (nullable) to `user_profiles`
    - Existing users keep NULL for this column — backward-compatible
    - New users and users who update their security question will get a
      per-user random salt generated client-side and stored here

  2. How verification works after this migration
    - If salt IS NULL  → verify as SHA-256(normalized_answer)  [legacy path]
    - If salt IS SET   → verify as SHA-256(salt + normalized_answer)  [salted path]
    - The password-reset edge function handles both cases automatically

  3. Notes
    - This migration must be applied and verified BEFORE deploying the
      updated edge function and frontend code (see DEPLOYMENT_CHECKLIST.md)
    - No existing hashes are modified — legacy users remain fully functional
*/

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS security_answer_salt TEXT;

COMMENT ON COLUMN public.user_profiles.security_answer_salt IS
  'Per-user random salt (hex) prepended to the answer before SHA-256 hashing. NULL for users created before salting was introduced.';
