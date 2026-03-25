// Created: 2026-02-06
// Last updated: 2026-02-06

export async function hashSecurityAnswer(answer: string): Promise<string> {
  const normalized = answer.toLowerCase().trim();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
