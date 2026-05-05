/*
  # Drop polls_deleted_count from user_purge_audit

  ## Summary
  The polls feature was removed from the application. The `polls_deleted_count` column
  on `user_purge_audit` was always written as 0 and has no meaning. This migration
  drops the column to remove the dead schema.

  ## Changes
  - `user_purge_audit`: drops `polls_deleted_count` column
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_purge_audit' AND column_name = 'polls_deleted_count'
  ) THEN
    ALTER TABLE user_purge_audit DROP COLUMN polls_deleted_count;
  END IF;
END $$;
