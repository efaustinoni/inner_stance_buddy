/*
  # Add Calendar Name to User Feeds

  ## Overview
  Adds a customizable calendar name field to user_feeds table, allowing users to set
  a friendly name that appears in their calendar app when they subscribe to the feed.

  ## Modified Tables

  ### `user_feeds` table additions
  - `calendar_name` (text) - Custom name for the calendar (max 25 chars recommended)
    - Default: 'My Scheduling Polls'
    - This name appears as the calendar title in Google Calendar, Outlook, etc.

  ## Important Notes
  1. The calendar_name is used in the X-WR-CALNAME header of the iCal feed
  2. Maximum recommended length is 25 characters for best display across calendar apps
  3. Existing feeds will automatically get the default name
*/

-- Add calendar_name column to user_feeds table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_feeds' AND column_name = 'calendar_name'
  ) THEN
    ALTER TABLE user_feeds ADD COLUMN calendar_name text DEFAULT 'My Scheduling Polls' NOT NULL;
  END IF;
END $$;
