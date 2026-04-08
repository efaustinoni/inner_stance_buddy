// Created: 2026-04-08
// Tests: quarterService — quarters CRUD

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '../supabase';
import { fetchUserQuarters, createQuarter, updateQuarter, deleteQuarter } from './quarterService';

vi.mock('../supabase');
vi.mock('../getCurrentUser');
vi.mock('../dataCache');

function makeChain(data: unknown = null, error: unknown = null) {
  const promise = Promise.resolve({ data, error });
  const c: Record<string, unknown> = {};
  c.then = (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) => promise.then(res, rej);
  for (const m of ['select', 'insert', 'update', 'delete', 'eq', 'order', 'in', 'filter']) {
    c[m] = vi.fn().mockReturnValue(c);
  }
  c.maybeSingle = vi.fn().mockReturnValue(promise);
  c.single = vi.fn().mockReturnValue(promise);
  return c;
}

const mockUser = { id: 'u1', email: 'user@test.com' };
const mockQuarter = { id: 'q1', user_id: 'u1', label: 'Q1 2026', created_at: '', updated_at: '' };

// ─── fetchUserQuarters ────────────────────────────────────────────────────────

describe('fetchUserQuarters', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns quarters on success', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain([mockQuarter]) as never);

    const result = await fetchUserQuarters();
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('Q1 2026');
  });

  it('returns empty array when no quarters exist', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain([]) as never);

    const result = await fetchUserQuarters();
    expect(result).toHaveLength(0);
  });

  it('throws when supabase returns an error', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain(null, { message: 'DB error' }) as never);

    await expect(fetchUserQuarters()).rejects.toMatchObject({ message: 'DB error' });
  });
});

// ─── createQuarter ────────────────────────────────────────────────────────────

describe('createQuarter', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns null when no user is authenticated', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as never);

    const result = await createQuarter('Q1');
    expect(result).toBeNull();
  });

  it('returns the new quarter on success', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser as never },
      error: null,
    });
    vi.mocked(supabase.from).mockReturnValue(makeChain(mockQuarter) as never);

    const result = await createQuarter('Q1 2026');
    expect(result).toEqual(mockQuarter);
  });

  it('returns null when insert fails', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser as never },
      error: null,
    });
    vi.mocked(supabase.from).mockReturnValue(
      makeChain(null, { message: 'Insert failed' }) as never
    );

    const result = await createQuarter('Q1');
    expect(result).toBeNull();
  });
});

// ─── updateQuarter ────────────────────────────────────────────────────────────

describe('updateQuarter', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns true on success', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain(null, null) as never);

    const result = await updateQuarter('q1', 'Q1 Updated');
    expect(result).toBe(true);
  });

  it('returns false when update fails', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      makeChain(null, { message: 'Update failed' }) as never
    );

    const result = await updateQuarter('q1', 'Q1 Updated');
    expect(result).toBe(false);
  });
});

// ─── deleteQuarter ────────────────────────────────────────────────────────────

describe('deleteQuarter', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns true on success', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain(null, null) as never);

    const result = await deleteQuarter('q1');
    expect(result).toBe(true);
  });

  it('returns false when delete fails', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      makeChain(null, { message: 'Delete failed' }) as never
    );

    const result = await deleteQuarter('q1');
    expect(result).toBe(false);
  });
});
