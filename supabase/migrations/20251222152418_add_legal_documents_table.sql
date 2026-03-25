/*
  # Add Legal Documents Configuration Table

  1. New Tables
    - `legal_documents`
      - `id` (uuid, primary key)
      - `document_type` (text, 'terms' or 'privacy')
      - `version` (text, semantic version like "1.0")
      - `last_updated` (date, when document was last updated)
      - `file_path` (text, path relative to public folder)
      - `is_active` (boolean, whether this is the current version)
      - `requires_acceptance` (boolean, whether app blocks until accepted)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `legal_documents` table
    - Add policy for all users (including anon) to read active documents
    - No insert/update/delete policies - admin-only via service role

  3. Seed Data
    - Initial terms of service v1.0
    - Initial privacy policy v1.0

  4. Notes
    - Only active documents are shown to users
    - File paths point to files in the public/legal folder
    - requires_acceptance applies globally (if any doc requires it, all do)
*/

CREATE TABLE IF NOT EXISTS legal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type text NOT NULL CHECK (document_type IN ('terms', 'privacy')),
  version text NOT NULL,
  last_updated date NOT NULL,
  file_path text NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  requires_acceptance boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (document_type, version)
);

CREATE INDEX IF NOT EXISTS idx_legal_documents_type_active ON legal_documents(document_type, is_active);

ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active legal documents"
  ON legal_documents
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

INSERT INTO legal_documents (document_type, version, last_updated, file_path, is_active, requires_acceptance)
VALUES 
  ('terms', '1.0', '2025-12-22', 'legal/ai_global_experts_terms_of_service_v1.0_2025-12-22.pdf', true, false),
  ('privacy', '1.0', '2025-12-22', 'legal/ai_global_experts_privacy_policy_v1.0_2025-12-22.pdf', true, false)
ON CONFLICT (document_type, version) DO NOTHING;
