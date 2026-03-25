/*
  # Add Version String Fields to User Terms Agreements

  1. Modified Tables
    - `user_terms_agreements`
      - Added `terms_version_string` (text) - stores version like "1.0", "2.1"
      - Added `privacy_version_string` (text) - stores version like "1.0", "2.1"
      
  2. Notes
    - These fields allow semantic version comparison
    - The existing date fields remain for audit/display purposes
    - Version strings should match the manifest file versions
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_terms_agreements' AND column_name = 'terms_version_string'
  ) THEN
    ALTER TABLE user_terms_agreements ADD COLUMN terms_version_string text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_terms_agreements' AND column_name = 'privacy_version_string'
  ) THEN
    ALTER TABLE user_terms_agreements ADD COLUMN privacy_version_string text;
  END IF;
END $$;
