/*
  # Drop Unused Index on user_terms_agreements

  1. Changes
    - Drop `idx_user_terms_agreements_user_id` index from user_terms_agreements table

  2. Rationale
    - Index usage statistics show 0 scans (idx_scan = 0)
    - Small tables with few rows don't benefit from indexes
    - Sequential scans are faster for small datasets
    - Indexes have maintenance overhead (INSERT/UPDATE/DELETE operations)
    - Can be re-added later when table grows and query patterns justify it

  3. Performance Impact
    - Reduces storage overhead
    - Speeds up INSERT/UPDATE/DELETE operations (no index maintenance)
    - No negative impact on current query performance (index wasn't being used)

  4. Foreign Key Protection
    - Foreign key constraint on user_id remains intact
    - Data integrity is preserved
    - ON DELETE CASCADE functionality unaffected

  5. Future Considerations
    - Monitor query patterns as table grows
    - Re-evaluate index need when table has >1000 rows
    - Consider re-adding if RLS policy checks become slow
*/

-- Drop the unused index
DROP INDEX IF EXISTS idx_user_terms_agreements_user_id;
