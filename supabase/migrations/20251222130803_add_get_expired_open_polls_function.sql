/*
  # Add Function to Find Expired Open Polls

  ## Overview
  This migration adds a PostgreSQL function to efficiently identify polls where:
  - Status is 'open'
  - Belongs to the specified user
  - All time slots have ended (proposed_datetime + duration_minutes < NOW())

  ## New Functions
  - `get_expired_open_polls(p_user_id uuid)` - Returns polls that should be auto-cancelled
    - Returns poll id, title, and array of slot ids for batch update

  ## Important Notes
  1. Uses aggregate query for efficiency (single pass over time slots)
  2. Calculates slot end time by adding duration_minutes to proposed_datetime
  3. Returns slot_ids for batch cancellation in a single update
*/

CREATE OR REPLACE FUNCTION get_expired_open_polls(p_user_id uuid)
RETURNS TABLE(id uuid, title text, slot_ids uuid[])
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    array_agg(pts.id) as slot_ids
  FROM polls p
  JOIN poll_time_slots pts ON pts.poll_id = p.id
  WHERE p.user_id = p_user_id
    AND p.status = 'open'
  GROUP BY p.id, p.title
  HAVING MAX(pts.proposed_datetime + (p.duration_minutes || ' minutes')::interval) < NOW();
END;
$$;