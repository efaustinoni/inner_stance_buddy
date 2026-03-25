/*
  # Add ICS Subscription Feed Support

  ## Overview
  This migration adds the necessary database structure to support ICS calendar subscription feeds.
  Users can subscribe to a single feed URL that shows all their pending poll time slots.

  ## New Tables

  ### `user_feeds`
  Stores subscription feed tokens for each user (identified by email)
  - `id` (uuid, primary key) - Unique identifier
  - `user_email` (text, unique) - Email address that identifies the user
  - `token` (text, unique) - Secret token for feed access (acts as private key)
  - `created_at` (timestamptz) - When the feed was created
  - `last_accessed_at` (timestamptz) - Last time the feed was accessed

  ## Modified Tables

  ### `polls` table additions
  - `status` (text) - Poll status: 'active', 'finalized', 'cancelled'
  - `final_slot_id` (uuid, nullable) - References the chosen time slot when finalized

  ### `poll_time_slots` table additions
  - `status` (text) - Slot status: 'pending', 'final', 'cancelled'
  - `sequence` (integer) - Version number for ICS SEQUENCE field, increments on changes

  ## Security
  - RLS enabled on user_feeds table
  - Public read access for feed validation (token acts as authentication)
  - Public insert for creating new feeds

  ## Important Notes
  1. The token in user_feeds acts as a private key - anyone with the token can view the feed
  2. Sequence numbers must increment whenever slot data changes
  3. Status fields enable proper ICS STATUS mapping
*/

-- Create user_feeds table for subscription tokens
CREATE TABLE IF NOT EXISTS user_feeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text UNIQUE NOT NULL,
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at timestamptz DEFAULT now(),
  last_accessed_at timestamptz DEFAULT now()
);

-- Add status column to polls table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'polls' AND column_name = 'status'
  ) THEN
    ALTER TABLE polls ADD COLUMN status text DEFAULT 'active' NOT NULL;
  END IF;
END $$;

-- Add final_slot_id column to polls table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'polls' AND column_name = 'final_slot_id'
  ) THEN
    ALTER TABLE polls ADD COLUMN final_slot_id uuid REFERENCES poll_time_slots(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add status column to poll_time_slots table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'poll_time_slots' AND column_name = 'status'
  ) THEN
    ALTER TABLE poll_time_slots ADD COLUMN status text DEFAULT 'pending' NOT NULL;
  END IF;
END $$;

-- Add sequence column to poll_time_slots table for ICS SEQUENCE field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'poll_time_slots' AND column_name = 'sequence'
  ) THEN
    ALTER TABLE poll_time_slots ADD COLUMN sequence integer DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- Create index on user_feeds token for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_feeds_token ON user_feeds(token);

-- Create index on polls creator_email for feed queries
CREATE INDEX IF NOT EXISTS idx_polls_creator_email ON polls(creator_email);

-- Create index on polls status
CREATE INDEX IF NOT EXISTS idx_polls_status ON polls(status);

-- Create index on poll_time_slots status
CREATE INDEX IF NOT EXISTS idx_poll_time_slots_status ON poll_time_slots(status);

-- Enable RLS on user_feeds
ALTER TABLE user_feeds ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_feeds (public access since token acts as auth)
CREATE POLICY "Anyone can view feeds by token"
  ON user_feeds FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create feeds"
  ON user_feeds FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update feed access time"
  ON user_feeds FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Function to update sequence when slot changes
CREATE OR REPLACE FUNCTION update_slot_sequence()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.proposed_datetime IS DISTINCT FROM NEW.proposed_datetime 
     OR OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.sequence := OLD.sequence + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-increment sequence on slot updates
DROP TRIGGER IF EXISTS trigger_update_slot_sequence ON poll_time_slots;
CREATE TRIGGER trigger_update_slot_sequence
  BEFORE UPDATE ON poll_time_slots
  FOR EACH ROW
  EXECUTE FUNCTION update_slot_sequence();
