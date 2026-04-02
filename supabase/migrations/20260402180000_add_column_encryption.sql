/*
  # Column Encryption for User Data
  
  Encrypts sensitive user-generated content so that it appears as ciphertext
  in the Supabase Table Editor, SQL Editor, and database dumps.
  
  Uses pgcrypto's pgp_sym_encrypt/pgp_sym_decrypt with a symmetric key
  stored in Supabase Vault.
  
  Encrypted columns:
    - exercise_answers.answer_text
    - exercise_questions.question_text
    - exercise_questions.question_label
    - progress_check_ins.notes
  
  Approach:
    - BEFORE INSERT/UPDATE triggers encrypt plaintext transparently
    - Decrypted views (decrypted_*) decrypt on the fly for authenticated users
    - Frontend reads from views, writes to tables
*/

-- Step 1: Ensure extensions are available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Step 2: Store a symmetric encryption key in Vault
-- (Vault extension is already enabled by default on Supabase projects)
SELECT vault.create_secret(
  encode(gen_random_bytes(32), 'hex'),
  'app_encryption_key',
  'Symmetric key for column encryption of user data'
);

-- Step 3: Helper functions (SECURITY DEFINER to access vault)

-- Encrypt plaintext → base64 ciphertext string
CREATE OR REPLACE FUNCTION app_encrypt(plaintext text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key text;
BEGIN
  IF plaintext IS NULL OR plaintext = '' THEN
    RETURN plaintext;
  END IF;

  SELECT decrypted_secret INTO encryption_key
  FROM vault.decrypted_secrets
  WHERE name = 'app_encryption_key'
  LIMIT 1;

  IF encryption_key IS NULL THEN
    RAISE EXCEPTION 'Encryption key not found in vault';
  END IF;

  RETURN encode(pgp_sym_encrypt(plaintext, encryption_key)::bytea, 'base64');
END;
$$;

-- Decrypt base64 ciphertext → plaintext
CREATE OR REPLACE FUNCTION app_decrypt(ciphertext text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  encryption_key text;
BEGIN
  IF ciphertext IS NULL OR ciphertext = '' THEN
    RETURN ciphertext;
  END IF;

  SELECT decrypted_secret INTO encryption_key
  FROM vault.decrypted_secrets
  WHERE name = 'app_encryption_key'
  LIMIT 1;

  IF encryption_key IS NULL THEN
    RAISE EXCEPTION 'Encryption key not found in vault';
  END IF;

  RETURN pgp_sym_decrypt(decode(ciphertext, 'base64')::bytea, encryption_key);
END;
$$;

-- Restrict access: only authenticated role can call these
REVOKE EXECUTE ON FUNCTION app_encrypt(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION app_encrypt(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION app_decrypt(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION app_decrypt(text) TO authenticated;

-- Step 4: Encryption triggers

-- exercise_answers: encrypt answer_text
CREATE OR REPLACE FUNCTION trigger_encrypt_answer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.answer_text IS NOT NULL AND NEW.answer_text != '' THEN
    NEW.answer_text := app_encrypt(NEW.answer_text);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER encrypt_answer_text
  BEFORE INSERT OR UPDATE OF answer_text ON exercise_answers
  FOR EACH ROW EXECUTE FUNCTION trigger_encrypt_answer();

-- exercise_questions: encrypt question_text and question_label
CREATE OR REPLACE FUNCTION trigger_encrypt_question()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.question_text IS NOT NULL AND NEW.question_text != '' THEN
    NEW.question_text := app_encrypt(NEW.question_text);
  END IF;
  IF NEW.question_label IS NOT NULL AND NEW.question_label != '' THEN
    NEW.question_label := app_encrypt(NEW.question_label);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER encrypt_question_fields
  BEFORE INSERT OR UPDATE OF question_text, question_label ON exercise_questions
  FOR EACH ROW EXECUTE FUNCTION trigger_encrypt_question();

-- progress_check_ins: encrypt notes
CREATE OR REPLACE FUNCTION trigger_encrypt_checkin_notes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.notes IS NOT NULL AND NEW.notes != '' THEN
    NEW.notes := app_encrypt(NEW.notes);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER encrypt_checkin_notes
  BEFORE INSERT OR UPDATE OF notes ON progress_check_ins
  FOR EACH ROW EXECUTE FUNCTION trigger_encrypt_checkin_notes();

-- Step 5: Decrypted views for reading data

-- Decrypted exercise_questions view
-- Ownership check: join through exercise_weeks.user_id = auth.uid()
CREATE OR REPLACE VIEW decrypted_exercise_questions AS
SELECT
  q.id,
  q.week_id,
  app_decrypt(q.question_label) AS question_label,
  app_decrypt(q.question_text) AS question_text,
  q.sort_order,
  q.created_at,
  q.updated_at
FROM exercise_questions q
INNER JOIN exercise_weeks w ON w.id = q.week_id
WHERE w.user_id = auth.uid();

-- Decrypted exercise_answers view
-- Ownership check: user_id = auth.uid()
CREATE OR REPLACE VIEW decrypted_exercise_answers AS
SELECT
  a.id,
  a.question_id,
  a.user_id,
  app_decrypt(a.answer_text) AS answer_text,
  a.created_at,
  a.updated_at
FROM exercise_answers a
WHERE a.user_id = auth.uid();

-- Decrypted progress_check_ins view
-- Ownership check: join through progress_trackers.user_id = auth.uid()
CREATE OR REPLACE VIEW decrypted_progress_check_ins AS
SELECT
  ci.id,
  ci.tracker_id,
  ci.check_in_date,
  ci.is_done,
  app_decrypt(ci.notes) AS notes,
  ci.created_at,
  ci.updated_at
FROM progress_check_ins ci
INNER JOIN progress_trackers pt ON pt.id = ci.tracker_id
WHERE pt.user_id = auth.uid();

-- Grant view access to authenticated users
GRANT SELECT ON decrypted_exercise_questions TO authenticated;
GRANT SELECT ON decrypted_exercise_answers TO authenticated;
GRANT SELECT ON decrypted_progress_check_ins TO authenticated;

-- Step 6: Migrate existing plaintext data to encrypted form
-- (Triggers are already active, so we use the app_encrypt function directly)

-- Temporarily disable the triggers to avoid double-encryption
ALTER TABLE exercise_answers DISABLE TRIGGER encrypt_answer_text;
ALTER TABLE exercise_questions DISABLE TRIGGER encrypt_question_fields;
ALTER TABLE progress_check_ins DISABLE TRIGGER encrypt_checkin_notes;

-- Encrypt existing answer_text values
UPDATE exercise_answers
SET answer_text = app_encrypt(answer_text)
WHERE answer_text IS NOT NULL AND answer_text != '';

-- Encrypt existing question_text and question_label values
UPDATE exercise_questions
SET
  question_text = app_encrypt(question_text),
  question_label = app_encrypt(question_label)
WHERE question_text IS NOT NULL AND question_text != '';

-- Encrypt existing notes values
UPDATE progress_check_ins
SET notes = app_encrypt(notes)
WHERE notes IS NOT NULL AND notes != '';

-- Re-enable triggers
ALTER TABLE exercise_answers ENABLE TRIGGER encrypt_answer_text;
ALTER TABLE exercise_questions ENABLE TRIGGER encrypt_question_fields;
ALTER TABLE progress_check_ins ENABLE TRIGGER encrypt_checkin_notes;
