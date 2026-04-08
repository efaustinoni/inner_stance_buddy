// Created: 2026-04-08
// Hook: useDashboard
// Owns all data-loading, filtering, grouping, and collapse logic for the Dashboard page.

import { useState, useEffect, useMemo } from 'react';
import { toast } from '../lib/toast';
import {
  fetchDashboardData,
  fetchUserQuarters,
  moveWeekToQuarter,
  type ExerciseWeek,
  type ExerciseQuarter,
  type DashboardQuestion,
} from '../lib/exerciseService';

export type FilterMode = 'all' | 'tracked' | 'untracked';

export function useDashboard() {
  const [weeks, setWeeks] = useState<ExerciseWeek[]>([]);
  const [quarters, setQuarters] = useState<ExerciseQuarter[]>([]);
  const [questions, setQuestions] = useState<DashboardQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const [selectedQuarter, setSelectedQuarter] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedQuarters, setCollapsedQuarters] = useState<Set<string>>(new Set());
  const [collapsedWeeks, setCollapsedWeeks] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  // Reset collapsed weeks whenever the quarter or week filter changes
  // so the user always sees questions expanded when switching context
  useEffect(() => {
    setCollapsedWeeks(new Set());
  }, [selectedQuarter, selectedWeek]);

  const loadData = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const [data, quartersData] = await Promise.all([fetchDashboardData(), fetchUserQuarters()]);
      setWeeks(data.weeks);
      setQuestions(data.questions);
      setQuarters(quartersData);
    } catch {
      setLoadError(true);
      toast.error('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleQuarterCollapse = (key: string) => {
    setCollapsedQuarters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleWeekCollapse = (weekId: string) => {
    setCollapsedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekId)) next.delete(weekId);
      else next.add(weekId);
      return next;
    });
  };

  const handleChangeWeekQuarter = async (weekId: string, quarterId: string) => {
    const ok = await moveWeekToQuarter(weekId, quarterId || null);
    if (!ok) {
      toast.error('Failed to move week. Please try again.');
      return;
    }
    await loadData();
  };

  const filteredQuestions = useMemo(() => {
    let result = questions;

    if (selectedQuarter === '__unassigned__') {
      result = result.filter((q) => !q.quarter_id);
    } else if (selectedQuarter) {
      result = result.filter((q) => q.quarter_id === selectedQuarter);
    }

    if (selectedWeek) {
      result = result.filter((q) => q.week_id === selectedWeek);
    }

    if (filterMode === 'tracked') {
      result = result.filter((q) => q.tracker_id);
    } else if (filterMode === 'untracked') {
      result = result.filter((q) => !q.tracker_id);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (q) =>
          q.question_text.toLowerCase().includes(query) ||
          q.question_label.toLowerCase().includes(query) ||
          q.answer_text?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [questions, selectedQuarter, selectedWeek, filterMode, searchQuery]);

  const stats = useMemo(() => {
    const total = questions.length;
    const answered = questions.filter((q) => q.answer_text).length;
    const tracked = questions.filter((q) => q.tracker_id).length;
    return { total, answered, tracked };
  }, [questions]);

  // Group by quarter then by week_id (not week_number, since same number can appear in multiple quarters)
  const groupedByQuarterAndWeek = useMemo(() => {
    const quarterGroups: Map<
      string,
      {
        label: string;
        weeks: Map<string, { weekNumber: number; topic: string; questions: DashboardQuestion[] }>;
      }
    > = new Map();

    filteredQuestions.forEach((q) => {
      const qKey = q.quarter_id ?? '__unassigned__';
      const qLabel = q.quarter_label ?? 'Unassigned';

      if (!quarterGroups.has(qKey)) {
        quarterGroups.set(qKey, { label: qLabel, weeks: new Map() });
      }

      const weekMap = quarterGroups.get(qKey)!.weeks;
      if (!weekMap.has(q.week_id)) {
        weekMap.set(q.week_id, { weekNumber: q.week_number, topic: q.week_topic, questions: [] });
      }
      weekMap.get(q.week_id)!.questions.push(q);
    });

    // Sort: assigned quarters by creation order, unassigned last
    return Array.from(quarterGroups.entries()).sort((a, b) => {
      if (a[0] === '__unassigned__') return 1;
      if (b[0] === '__unassigned__') return -1;
      const ai = quarters.findIndex((q) => q.id === a[0]);
      const bi = quarters.findIndex((q) => q.id === b[0]);
      return ai - bi;
    });
  }, [filteredQuestions, quarters]);

  const clearFilters = () => {
    setSelectedWeek(null);
    setSelectedQuarter(null);
    setFilterMode('all');
    setSearchQuery('');
  };

  const hasActiveFilters = !!(
    selectedWeek ||
    selectedQuarter ||
    filterMode !== 'all' ||
    searchQuery.trim()
  );

  return {
    // data
    weeks,
    quarters,
    filteredQuestions,
    stats,
    groupedByQuarterAndWeek,
    // loading state
    loading,
    loadError,
    // filter state
    selectedWeek,
    selectedQuarter,
    filterMode,
    searchQuery,
    hasActiveFilters,
    // collapse state
    collapsedQuarters,
    collapsedWeeks,
    // actions
    loadData,
    setSelectedWeek,
    setSelectedQuarter,
    setFilterMode,
    setSearchQuery,
    clearFilters,
    toggleQuarterCollapse,
    toggleWeekCollapse,
    handleChangeWeekQuarter,
  };
}
