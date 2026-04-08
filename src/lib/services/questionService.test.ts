// Created: 2026-04-08
// Tests: questionService — question CRUD and bulk import

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '../supabase';
import {
  addQuestion,
  updateQuestion,
  deleteQuestion,
  bulkImportQuestions,
} from './questionService';

vi.mock('../supabase');

function makeChain(data: unknown = null, error: unknown = null) {
  const promise = Promise.resolve({ data, error });
  const c: Record<string, unknown> = {};
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
const mockQuestion = {
  id: 'q1',
  week_id: 'w1',
  question_label: 'Vraag 1',
  question_text: 'What did you learn?',
  sort_order: 0,
  created_at: '',
  updated_at: '',
};

// ─── addQuestion ──────────────────────────────────────────────────────────────

describe('addQuestion', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the new question on success', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain(mockQuestion) as never);

    const result = await addQuestion('w1', 'Vraag 1', 'What did you learn?', 0);
    expect(result).toEqual(mockQuestion);
    expect(supabase.from).toHaveBeenCalledWith('exercise_questions');
  });

  it('returns null when insert fails', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      makeChain(null, { message: 'Insert failed' }) as never
    );

    const result = await addQuestion('w1', 'Vraag 1', 'What?', 0);
    expect(result).toBeNull();
  });
});

// ─── updateQuestion ───────────────────────────────────────────────────────────

describe('updateQuestion', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns true on success', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain(null, null) as never);

    const result = await updateQuestion('q1', { question_text: 'Updated text' });
    expect(result).toBe(true);
  });

  it('returns false when update fails', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      makeChain(null, { message: 'Update failed' }) as never
    );

    const result = await updateQuestion('q1', { question_text: 'Updated text' });
    expect(result).toBe(false);
  });
});

// ─── deleteQuestion ───────────────────────────────────────────────────────────

describe('deleteQuestion', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns true on success', async () => {
    vi.mocked(supabase.from).mockReturnValue(makeChain(null, null) as never);

    const result = await deleteQuestion('q1');
    expect(result).toBe(true);
  });

  it('returns false when delete fails', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      makeChain(null, { message: 'Delete failed' }) as never
    );

    const result = await deleteQuestion('q1');
    expect(result).toBe(false);
  });
});

// ─── bulkImportQuestions ──────────────────────────────────────────────────────

describe('bulkImportQuestions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns false when no user is authenticated', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as never);

    const result = await bulkImportQuestions('w1', [{ label: 'Q1', text: 'What?' }]);
    expect(result).toBe(false);
  });

  it('returns true when import succeeds without answers', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser as never },
      error: null,
    });
    // All supabase.from calls return success
    vi.mocked(supabase.from).mockReturnValue(makeChain([{ id: 'q1', sort_order: 0 }]) as never);

    const result = await bulkImportQuestions('w1', [{ label: 'Q1', text: 'What?' }]);
    expect(result).toBe(true);
  });

  it('returns true when import succeeds with answers', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser as never },
      error: null,
    });
    vi.mocked(supabase.from).mockReturnValue(makeChain([{ id: 'q1', sort_order: 0 }]) as never);

    const result = await bulkImportQuestions('w1', [
      { label: 'Q1', text: 'What?', answer: 'My answer' },
    ]);
    expect(result).toBe(true);
  });

  it('returns false when insert fails', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser as never },
      error: null,
    });
    // First call (existing questions select) returns empty
    vi.mocked(supabase.from)
      .mockReturnValueOnce(makeChain([]) as never)
      // Second call (insert questions) returns error
      .mockReturnValueOnce(makeChain(null, { message: 'Insert failed' }) as never);

    const result = await bulkImportQuestions('w1', [{ label: 'Q1', text: 'What?' }]);
    expect(result).toBe(false);
  });
});
