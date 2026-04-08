// Created: 2026-04-08
// Tests: dashboardOrchestrator — fetchDashboardData

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '../../supabase';
import { fetchDashboardData } from './dashboardOrchestrator';

vi.mock('../../supabase');

// Builds a chain whose sync methods return the chain itself, and whose
// .data / .error properties are used when the chain is awaited directly
// (i.e. after .select().order() or .select().in() terminal calls).
function makeChain(data: unknown = null, error: unknown = null) {
  const c: Record<string, unknown> = { data, error };
  ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'order', 'in', 'filter', 'not'].forEach(
    (m) => {
      c[m] = vi.fn().mockReturnValue(c);
    }
  );
  c['maybeSingle'] = vi.fn().mockResolvedValue({ data, error });
  c['single'] = vi.fn().mockResolvedValue({ data, error });
  return c;
}

const mockUser = { id: 'u1', email: 'user@test.com' };

const mockWeeksRaw = [
  {
    id: 'w1',
    user_id: 'u1',
    week_number: 1,
    title: 'Exercise',
    topic: 'Focus',
    quarter_id: null,
    created_at: '',
    updated_at: '',
    exercise_quarters: null,
  },
];

const mockQuestions = [
  {
    id: 'q1',
    week_id: 'w1',
    question_label: 'Reflectie 1',
    question_text: 'What did you learn?',
    sort_order: 0,
    created_at: '',
    updated_at: '',
  },
];

const mockAnswers = [
  {
    id: 'a1',
    question_id: 'q1',
    user_id: 'u1',
    answer_text: 'I learned a lot',
    created_at: '',
    updated_at: '',
  },
];

const mockTrackers = [
  {
    id: 't1',
    question_id: 'q1',
    user_id: 'u1',
    started_at: '2026-01-01',
    is_active: true,
    created_at: '',
    updated_at: '',
  },
];

describe('fetchDashboardData', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns empty when no user is authenticated', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as never);

    const result = await fetchDashboardData();

    expect(result).toEqual({ weeks: [], questions: [] });
  });

  it('returns empty when there are no weeks', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser as never },
      error: null,
    });
    // All from() calls return empty data
    vi.mocked(supabase.from).mockReturnValue(makeChain([]) as never);

    const result = await fetchDashboardData();

    expect(result).toEqual({ weeks: [], questions: [] });
  });

  it('returns weeks with empty questions when no questions exist', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser as never },
      error: null,
    });
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'exercise_weeks') return makeChain(mockWeeksRaw) as never;
      // questions query returns empty
      return makeChain([]) as never;
    });

    const result = await fetchDashboardData();

    expect(result.weeks).toHaveLength(1);
    expect(result.questions).toHaveLength(0);
  });

  it('maps questions with their answers and tracker data', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser as never },
      error: null,
    });
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'exercise_weeks') return makeChain(mockWeeksRaw) as never;
      if (table === 'decrypted_exercise_questions') return makeChain(mockQuestions) as never;
      if (table === 'decrypted_exercise_answers') return makeChain(mockAnswers) as never;
      if (table === 'progress_trackers') return makeChain(mockTrackers) as never;
      return makeChain([]) as never;
    });

    const result = await fetchDashboardData();

    expect(result.questions).toHaveLength(1);
    const q = result.questions[0];
    expect(q.id).toBe('q1');
    expect(q.week_number).toBe(1);
    expect(q.week_topic).toBe('Focus');
    expect(q.answer_text).toBe('I learned a lot');
    expect(q.tracker_id).toBe('t1');
    expect(q.tracker_started_at).toBe('2026-01-01');
  });

  it('handles questions with no answers or trackers gracefully', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser as never },
      error: null,
    });
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'exercise_weeks') return makeChain(mockWeeksRaw) as never;
      if (table === 'decrypted_exercise_questions') return makeChain(mockQuestions) as never;
      // No answers, no trackers
      return makeChain([]) as never;
    });

    const result = await fetchDashboardData();

    expect(result.questions).toHaveLength(1);
    const q = result.questions[0];
    expect(q.answer_text).toBeUndefined();
    expect(q.tracker_id).toBeUndefined();
  });
});
