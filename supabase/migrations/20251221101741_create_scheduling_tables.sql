/*
  # Create Meeting Scheduler Database Schema

  ## Overview
  This migration creates the database structure for a group meeting scheduler application
  where users can create polls with proposed time slots and participants can indicate
  their availability.

  ## New Tables
  
  ### `polls`
  Stores the main poll/scheduling information
  - `id` (uuid, primary key) - Unique identifier for the poll
  - `title` (text) - Title/name of the meeting
  - `description` (text, optional) - Additional details about the meeting
  - `creator_name` (text) - Name of the person creating the poll
  - `creator_email` (text, optional) - Email of the creator
  - `created_at` (timestamptz) - When the poll was created
  - `updated_at` (timestamptz) - Last update time

  ### `poll_time_slots`
  Stores the proposed date/time options for each poll
  - `id` (uuid, primary key) - Unique identifier for the time slot
  - `poll_id` (uuid, foreign key) - References the parent poll
  - `proposed_datetime` (timestamptz) - The proposed date and time
  - `created_at` (timestamptz) - When the slot was created

  ### `poll_responses`
  Stores participant responses to polls
  - `id` (uuid, primary key) - Unique identifier for the response
  - `poll_id` (uuid, foreign key) - References the poll
  - `participant_name` (text) - Name of the participant
  - `participant_email` (text, optional) - Email of the participant
  - `created_at` (timestamptz) - When the response was submitted

  ### `poll_response_slots`
  Stores availability for each time slot per participant
  - `id` (uuid, primary key) - Unique identifier
  - `response_id` (uuid, foreign key) - References the participant response
  - `time_slot_id` (uuid, foreign key) - References the time slot
  - `is_available` (boolean) - Whether the participant is available
  - `created_at` (timestamptz) - When this was recorded

  ## Security
  
  All tables have RLS enabled with public read access (anyone with link can view)
  and public write access (anyone can create polls and respond). This enables
  the sharing functionality without requiring authentication.

  ## Important Notes
  
  1. No authentication required - this is intentional for easy sharing
  2. Cascade deletes ensure data integrity when polls are deleted
  3. Indexes on foreign keys for query performance
*/

-- Create polls table
CREATE TABLE IF NOT EXISTS polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  creator_name text NOT NULL,
  creator_email text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create poll_time_slots table
CREATE TABLE IF NOT EXISTS poll_time_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  proposed_datetime timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create poll_responses table
CREATE TABLE IF NOT EXISTS poll_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  participant_name text NOT NULL,
  participant_email text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create poll_response_slots table
CREATE TABLE IF NOT EXISTS poll_response_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id uuid NOT NULL REFERENCES poll_responses(id) ON DELETE CASCADE,
  time_slot_id uuid NOT NULL REFERENCES poll_time_slots(id) ON DELETE CASCADE,
  is_available boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(response_id, time_slot_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_poll_time_slots_poll_id ON poll_time_slots(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_responses_poll_id ON poll_responses(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_response_slots_response_id ON poll_response_slots(response_id);
CREATE INDEX IF NOT EXISTS idx_poll_response_slots_time_slot_id ON poll_response_slots(time_slot_id);

-- Enable Row Level Security
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_response_slots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for polls (public read and write)
CREATE POLICY "Anyone can view polls"
  ON polls FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create polls"
  ON polls FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update polls"
  ON polls FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- RLS Policies for poll_time_slots (public read and write)
CREATE POLICY "Anyone can view time slots"
  ON poll_time_slots FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create time slots"
  ON poll_time_slots FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can delete time slots"
  ON poll_time_slots FOR DELETE
  TO public
  USING (true);

-- RLS Policies for poll_responses (public read and write)
CREATE POLICY "Anyone can view responses"
  ON poll_responses FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create responses"
  ON poll_responses FOR INSERT
  TO public
  WITH CHECK (true);

-- RLS Policies for poll_response_slots (public read and write)
CREATE POLICY "Anyone can view response slots"
  ON poll_response_slots FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create response slots"
  ON poll_response_slots FOR INSERT
  TO public
  WITH CHECK (true);