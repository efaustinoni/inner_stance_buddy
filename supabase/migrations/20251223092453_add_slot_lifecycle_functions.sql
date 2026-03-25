/*
  # Add slot lifecycle management functions
  
  1. New Functions
    - `cancel_time_slots(slot_ids, cancellation_timestamp)` - Cancels multiple slots atomically
    - `confirm_time_slot(slot_id)` - Confirms a single slot atomically
  
  2. Purpose
    - Ensure atomic updates with sequence number increments
    - Support authoritative calendar cleanup workflow
    - Proper tracking of cancellation timestamps for retention window
  
  3. Security
    - Functions execute with caller's permissions (security definer not needed)
    - Existing RLS policies apply to underlying table operations
*/

-- Function to cancel multiple time slots atomically
CREATE OR REPLACE FUNCTION cancel_time_slots(
  slot_ids uuid[],
  cancellation_timestamp timestamptz
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE poll_time_slots
  SET
    status = 'cancelled',
    cancelled_at = cancellation_timestamp,
    sequence = sequence + 1
  WHERE id = ANY(slot_ids);
END;
$$;

-- Function to confirm a single time slot atomically
CREATE OR REPLACE FUNCTION confirm_time_slot(slot_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE poll_time_slots
  SET
    status = 'confirmed',
    sequence = sequence + 1
  WHERE id = slot_id;
END;
$$;