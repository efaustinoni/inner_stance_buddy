/*
  # Add Exercise Quarters

  1. New Tables
    - `exercise_quarters` - User-defined quarter labels for grouping weeks
      - `id` (uuid, primary key)
      - `user_id` (uuid, FK to auth.users)
      - `label` (text) - User-defined name e.g. "2026-Q2", "Q2 - Effectiveness"
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - UNIQUE(user_id, label)

  2. Changes to `exercise_weeks`
    - Add `quarter_id` (uuid, nullable FK to exercise_quarters ON DELETE SET NULL)
    - Drop old UNIQUE(user_id, week_number) constraint
    - Add new UNIQUE(user_id, quarter_id, week_number) constraint
      allowing the same week number in different quarters

  3. Security
    - Enable RLS on exercise_quarters
    - Users can only access their own quarters
*/

-- Create exercise_quarters table
CREATE TABLE IF NOT EXISTS exercise_quarters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, label)
);

-- Enable RLS
ALTER TABLE exercise_quarters ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exercise_quarters
CREATE POLICY "Users can view own quarters"
  ON exercise_quarters FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own quarters"
  ON exercise_quarters FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quarters"
  ON exercise_quarters FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own quarters"
  ON exercise_quarters FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_exercise_quarters_user_id ON exercise_quarters(user_id);

-- Add quarter_id to exercise_weeks
ALTER TABLE exercise_weeks
  ADD COLUMN IF NOT EXISTS quarter_id uuid REFERENCES exercise_quarters(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_exercise_weeks_quarter_id ON exercise_weeks(quarter_id);

-- Drop old unique constraint and replace with quarter-scoped one
ALTER TABLE exercise_weeks DROP CONSTRAINT IF EXISTS exercise_weeks_user_id_week_number_key;

-- New constraint: same week number allowed across quarters, but not within the same quarter
-- Uses NULLS NOT DISTINCT so two unassigned (NULL) weeks with the same number are still blocked
ALTER TABLE exercise_weeks
  ADD CONSTRAINT exercise_weeks_user_quarter_week_unique
  UNIQUE NULLS NOT DISTINCT (user_id, quarter_id, week_number);
