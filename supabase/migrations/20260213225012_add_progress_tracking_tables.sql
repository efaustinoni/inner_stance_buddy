/*
  # Progress Tracking Tables

  1. New Tables
    - `progress_trackers` - Tracks which questions a user wants to track progress for
      - `id` (uuid, primary key)
      - `question_id` (uuid, FK to exercise_questions)
      - `user_id` (uuid, FK to auth.users)
      - `started_at` (date) - Date tracking started
      - `is_active` (boolean) - Whether tracking is currently active
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `progress_check_ins` - Daily check-ins for tracked questions
      - `id` (uuid, primary key)
      - `tracker_id` (uuid, FK to progress_trackers)
      - `check_in_date` (date) - The date of this check-in
      - `is_done` (boolean) - Whether the user completed this day
      - `notes` (text) - Optional notes for this day
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can only access their own tracking data
    - Cascade deletes for data integrity

  3. Indexes
    - Index on user_id for progress_trackers
    - Index on tracker_id for progress_check_ins
    - Index on check_in_date for efficient date queries
*/

-- Progress Trackers table
CREATE TABLE IF NOT EXISTS progress_trackers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES exercise_questions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at date NOT NULL DEFAULT CURRENT_DATE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(question_id, user_id)
);

-- Progress Check-ins table
CREATE TABLE IF NOT EXISTS progress_check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracker_id uuid NOT NULL REFERENCES progress_trackers(id) ON DELETE CASCADE,
  check_in_date date NOT NULL,
  is_done boolean NOT NULL DEFAULT false,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tracker_id, check_in_date)
);

-- Enable RLS
ALTER TABLE progress_trackers ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_check_ins ENABLE ROW LEVEL SECURITY;

-- RLS Policies for progress_trackers
CREATE POLICY "Users can view own trackers"
  ON progress_trackers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own trackers"
  ON progress_trackers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trackers"
  ON progress_trackers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own trackers"
  ON progress_trackers FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for progress_check_ins (through tracker ownership)
CREATE POLICY "Users can view own check-ins"
  ON progress_check_ins FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM progress_trackers
      WHERE progress_trackers.id = progress_check_ins.tracker_id
      AND progress_trackers.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own check-ins"
  ON progress_check_ins FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM progress_trackers
      WHERE progress_trackers.id = progress_check_ins.tracker_id
      AND progress_trackers.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own check-ins"
  ON progress_check_ins FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM progress_trackers
      WHERE progress_trackers.id = progress_check_ins.tracker_id
      AND progress_trackers.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM progress_trackers
      WHERE progress_trackers.id = progress_check_ins.tracker_id
      AND progress_trackers.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own check-ins"
  ON progress_check_ins FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM progress_trackers
      WHERE progress_trackers.id = progress_check_ins.tracker_id
      AND progress_trackers.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_progress_trackers_user_id ON progress_trackers(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_trackers_question_id ON progress_trackers(question_id);
CREATE INDEX IF NOT EXISTS idx_progress_check_ins_tracker_id ON progress_check_ins(tracker_id);
CREATE INDEX IF NOT EXISTS idx_progress_check_ins_date ON progress_check_ins(check_in_date);
