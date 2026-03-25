/*
  # Add Poll Cancellation Tracking

  ## Overview
  This migration adds fields to track why and when polls were cancelled,
  distinguishing between user-initiated and automatic (expired) cancellations.

  ## Changes to Tables
  
  ### `polls` table modifications
  - Add `cancellation_reason` (text, nullable) - Reason for cancellation:
    - 'user' - Manually cancelled by the poll creator
    - 'auto_expired' - Automatically cancelled because all time slots are in the past
  - Add `cancelled_at` (timestamptz, nullable) - Timestamp when the poll was cancelled

  ## Important Notes
  1. These columns are nullable to support existing polls and non-cancelled polls
  2. Only set when poll status is 'cancelled'
  3. Used by the UI to display "Cancelled" vs "Cancelled (auto)" badges
*/

-- Add cancellation_reason column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'polls' AND column_name = 'cancellation_reason'
  ) THEN
    ALTER TABLE polls ADD COLUMN cancellation_reason text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'polls' AND column_name = 'cancelled_at'
  ) THEN
    ALTER TABLE polls ADD COLUMN cancelled_at timestamptz;
  END IF;
END $$;

-- Add check constraint to ensure valid cancellation reasons
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'polls_cancellation_reason_check'
  ) THEN
    ALTER TABLE polls ADD CONSTRAINT polls_cancellation_reason_check
      CHECK (cancellation_reason IS NULL OR cancellation_reason IN ('user', 'auto_expired'));
  END IF;
END $$;

-- Create index for querying cancelled polls by reason
CREATE INDEX IF NOT EXISTS idx_polls_cancellation_reason ON polls(cancellation_reason) WHERE cancellation_reason IS NOT NULL;