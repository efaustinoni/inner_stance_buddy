/*
  # Fix Double-Encrypted Answers

  ## Summary
  Some answers were encrypted twice: once when originally saved, and again when
  the row was later upserted (the encryption trigger fired on an already-encrypted value).

  This migration identifies all double-encrypted answers (where decrypting once still
  produces a PGP ciphertext starting with 'ww0E'), decrypts them to plaintext, and
  re-stores the single-encrypted form.

  ## Approach
  1. Disable the encryption trigger temporarily.
  2. Update affected rows: decrypt twice to recover plaintext, then encrypt once.
  3. Re-enable the trigger.

  ## Affected table
  - `exercise_answers`: 5 rows with double-encrypted answer_text values.
*/

ALTER TABLE exercise_answers DISABLE TRIGGER encrypt_answer_text;

UPDATE exercise_answers
SET answer_text = app_encrypt(app_decrypt(app_decrypt(answer_text)))
WHERE app_decrypt(answer_text) LIKE 'ww0E%';

ALTER TABLE exercise_answers ENABLE TRIGGER encrypt_answer_text;
