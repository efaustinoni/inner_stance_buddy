// Created: 2026-04-08
// Tests: trackerService — tracker and check-in CRUD

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '../supabase';
import {
  createProgressTracker,
  getTrackerForQuestion,
  toggleCheckIn,
  deleteProgressTracker,
  updateCheckInNotes,
} from './trackerService';

vi.mock('../supabase');

function makeChain(
  overrides: {
    data?: unknown;
    error?: unknown;
    maybeSingleData?: unknown;
    maybeSingleError?: unknown;
    singleData?: unknown;
    singleError?: unknown;
  } = {}
) {
  const c: Record<string, unknown> = {
    data: overrides.data ?? null,
    error: overrides.error ?? null,
  };
  ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'order', 'in', 'filter', 'not'].forEach(
    (m) => {
      c[m] = vi.fn().mockReturnValue(c);
    }
  );
  c['maybeSingle'] = vi.fn().mockResolvedValue({
    data: overrides.maybeSingleData ?? null,
    error: overrides.maybeSingleError ?? null,
  });
  c['single'] = vi.fn().mockResolvedValue({
    data: overrides.singleData ?? null,
    error: overrides.singleError ?? null,
  });
  return c;
}

const mockUser = { id: 'u1', email: 'user@test.com' };

const mockTracker = {
  id: 't1',
  question_id: 'q1',
  user_id: 'u1',
  started_at: '2026-01-01',
  is_active: true,
  created_at: '',
  updated_at: '',
};

// ─── createProgressTracker ───────────────────────────────────────────────────

describe('createProgressTracker', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns auth error when no user is authenticated', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as never);

    const result = await createProgressTracker('q1');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('auth');
  });

  it('returns the new tracker on success', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser as never },
      error: null,
    });
    vi.mocked(supabase.from).mockReturnValue(makeChain({ singleData: mockTracker }) as never);

    const result = await createProgressTracker('q1');

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual(mockTracker);
  });

  it('returns db error when the insert fails', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser as never },
      error: null,
    });
    vi.mocked(supabase.from).mockReturnValue(
      makeChain({ singleError: { message: 'DB error' } }) as never
    );

    const result = await createProgressTracker('q1');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('db');
  });
});

// ─── getTrackerForQuestion ────────────────────────────────────────────────────

describe('getTrackerForQuestion', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns null when no user is authenticated', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as never);

    const result = await getTrackerForQuestion('q1');

    expect(result).toBeNull();
  });

  it('returns the tracker when found', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser as never },
      error: null,
    });
    vi.mocked(supabase.from).mockReturnValue(makeChain({ maybeSingleData: mockTracker }) as never);

    const result = await getTrackerForQuestion('q1');

    expect(result).toEqual(mockTracker);
  });

  it('returns null when query returns an error', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser as never },
      error: null,
    });
    vi.mocked(supabase.from).mockReturnValue(
      makeChain({ maybeSingleError: { message: 'Query error' } }) as never
    );

    const result = await getTrackerForQuestion('q1');

    expect(result).toBeNull();
  });
});

// ─── toggleCheckIn ───────────────────────────────────────────────────────────
// ITEM-08: now uses upsert — no read before write

function makeUpsertChain(upsertError: unknown = null) {
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

describe('toggleCheckIn', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns true when upsert succeeds', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeUpsertChain(null) as never);

    const result = await toggleCheckIn('t1', '2026-01-15', true);

    expect(result).toBe(true);
  });

  it('returns false when upsert fails', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      makeUpsertChain({ message: 'Upsert failed' }) as never
    );

    const result = await toggleCheckIn('t1', '2026-01-15', true);

    expect(result).toBe(false);
  });
});

// ─── deleteProgressTracker ───────────────────────────────────────────────────

describe('deleteProgressTracker', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns true on successful deletion', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain({ error: null }) as never);

    const result = await deleteProgressTracker('t1');

    expect(result).toBe(true);
  });

  it('returns false when deletion fails', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      makeChain({ error: { message: 'Delete failed' } }) as never
    );

    const result = await deleteProgressTracker('t1');

    expect(result).toBe(false);
  });
});

// ─── updateCheckInNotes ───────────────────────────────────────────────────────

describe('updateCheckInNotes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a new check-in with notes when none exists', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(makeChain({ maybeSingleData: null }) as never) // select → not found
      .mockReturnValueOnce(makeChain({ error: null }) as never); // insert → success

    const result = await updateCheckInNotes('t1', '2026-01-15', 'Great session');

    expect(result).toBe(true);
  });

  it('updates notes on an existing check-in', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(makeChain({ maybeSingleData: { id: 'ci1' } }) as never) // select → existing
      .mockReturnValueOnce(makeChain({ error: null }) as never); // update → success

    const result = await updateCheckInNotes('t1', '2026-01-15', 'Updated notes');

    expect(result).toBe(true);
  });

  it('returns false when the write fails', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(makeChain({ maybeSingleData: null }) as never)
      .mockReturnValueOnce(makeChain({ error: { message: 'Write failed' } }) as never);

    const result = await updateCheckInNotes('t1', '2026-01-15', 'Some notes');

    expect(result).toBe(false);
  });
});
