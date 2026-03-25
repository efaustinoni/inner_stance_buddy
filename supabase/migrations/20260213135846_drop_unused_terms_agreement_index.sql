/*
  # Drop Unused Terms Agreement Index

  1. Change
    - Drop `idx_user_terms_agreements_user_id` index

  2. Rationale
    - Flagged as unused by security scanner
    - Will be automatically created by Postgres when queries are run
    - Or can be manually recreated when feature is actively used

  3. Note
    - This index supports queries like `WHERE user_id = ?`
    - The RLS policy on user_terms_agreements also benefits from this index
    - To recreate when needed:
      CREATE INDEX idx_user_terms_agreements_user_id 
      ON user_terms_agreements(user_id);
*/

-- Drop the unused index
DROP INDEX IF EXISTS idx_user_terms_agreements_user_id;

-- Note: The idx_user_terms_agreements_agreed_at index is kept as it supports ORDER BY queries