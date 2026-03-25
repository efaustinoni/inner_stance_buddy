/*
  # Add User Terms Agreements Tracking

  1. New Tables
    - `user_terms_agreements`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `terms_version` (date, version date of terms of service agreed to)
      - `privacy_version` (date, version date of privacy policy agreed to)
      - `agreed_at` (timestamptz, when the user agreed)
      - `ip_address` (text, optional, for audit purposes)
      - `user_agent` (text, optional, for audit purposes)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `user_terms_agreements` table
    - Add policy for users to read their own agreement records
    - Add policy for authenticated users to insert their own agreement

  3. Notes
    - This table maintains an audit trail of all terms agreements
    - Each sign-up creates a new record
    - terms_version and privacy_version store the effective date of the documents
*/

CREATE TABLE IF NOT EXISTS user_terms_agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  terms_version date NOT NULL,
  privacy_version date NOT NULL,
  agreed_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_terms_agreements_user_id ON user_terms_agreements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_terms_agreements_agreed_at ON user_terms_agreements(agreed_at);

ALTER TABLE user_terms_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own terms agreements"
  ON user_terms_agreements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own terms agreement"
  ON user_terms_agreements
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);