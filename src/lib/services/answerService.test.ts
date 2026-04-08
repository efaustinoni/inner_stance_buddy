// Created: 2026-04-08
// Last Updated: 2026-04-08 (ITEM-08: updated for upsert implementation)
// Tests: answerService — saveAnswer

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '../supabase';
import { saveAnswer } from './answerService';

vi.mock('../supabase');

// upsert is a terminal promise; error controls whether it resolves with an error.
function makeChain(upsertError: unknown = null) {
  const c: Record<string, unknown> = { data: null, error: null };
  ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'order', 'in', 'filter', 'not'].forEach(
    (m) => {
      c[m] = vi.fn().mockReturnValue(c);
    }
  );
  c['upsert'] = vi.fn().mockResolvedValue({ data: null, error: upsertError });
  c['maybeSingle'] = vi.fn().mockResolvedValue({ data: null, error: null });
  c['single'] = vi.fn().mockResolvedValue({ data: null, error: null });
  return c;
}

const mockUser = { id: 'u1', email: 'user@test.com' };

describe('saveAnswer', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns false when no user is authenticated', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as never);

    const result = await saveAnswer('q1', 'My answer');

    expect(result).toBe(false);
  });

  it('saves an answer via upsert on success', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser as never },
      error: null,
    });
    vi.mocked(supabase.from).mockReturnValue(makeChain(null) as never);

    const result = await saveAnswer('q1', 'My answer');

    expect(result).toBe(true);
    expect(supabase.from).toHaveBeenCalledWith('exercise_answers');
  });

  it('returns false when upsert fails', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser as never },
      error: null,
    });
    vi.mocked(supabase.from).mockReturnValue(makeChain({ message: 'DB write error' }) as never);

    const result = await saveAnswer('q1', 'My answer');

    expect(result).toBe(false);
  });
});
