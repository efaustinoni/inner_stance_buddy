/*
  # Add account soft delete and retention tracking
  
  1. Changes to `user_profiles` table
    - Add `deleted_at` (timestamptz) - when account was soft-deleted
    - Add `purge_at` (timestamptz) - when account should be permanently deleted
    - Add `purge_reason` (text) - reason for deletion
    - Add `purge_state` (text) - SCHEDULED, PURGING, PURGED, FAILED
  
  2. New table `user_purge_audit`
    - Tracks all user account deletions for audit purposes
    - Records user_id, email, deleted_at, purge reason, success status
    - Includes count of polls deleted with the user
  
  3. Purpose
    - Soft delete: user account deactivated immediately, cannot login
    - Hard delete: account + all data permanently deleted 15 days after soft delete
    - Provides audit trail for compliance and debugging
  
  4. RLS Updates
    - Block access for soft-deleted users (deleted_at IS NOT NULL)
    - Only service role can read audit logs
  
  5. Notes
    - When user is soft-deleted, all their polls are also cancelled/soft-deleted
    - Hard delete removes user + all polls + all related data in cascade
    - Audit records retained indefinitely (or set own retention policy)
*/

-- Add soft delete tracking fields to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN deleted_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'purge_at'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN purge_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'purge_reason'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN purge_reason text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'purge_state'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN purge_state text;
  END IF;
END $$;

-- Add check constraint for purge_state values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'user_profiles' AND constraint_name = 'user_profiles_purge_state_check'
  ) THEN
    ALTER TABLE user_profiles
    ADD CONSTRAINT user_profiles_purge_state_check
    CHECK (purge_state IS NULL OR purge_state IN ('SCHEDULED', 'PURGING', 'PURGED', 'FAILED'));
  END IF;
END $$;

-- Create index on purge_at for efficient cleanup queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_purge_at
ON user_profiles(purge_at)
WHERE purge_at IS NOT NULL AND purge_state = 'SCHEDULED';

-- Create audit table for user account deletions
CREATE TABLE IF NOT EXISTS user_purge_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  display_name text,
  deleted_at timestamptz NOT NULL,
  purge_reason text,
  polls_deleted_count integer DEFAULT 0,
  success boolean DEFAULT true,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Create index on deleted_at for audit queries
CREATE INDEX IF NOT EXISTS idx_user_purge_audit_deleted_at
ON user_purge_audit(deleted_at DESC);

-- Enable RLS on audit table
ALTER TABLE user_purge_audit ENABLE ROW LEVEL SECURITY;

-- Only service role can read audit logs (admins only)
CREATE POLICY "Service role can read user audit logs"
  ON user_purge_audit
  FOR SELECT
  TO service_role
  USING (true);

-- Update RLS policies to block soft-deleted users
-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- Recreate policies with soft-delete check
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id AND deleted_at IS NULL);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = id AND deleted_at IS NULL);

-- Service role can read all profiles (including soft-deleted)
CREATE POLICY "Service role can read all profiles"
  ON user_profiles
  FOR SELECT
  TO service_role
  USING (true);

-- Service role can update all profiles (including soft-delete operations)
CREATE POLICY "Service role can update all profiles"
  ON user_profiles
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);