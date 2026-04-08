// Created: 2026-04-08
// Tests: crypto.ts — salt-aware hashSecurityAnswer and generateSalt
// No mocking: we test the real SubtleCrypto implementation.

import { describe, it, expect } from 'vitest';
import { hashSecurityAnswer, generateSalt } from './crypto';

describe('hashSecurityAnswer', () => {
  it('is deterministic — same input + same salt always produces the same hash', async () => {
    const salt = 'deadbeef01234567';
    const h1 = await hashSecurityAnswer('MyAnswer', salt);
    const h2 = await hashSecurityAnswer('MyAnswer', salt);
    expect(h1).toBe(h2);
  });

  it('salted hash differs from unsalted hash for the same answer', async () => {
    const salted = await hashSecurityAnswer('MyAnswer', 'somesalt');
    const unsalted = await hashSecurityAnswer('MyAnswer');
    expect(salted).not.toBe(unsalted);
  });

  it('different salts produce different hashes for the same answer', async () => {
    const h1 = await hashSecurityAnswer('MyAnswer', 'salt-a');
    const h2 = await hashSecurityAnswer('MyAnswer', 'salt-b');
    expect(h1).not.toBe(h2);
  });

  it('normalizes answer before hashing — case and whitespace are stripped', async () => {
    const salt = 'testsalt';
    const h1 = await hashSecurityAnswer('My Answer', salt);
    const h2 = await hashSecurityAnswer('  my answer  ', salt);
    expect(h1).toBe(h2);
  });

  it('produces a 64-character lowercase hex string (SHA-256)', async () => {
    const hash = await hashSecurityAnswer('test', 'anysalt');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('generateSalt', () => {
  it('returns a 64-character lowercase hex string (32 random bytes)', () => {
    const salt = generateSalt();
    expect(salt).toMatch(/^[0-9a-f]{64}$/);
  });

  it('generates a unique salt on each call', () => {
    const s1 = generateSalt();
    const s2 = generateSalt();
    expect(s1).not.toBe(s2);
  });
});
