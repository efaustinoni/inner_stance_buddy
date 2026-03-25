/*
  # Update Poll Expiry Logic

  ## Overview
  Changes the auto-cancellation logic to check if the poll start time has passed
  instead of checking if the entire meeting duration has elapsed.

  ## Changes
  - Modified `get_expired_open_polls` function
  - Now cancels polls when `proposed_datetime < NOW()` 
  - Previous logic: cancelled when `proposed_datetime + duration < NOW()`

  ## Rationale
  Once a proposed meeting start time has passed, participants can no longer
  schedule for that time slot. It's more appropriate to cancel immediately
  when the start time passes rather than waiting for the full duration.

  ## Important Notes
  - This makes polls expire more quickly (at start time vs at end time)
  - More intuitive for users - poll becomes invalid once the time has arrived
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
  HAVING MAX(pts.proposed_datetime) < NOW();
END;
$$;