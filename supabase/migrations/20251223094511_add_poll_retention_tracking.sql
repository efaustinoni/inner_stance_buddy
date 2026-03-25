/*
  # Add poll data retention and purge tracking
  
  1. Changes to `polls` table
    - Add `purge_at` (timestamptz) - when this poll should be permanently deleted
    - Add `closed_at` (timestamptz) - when poll was finalized/closed
    - Add `final_slot_end_at` (timestamptz) - end time of chosen slot for finalized polls
    - Add `purge_reason` (text) - why this poll is scheduled for deletion
    - Add `purge_state` (text) - SCHEDULED, PURGED, or FAILED
  
  2. New table `poll_purge_audit`
    - Tracks all poll deletions for audit purposes
    - Records poll_id, purge_reason, deleted_at, success status
  
  3. Purpose
    - Cancelled polls: auto-delete 15 days after cancellation
    - Finalized polls: auto-delete 15 days after chosen slot end time
    - Provides audit trail for compliance and debugging
  
  4. Notes
    - purge_at is computed once during lifecycle transitions (not in cron)
    - Index on purge_at for efficient cleanup queries
    - Audit records retained indefinitely (or set own retention policy)
*/

-- Add retention tracking fields to polls table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'polls' AND column_name = 'purge_at'
  ) THEN
    ALTER TABLE polls ADD COLUMN purge_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'polls' AND column_name = 'closed_at'
  ) THEN
    ALTER TABLE polls ADD COLUMN closed_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'polls' AND column_name = 'final_slot_end_at'
  ) THEN
    ALTER TABLE polls ADD COLUMN final_slot_end_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'polls' AND column_name = 'purge_reason'
  ) THEN
    ALTER TABLE polls ADD COLUMN purge_reason text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'polls' AND column_name = 'purge_state'
  ) THEN
    ALTER TABLE polls ADD COLUMN purge_state text;
  END IF;
END $$;

-- Add check constraint for purge_state values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'polls' AND constraint_name = 'polls_purge_state_check'
  ) THEN
    ALTER TABLE polls
    ADD CONSTRAINT polls_purge_state_check
    CHECK (purge_state IS NULL OR purge_state IN ('SCHEDULED', 'PURGED', 'FAILED'));
  END IF;
END $$;

-- Create index on purge_at for efficient cleanup queries
CREATE INDEX IF NOT EXISTS idx_polls_purge_at
ON polls(purge_at)
WHERE purge_at IS NOT NULL AND purge_state = 'SCHEDULED';

-- Create audit table for poll deletions
CREATE TABLE IF NOT EXISTS poll_purge_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL,
  poll_title text NOT NULL,
  purge_reason text,
  deleted_at timestamptz DEFAULT now(),
  success boolean DEFAULT true,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Create index on deleted_at for audit queries
CREATE INDEX IF NOT EXISTS idx_poll_purge_audit_deleted_at
ON poll_purge_audit(deleted_at DESC);

-- Enable RLS on audit table
ALTER TABLE poll_purge_audit ENABLE ROW LEVEL SECURITY;

-- Only service role can read audit logs (admins only)
CREATE POLICY "Service role can read audit logs"
  ON poll_purge_audit
  FOR SELECT
  TO service_role
  USING (true);