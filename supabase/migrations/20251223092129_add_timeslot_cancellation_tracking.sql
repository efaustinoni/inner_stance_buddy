/*
  # Add cancellation tracking for calendar event lifecycle
  
  1. Changes to `poll_time_slots`
    - Add `cancelled_at` (timestamptz) to track when a slot was cancelled
    - Add status check constraint for 'pending', 'confirmed', 'cancelled'
  
  2. Purpose
    - Support authoritative calendar cleanup via ICS feed
    - Cancelled events remain in feed for 14-day retention window
    - SEQUENCE increments when status changes (for calendar sync)
    - Enables proper STATUS:CANCELLED emission with stable UIDs
  
  3. Notes
    - Status transitions: pending → confirmed (finalization) or pending → cancelled
    - cancelled_at enables retention window calculation (14 days)
    - SEQUENCE must increment when emitting cancellation events
*/

-- Add cancelled_at timestamp to poll_time_slots
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'poll_time_slots' AND column_name = 'cancelled_at'
  ) THEN
    ALTER TABLE poll_time_slots ADD COLUMN cancelled_at timestamptz;
  END IF;
END $$;

-- Add check constraint for status values if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'poll_time_slots' AND constraint_name = 'poll_time_slots_status_check'
  ) THEN
    ALTER TABLE poll_time_slots
    ADD CONSTRAINT poll_time_slots_status_check
    CHECK (status IN ('pending', 'confirmed', 'cancelled'));
  END IF;
END $$;

-- Create index on cancelled_at for efficient retention window queries
CREATE INDEX IF NOT EXISTS idx_poll_time_slots_cancelled_at
ON poll_time_slots(cancelled_at)
WHERE cancelled_at IS NOT NULL;