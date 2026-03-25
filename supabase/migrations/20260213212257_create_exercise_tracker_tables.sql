/*
  # Exercise Tracker Tables

  1. New Tables
    - `exercise_weeks` - Weekly exercise modules with titles and topics
      - `id` (uuid, primary key)
      - `user_id` (uuid, FK to auth.users) - Owner of this week entry
      - `week_number` (integer) - Week number (1, 2, 3, etc.)
      - `title` (text) - Module title (e.g., "Power")
      - `topic` (text) - Week topic (e.g., "War on Weakness")
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `exercise_questions` - Questions within each week
      - `id` (uuid, primary key)
      - `week_id` (uuid, FK to exercise_weeks)
      - `question_label` (text) - Label like "Reflectie 1a", "Actie 2"
      - `question_text` (text) - Full question text
      - `sort_order` (integer) - Display order
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `exercise_answers` - User answers to questions
      - `id` (uuid, primary key)
      - `question_id` (uuid, FK to exercise_questions)
      - `user_id` (uuid, FK to auth.users)
      - `answer_text` (text) - User's answer
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
    - Cascade deletes for data integrity
*/

-- Exercise Weeks table
CREATE TABLE IF NOT EXISTS exercise_weeks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_number integer NOT NULL,
  title text NOT NULL DEFAULT 'Power',
  topic text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_number)
);

-- Exercise Questions table
CREATE TABLE IF NOT EXISTS exercise_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id uuid NOT NULL REFERENCES exercise_weeks(id) ON DELETE CASCADE,
  question_label text NOT NULL,
  question_text text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Exercise Answers table
CREATE TABLE IF NOT EXISTS exercise_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES exercise_questions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answer_text text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(question_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE exercise_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exercise_weeks
CREATE POLICY "Users can view own weeks"
  ON exercise_weeks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own weeks"
  ON exercise_weeks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weeks"
  ON exercise_weeks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own weeks"
  ON exercise_weeks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for exercise_questions (through week ownership)
CREATE POLICY "Users can view questions for own weeks"
  ON exercise_questions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exercise_weeks
      WHERE exercise_weeks.id = exercise_questions.week_id
      AND exercise_weeks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create questions for own weeks"
  ON exercise_questions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM exercise_weeks
      WHERE exercise_weeks.id = exercise_questions.week_id
      AND exercise_weeks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update questions for own weeks"
  ON exercise_questions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exercise_weeks
      WHERE exercise_weeks.id = exercise_questions.week_id
      AND exercise_weeks.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM exercise_weeks
      WHERE exercise_weeks.id = exercise_questions.week_id
      AND exercise_weeks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete questions for own weeks"
  ON exercise_questions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exercise_weeks
      WHERE exercise_weeks.id = exercise_questions.week_id
      AND exercise_weeks.user_id = auth.uid()
    )
  );

-- RLS Policies for exercise_answers
CREATE POLICY "Users can view own answers"
  ON exercise_answers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own answers"
  ON exercise_answers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own answers"
  ON exercise_answers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own answers"
  ON exercise_answers FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_exercise_weeks_user_id ON exercise_weeks(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_questions_week_id ON exercise_questions(week_id);
CREATE INDEX IF NOT EXISTS idx_exercise_answers_question_id ON exercise_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_exercise_answers_user_id ON exercise_answers(user_id);
