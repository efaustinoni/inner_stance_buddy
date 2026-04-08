// Created: 2026-04-08
// Tests: copyWeekOrchestrator — week + questions + optional answers deep-copy

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '../../supabase';
import { copyWeekToQuarter } from './copyWeekOrchestrator';

vi.mock('../../supabase');

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

const mockSourceWeek = {
  id: 'w1',
  user_id: 'u1',
  week_number: 1,
  title: 'Exercise',
  topic: 'Focus',
  quarter_id: 'q1',
  created_at: '',
  updated_at: '',
};

const mockNewWeek = {
  id: 'w2',
  user_id: 'u1',
  week_number: 1,
  title: 'Exercise',
  topic: 'Focus',
  quarter_id: 'q2',
  created_at: '',
  updated_at: '',
};

const mockQuestion = {
  id: 'q1',
  week_id: 'w1',
  question_label: 'Vraag 1',
  question_text: 'What?',
  sort_order: 0,
};

const mockNewQuestion = { id: 'q2', sort_order: 0 };

describe('copyWeekToQuarter', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns null when no user is authenticated', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as never);

    const result = await copyWeekToQuarter('w1', 'q2', false);
    expect(result).toBeNull();
  });

  it('returns null when source week is not found', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser as never },
      error: null,
    });
    // maybeSingle returns null data → source week not found
    vi.mocked(supabase.from).mockReturnValue(makeChain(null) as never);

    const result = await copyWeekToQuarter('w1', 'q2', false);
    expect(result).toBeNull();
  });

  it('returns null when new week insert fails', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser as never },
      error: null,
    });
    vi.mocked(supabase.from)
      .mockReturnValueOnce(makeChain(mockSourceWeek) as never) // source week maybeSingle
      .mockReturnValueOnce(makeChain(null, { message: 'Insert failed' }) as never); // new week single

    const result = await copyWeekToQuarter('w1', 'q2', false);
    expect(result).toBeNull();
  });

  it('returns the new week when copy succeeds without answers', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser as never },
      error: null,
    });
    vi.mocked(supabase.from)
      .mockReturnValueOnce(makeChain(mockSourceWeek) as never) // source week
      .mockReturnValueOnce(makeChain(mockNewWeek) as never) // new week insert
      .mockReturnValueOnce(makeChain([mockQuestion]) as never) // source questions
      .mockReturnValueOnce(makeChain([mockNewQuestion]) as never); // batch insert questions

    const result = await copyWeekToQuarter('w1', 'q2', false);
    expect(result).toEqual(mockNewWeek);
  });

  it('returns the new week when copy succeeds with answers', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser as never },
      error: null,
    });
    const mockAnswer = { question_id: 'q1', user_id: 'u1', answer_text: 'My answer' };

    vi.mocked(supabase.from)
      .mockReturnValueOnce(makeChain(mockSourceWeek) as never) // source week
      .mockReturnValueOnce(makeChain(mockNewWeek) as never) // new week insert
      .mockReturnValueOnce(makeChain([mockQuestion]) as never) // source questions
      .mockReturnValueOnce(makeChain([mockNewQuestion]) as never) // batch insert questions
      .mockReturnValueOnce(makeChain([mockAnswer]) as never) // source answers
      .mockReturnValueOnce(makeChain(null, null) as never); // answer insert

    const result = await copyWeekToQuarter('w1', 'q2', true);
    expect(result).toEqual(mockNewWeek);
  });
});
