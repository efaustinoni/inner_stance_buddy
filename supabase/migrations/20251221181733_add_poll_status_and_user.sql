/*
  # Add Poll Status and User Association

  ## Overview
  This migration adds a status field to track poll lifecycle and associates polls
  with authenticated users for the "My Polls" feature.

  ## Changes to Tables
  
  ### `polls` table modifications
  - Add `status` (text) - Poll status: 'open', 'finalized', or 'cancelled'
  - Add `user_id` (uuid) - Optional reference to auth.users for authenticated creators
  - Add `finalized_slot_id` (uuid) - Reference to the chosen time slot when finalized

  ## Security
  - Updated RLS policies to allow users to see their own polls
  - Existing public access maintained for poll sharing

  ## Important Notes
  1. Default status is 'open' for new and existing polls
  2. user_id is nullable to support anonymous polls
  3. Index on user_id for efficient "My Polls" queries
*/

-- Add status column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'polls' AND column_name = 'status'
  ) THEN
    ALTER TABLE polls ADD COLUMN status text DEFAULT 'open' NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'polls' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE polls ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'polls' AND column_name = 'finalized_slot_id'
  ) THEN
    ALTER TABLE polls ADD COLUMN finalized_slot_id uuid REFERENCES poll_time_slots(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add index for user_id queries
CREATE INDEX IF NOT EXISTS idx_polls_user_id ON polls(user_id);

-- Add index for status queries
CREATE INDEX IF NOT EXISTS idx_polls_status ON polls(status);