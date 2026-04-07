// Created: 2026-02-06
// Last updated: 2026-04-07 (add generateSalt, salted hashSecurityAnswer)

/**
 * Generates a cryptographically random 32-byte salt, returned as a 64-char hex string.
 * Always generate a new salt when storing a new or updated security answer.
 */
export function generateSalt(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Hashes a security answer with SHA-256.
 * When `salt` is provided (new users / updated answers), it is prepended to
 * the normalized answer before hashing: SHA-256(salt + normalized).
 * When `salt` is omitted (legacy users who pre-date salting), the unsalted
 * SHA-256(normalized) is produced for backward-compatible verification.
 */
export async function hashSecurityAnswer(answer: string, salt?: string): Promise<string> {
  const normalized = answer.toLowerCase().trim();
  const input = salt ? salt + normalized : normalized;
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
