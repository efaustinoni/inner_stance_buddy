/*
  # Add Index on Foreign Key

  1. Change
    - Create `idx_user_terms_agreements_user_id` index on user_terms_agreements(user_id)

  2. Rationale
    - Foreign keys should have covering indexes for optimal query performance
    - This index supports:
      - JOIN operations with auth.users table
      - WHERE clauses filtering by user_id
      - RLS policy checks using user_id
      - Foreign key constraint validation

  3. Performance Impact
    - Improves query performance for user-specific agreement lookups
    - Speeds up RLS policy evaluation
    - Optimizes foreign key constraint checks during INSERT/UPDATE/DELETE
*/

-- Create index on foreign key column
CREATE INDEX IF NOT EXISTS idx_user_terms_agreements_user_id 
ON user_terms_agreements(user_id);