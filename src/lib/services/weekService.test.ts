// Created: 2026-04-08
// Tests: weekService — weeks CRUD

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '../supabase';
import {
  fetchUserWeeks,
  createWeek,
  updateWeek,
  deleteWeek,
  moveWeekToQuarter,
} from './weekService';

vi.mock('../supabase');
vi.mock('../getCurrentUser');
vi.mock('../dataCache');

/**
 * Creates a thenable mock chain so that `await chain.method()` or
 * `await chain` both resolve to `{ data, error }`.
 * This covers Supabase queries that terminate with .order(), .eq(), etc.
 * as well as those that end with .single() / .maybeSingle().
 */
function makeChain(data: unknown = null, error: unknown = null) {
  const promise = Promise.resolve({ data, error });
  const c: Record<string, unknown> = {};
  // Make the chain itself awaitable (for queries that don't end with .single())
  c.then = (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) => promise.then(res, rej);
  for (const m of [
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'neq',
    'order',
    'in',
    'filter',
    'not',
  ]) {
    c[m] = vi.fn().mockReturnValue(c);
  }
  c.maybeSingle = vi.fn().mockReturnValue(promise);
  c.single = vi.fn().mockReturnValue(promise);
  c.upsert = vi.fn().mockReturnValue(promise);
  return c;
}

const mockUser = { id: 'u1', email: 'user@test.com' };

const mockWeek = {
  id: 'w1',
  user_id: 'u1',
  week_number: 1,
  title: 'Exercise',
  topic: 'Focus',
  quarter_id: 'q1',
  exercise_quarters: { label: 'Q1' },
  created_at: '',
  updated_at: '',
};

// ─── fetchUserWeeks ───────────────────────────────────────────────────────────

describe('fetchUserWeeks', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns mapped weeks on success', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain([mockWeek]) as never);

    const result = await fetchUserWeeks();

    expect(result).toHaveLength(1);
    expect(result[0].quarter_label).toBe('Q1');
    // exercise_quarters join should be stripped from the output
    expect((result[0] as unknown as Record<string, unknown>).exercise_quarters).toBeUndefined();
  });

  it('returns empty array when no weeks exist', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain([]) as never);

    const result = await fetchUserWeeks();
    expect(result).toHaveLength(0);
  });

  it('throws when supabase returns an error', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain(null, { message: 'DB error' }) as never);

    await expect(fetchUserWeeks()).rejects.toMatchObject({ message: 'DB error' });
  });
});

// ─── createWeek ───────────────────────────────────────────────────────────────

describe('createWeek', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns null when no user is authenticated', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as never);

    const result = await createWeek(1, 'Focus');
    expect(result).toBeNull();
  });

  it('returns the new week on success', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser as never },
      error: null,
    });
    const newWeek = { id: 'w2', week_number: 2, topic: 'Growth', user_id: 'u1' };
    vi.mocked(supabase.from).mockReturnValue(makeChain(newWeek) as never);

    const result = await createWeek(2, 'Growth');
    expect(result).toEqual(newWeek);
  });

  it('returns null when insert fails', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser as never },
      error: null,
    });
    vi.mocked(supabase.from).mockReturnValue(
      makeChain(null, { message: 'Insert failed' }) as never
    );

    const result = await createWeek(1, 'Focus');
    expect(result).toBeNull();
  });
});

// ─── updateWeek ───────────────────────────────────────────────────────────────

describe('updateWeek', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns true on success', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain(null, null) as never);

    const result = await updateWeek('w1', { topic: 'New topic' });
    expect(result).toBe(true);
  });

  it('returns false when update fails', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      makeChain(null, { message: 'Update failed' }) as never
    );

    const result = await updateWeek('w1', { topic: 'New topic' });
    expect(result).toBe(false);
  });
});

// ─── deleteWeek ───────────────────────────────────────────────────────────────

describe('deleteWeek', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns true on success', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain(null, null) as never);

    const result = await deleteWeek('w1');
    expect(result).toBe(true);
  });

  it('returns false when delete fails', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      makeChain(null, { message: 'Delete failed' }) as never
    );

    const result = await deleteWeek('w1');
    expect(result).toBe(false);
  });
});

// ─── moveWeekToQuarter ────────────────────────────────────────────────────────

describe('moveWeekToQuarter', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns true on success', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain(null, null) as never);

    const result = await moveWeekToQuarter('w1', 'q1');
    expect(result).toBe(true);
  });

  it('returns false when update fails', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      makeChain(null, { message: 'Update failed' }) as never
    );

    const result = await moveWeekToQuarter('w1', null);
    expect(result).toBe(false);
  });
});
