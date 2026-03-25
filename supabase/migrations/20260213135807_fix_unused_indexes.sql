/*
  # Remove Unused Indexes

  1. Changes
    - Drop `idx_user_profiles_purge_at` (for future cleanup jobs)
    - Drop `idx_user_purge_audit_deleted_at` (for future audit reports)
    - Keep `idx_user_terms_agreements_user_id` (supports active RLS policies)

  2. Rationale
    - The purge_at index is for automated cleanup jobs not yet implemented
    - The audit deleted_at index is for admin reports not yet implemented
    - These can be re-created when those features are built
    - The user_id index is kept as it supports existing RLS queries

  3. Notes
    - If you implement cleanup jobs, recreate: 
      CREATE INDEX idx_user_profiles_purge_at 
      ON user_profiles(purge_at) 
      WHERE purge_at IS NOT NULL AND purge_state = 'SCHEDULED';
    - If you implement audit reports, recreate:
      CREATE INDEX idx_user_purge_audit_deleted_at 
      ON user_purge_audit(deleted_at DESC);
*/

-- Drop unused index on user_profiles.purge_at
DROP INDEX IF EXISTS idx_user_profiles_purge_at;

-- Drop unused index on user_purge_audit.deleted_at
DROP INDEX IF EXISTS idx_user_purge_audit_deleted_at;

-- Note: Keeping idx_user_terms_agreements_user_id as it supports RLS policies