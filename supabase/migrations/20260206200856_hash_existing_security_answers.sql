/*
  # Hash existing plaintext security answers

  1. Changes
    - Updates all `security_answer_hash` values in `user_profiles` from plaintext to proper SHA-256 hashes
    - Uses pgcrypto's `digest()` function to compute SHA-256 hashes
    - Only hashes values that are not already valid 64-character hex strings (SHA-256 output)
    - Existing values were stored as lowercase trimmed plaintext; the hash is applied directly

  2. Security
    - Converts plaintext security answers to irreversible SHA-256 hashes
    - Prevents exposure of security answers if database is compromised
    - All new signups already use SHA-256 hashing in the application layer

  3. Important Notes
    - This is a one-way operation; original plaintext answers cannot be recovered
    - The regex check `'^[0-9a-f]{64}$'` ensures already-hashed values are not double-hashed
*/

UPDATE user_profiles
SET security_answer_hash = encode(extensions.digest(security_answer_hash, 'sha256'), 'hex')
WHERE security_answer_hash IS NOT NULL
  AND security_answer_hash !~ '^[0-9a-f]{64}$';
