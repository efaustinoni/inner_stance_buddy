// Created: 2026-04-08
// Tests: usePowerPage — loading / success / error + quarter filter + modal state

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchUserWeeks, fetchUserQuarters } from '../lib/exerciseService';
import { usePowerPage } from './usePowerPage';

vi.mock('../lib/exerciseService');
vi.mock('../lib/toast');

const onNavigate = vi.fn();

const mockWeek = {
  id: 'w1',
  user_id: 'u1',
  week_number: 1,
  title: 'Exercise',
  topic: 'Focus',
  quarter_id: 'q1',
  quarter_label: 'Q1',
  created_at: '',
  updated_at: '',
};

const mockQuarter = {
  id: 'q1',
  user_id: 'u1',
  label: 'Q1 2026',
  created_at: '',
  updated_at: '',
};

describe('usePowerPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchUserWeeks).mockResolvedValue([]);
    vi.mocked(fetchUserQuarters).mockResolvedValue([]);
  });

  it('starts in loading state', () => {
    const { result } = renderHook(() => usePowerPage(onNavigate));
    expect(result.current.isLoading).toBe(true);
  });

  it('resolves loading and populates data on success', async () => {
    vi.mocked(fetchUserWeeks).mockResolvedValue([mockWeek]);
    vi.mocked(fetchUserQuarters).mockResolvedValue([mockQuarter]);

    const { result } = renderHook(() => usePowerPage(onNavigate));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.weeks).toHaveLength(1);
    expect(result.current.quarters).toHaveLength(1);
  });

  it('resolves loading with toast when loadWeeks throws', async () => {
    vi.mocked(fetchUserWeeks).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => usePowerPage(onNavigate));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Weeks should be empty (error was caught)
    expect(result.current.weeks).toHaveLength(0);
  });

  it('filteredWeeks shows all weeks when no quarter filter is set', async () => {
    vi.mocked(fetchUserWeeks).mockResolvedValue([mockWeek]);

    const { result } = renderHook(() => usePowerPage(onNavigate));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.filteredWeeks).toHaveLength(1);
  });

  it('filteredWeeks filters by activeQuarterId', async () => {
    const unassignedWeek = { ...mockWeek, id: 'w2', quarter_id: null, quarter_label: null };
    vi.mocked(fetchUserWeeks).mockResolvedValue([mockWeek, unassignedWeek]);

    const { result } = renderHook(() => usePowerPage(onNavigate));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.setActiveQuarterId('q1');
    });

    expect(result.current.filteredWeeks).toHaveLength(1);
    expect(result.current.filteredWeeks[0].id).toBe('w1');
  });

  it('filteredWeeks shows unassigned weeks when filter is "unassigned"', async () => {
    const unassignedWeek = { ...mockWeek, id: 'w2', quarter_id: null, quarter_label: null };
    vi.mocked(fetchUserWeeks).mockResolvedValue([mockWeek, unassignedWeek]);

    const { result } = renderHook(() => usePowerPage(onNavigate));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.setActiveQuarterId('unassigned');
    });

    expect(result.current.filteredWeeks).toHaveLength(1);
    expect(result.current.filteredWeeks[0].id).toBe('w2');
  });

  it('handleAddWeek opens the week modal', async () => {
    const { result } = renderHook(() => usePowerPage(onNavigate));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.weekModalOpen).toBe(false);

    act(() => {
      result.current.handleAddWeek();
    });

    expect(result.current.weekModalOpen).toBe(true);
    expect(result.current.editingWeek).toBeNull();
  });
});
