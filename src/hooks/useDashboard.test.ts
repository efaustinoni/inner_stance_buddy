// Created: 2026-04-08
// Tests: useDashboard — loading / success / error + filter / stats / clearFilters

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchDashboardData } from '../lib/services/orchestrators/dashboardOrchestrator';
import { fetchUserQuarters } from '../lib/services/quarterService';
import { useDashboard } from './useDashboard';

vi.mock('../lib/services/orchestrators/dashboardOrchestrator');
vi.mock('../lib/services/quarterService');
vi.mock('../lib/services/weekService');
vi.mock('../lib/toast');

const mockWeek = {
  id: 'w1',
  user_id: 'u1',
  week_number: 1,
  title: 'Exercise',
  topic: 'Focus',
  quarter_id: null,
  quarter_label: null,
  created_at: '',
  updated_at: '',
};

const makeQuestion = (id: string, text: string, overrides = {}) => ({
  id,
  question_label: `Label ${id}`,
  question_text: text,
  week_id: 'w1',
  week_number: 1,
  week_topic: 'Focus',
  quarter_id: null,
  quarter_label: null,
  ...overrides,
});

describe('useDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchUserQuarters).mockResolvedValue([]);
    vi.mocked(fetchDashboardData).mockResolvedValue({ weeks: [], questions: [] });
  });

  it('starts in loading state', () => {
    const { result } = renderHook(() => useDashboard());
    expect(result.current.loading).toBe(true);
  });

  it('resolves loading and populates data on success', async () => {
    vi.mocked(fetchDashboardData).mockResolvedValue({
      weeks: [mockWeek],
      questions: [makeQuestion('q1', 'What did you learn?')],
    });

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.weeks).toHaveLength(1);
    expect(result.current.filteredQuestions).toHaveLength(1);
    expect(result.current.loadError).toBe(false);
  });

  it('sets loadError when fetchDashboardData throws', async () => {
    vi.mocked(fetchDashboardData).mockRejectedValue(new Error('Network failure'));

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.loadError).toBe(true);
    expect(result.current.filteredQuestions).toHaveLength(0);
  });

  it('filters questions by searchQuery', async () => {
    vi.mocked(fetchDashboardData).mockResolvedValue({
      weeks: [mockWeek],
      questions: [
        makeQuestion('q1', 'Learn something new'),
        makeQuestion('q2', 'Do something else entirely'),
      ],
    });

    const { result } = renderHook(() => useDashboard());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setSearchQuery('Learn');
    });

    expect(result.current.filteredQuestions).toHaveLength(1);
    expect(result.current.filteredQuestions[0].id).toBe('q1');
  });

  it('calculates correct stats from all questions', async () => {
    vi.mocked(fetchDashboardData).mockResolvedValue({
      weeks: [mockWeek],
      questions: [
        makeQuestion('q1', 'Question 1', { answer_text: 'My answer', tracker_id: 't1' }),
        makeQuestion('q2', 'Question 2', { answer_text: 'Another answer' }),
        makeQuestion('q3', 'Question 3'),
      ],
    });

    const { result } = renderHook(() => useDashboard());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.stats.total).toBe(3);
    expect(result.current.stats.answered).toBe(2);
    expect(result.current.stats.tracked).toBe(1);
  });

  it('clearFilters resets all filter state', async () => {
    const { result } = renderHook(() => useDashboard());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setSearchQuery('test');
      result.current.setSelectedWeek('w1');
      result.current.setFilterMode('tracked');
    });

    expect(result.current.hasActiveFilters).toBe(true);

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.searchQuery).toBe('');
    expect(result.current.selectedWeek).toBeNull();
    expect(result.current.filterMode).toBe('all');
    expect(result.current.hasActiveFilters).toBe(false);
  });
});
