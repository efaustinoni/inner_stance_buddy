/*
  # Add Meeting Metadata Fields

  ## Overview
  This migration adds additional metadata fields to the polls table to capture
  more details about the meeting: timezone, duration, and location type.

  ## Changes to Tables
  
  ### `polls` table modifications
  - Add `timezone` (text) - The timezone for the meeting (e.g., "America/New_York", "UTC")
  - Add `duration_minutes` (integer) - Duration of the meeting in minutes
  - Add `location_type` (text) - Either "online" or "in_person" to indicate meeting format
  - Add `location_details` (text, optional) - Additional details like video link or physical address

  ## Important Notes
  
  1. Default timezone is set to "UTC" for existing polls
  2. Default duration is 60 minutes
  3. Default location type is "online"
  4. All new fields have sensible defaults to support existing data
*/

-- Add new columns to polls table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'polls' AND column_name = 'timezone'
  ) THEN
    ALTER TABLE polls ADD COLUMN timezone text DEFAULT 'UTC' NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'polls' AND column_name = 'duration_minutes'
  ) THEN
    ALTER TABLE polls ADD COLUMN duration_minutes integer DEFAULT 60 NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'polls' AND column_name = 'location_type'
  ) THEN
    ALTER TABLE polls ADD COLUMN location_type text DEFAULT 'online' NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'polls' AND column_name = 'location_details'
  ) THEN
    ALTER TABLE polls ADD COLUMN location_details text DEFAULT '';
  END IF;
END $$;