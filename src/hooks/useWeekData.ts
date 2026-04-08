// Created: 2026-04-08
// Extracted from usePowerPage.ts.
// Manages week/quarter data loading, expand-state, and filtering.
// usePowerPage uses this hook and adds the CRUD action handlers on top.

import { useState, useEffect, useMemo } from 'react';
import { toast } from '../lib/toast';
import {
  fetchUserWeeks,
  fetchWeekWithQuestions,
  type ExerciseWeek,
  type WeekWithQuestions,
} from '../lib/services/weekService';
import { fetchUserQuarters, type ExerciseQuarter } from '../lib/services/quarterService';
import { getTrackersForQuestions, type ProgressTracker } from '../lib/services/trackerService';

export function useWeekData() {
  const [weeks, setWeeks] = useState<ExerciseWeek[]>([]);
  const [quarters, setQuarters] = useState<ExerciseQuarter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeQuarterId, setActiveQuarterId] = useState<string | 'unassigned' | null>(null);
  const [expandedWeekIds, setExpandedWeekIds] = useState<Set<string>>(new Set());
  const [weekDataMap, setWeekDataMap] = useState<Map<string, WeekWithQuestions>>(new Map());
  const [loadingWeekIds, setLoadingWeekIds] = useState<Set<string>>(new Set());
  const [trackersMap, setTrackersMap] = useState<Record<string, ProgressTracker | null>>({});

  useEffect(() => {
    loadWeeks();
  }, []);

  // Reset expand state when quarter filter changes
  useEffect(() => {
    setExpandedWeekIds(new Set());
  }, [activeQuarterId]);

  const filteredWeeks = useMemo(() => {
    if (activeQuarterId === 'unassigned') return weeks.filter((w) => !w.quarter_id);
    if (activeQuarterId) return weeks.filter((w) => w.quarter_id === activeQuarterId);
    return weeks;
  }, [weeks, activeQuarterId]);

  const hasUnassigned = weeks.some((w) => !w.quarter_id);

  async function loadWeeks() {
    setIsLoading(true);
    try {
      const [data, quartersData] = await Promise.all([fetchUserWeeks(), fetchUserQuarters()]);
      setWeeks(data);
      setQuarters(quartersData);
    } catch {
      toast.error('Failed to load weeks. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  // Shared core: fetch week + questions + trackers and update state maps.
  async function _fetchAndStoreWeekData(wId: string) {
    const data = await fetchWeekWithQuestions(wId);
    if (data?.questions) {
      const trackers = await getTrackersForQuestions(data.questions.map((q) => q.id));
      setTrackersMap((prev) => ({ ...prev, ...trackers }));
    }
    if (data) setWeekDataMap((prev) => new Map([...prev, [wId, data]]));
  }

  async function loadWeekData(wId: string) {
    setLoadingWeekIds((prev) => new Set([...prev, wId]));
    await _fetchAndStoreWeekData(wId);
    setLoadingWeekIds((prev) => {
      const s = new Set(prev);
      s.delete(wId);
      return s;
    });
  }

  async function refreshWeekData(wId: string) {
    await _fetchAndStoreWeekData(wId);
  }

  const toggleWeek = (wId: string) => {
    setExpandedWeekIds((prev) => {
      const next = new Set(prev);
      if (next.has(wId)) {
        next.delete(wId);
      } else {
        next.add(wId);
        if (!weekDataMap.has(wId) && !loadingWeekIds.has(wId)) {
          loadWeekData(wId);
        }
      }
      return next;
    });
  };

  const collapseAll = () => setExpandedWeekIds(new Set());

  return {
    // state
    weeks,
    quarters,
    isLoading,
    activeQuarterId,
    filteredWeeks,
    hasUnassigned,
    expandedWeekIds,
    weekDataMap,
    loadingWeekIds,
    trackersMap,
    // setters — needed by action handlers in usePowerPage
    setWeeks,
    setExpandedWeekIds,
    setWeekDataMap,
    setTrackersMap,
    setActiveQuarterId,
    // actions
    loadWeeks,
    loadWeekData,
    refreshWeekData,
    toggleWeek,
    collapseAll,
  };
}
