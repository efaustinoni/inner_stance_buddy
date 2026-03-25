/*
  # Add Security Question for Password Recovery

  ## Summary
  Adds security question and answer fields to user_profiles table.
  This provides a temporary password recovery mechanism until email
  functionality is implemented.

  ## New Columns
    - `security_question` (text): The selected security question
    - `security_answer_hash` (text): Hashed version of the answer (case-insensitive)

  ## Security Notes
    - Answer is stored as a hash to prevent direct exposure
    - Uses pgcrypto for secure hashing
    - Only the user can update their own security question/answer via RLS
*/

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add security question columns to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'security_question'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN security_question text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'security_answer_hash'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN security_answer_hash text;
  END IF;
END $$;