// Created: 2026-04-08
// Hook: usePowerPage
// Owns all state, data-loading, and action handlers for the Manage Weeks (Power) page.

import { useState, useEffect, useMemo } from 'react';
import { toast } from '../lib/toast';
import {
  fetchUserWeeks,
  fetchWeekWithQuestions,
  createWeek,
  updateWeek,
  deleteWeek,
  type ExerciseWeek,
  type WeekWithQuestions,
} from '../lib/services/weekService';
import {
  fetchUserQuarters,
  createQuarter,
  updateQuarter,
  deleteQuarter,
  type ExerciseQuarter,
} from '../lib/services/quarterService';
import { addQuestion, deleteQuestion, bulkImportQuestions } from '../lib/services/questionService';
import { saveAnswer, type Result } from '../lib/services/answerService';
import {
  createProgressTracker,
  getTrackerForQuestion,
  type ProgressTracker,
} from '../lib/services/trackerService';
import { copyWeekToQuarter } from '../lib/services/orchestrators/copyWeekOrchestrator';
import type { BulkImportData } from '../components/exercises';

export function usePowerPage(onNavigate: (path: string) => void) {
  const [weeks, setWeeks] = useState<ExerciseWeek[]>([]);
  const [quarters, setQuarters] = useState<ExerciseQuarter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Quarter badge filter
  const [activeQuarterId, setActiveQuarterId] = useState<string | 'unassigned' | null>(null);

  // Collapsible week list state
  const [expandedWeekIds, setExpandedWeekIds] = useState<Set<string>>(new Set());
  const [weekDataMap, setWeekDataMap] = useState<Map<string, WeekWithQuestions>>(new Map());
  const [loadingWeekIds, setLoadingWeekIds] = useState<Set<string>>(new Set());
  const [trackersMap, setTrackersMap] = useState<Record<string, ProgressTracker | null>>({});

  // Modals
  const [weekModalOpen, setWeekModalOpen] = useState(false);
  const [editingWeek, setEditingWeek] = useState<ExerciseWeek | null>(null);
  const [quarterModalOpen, setQuarterModalOpen] = useState(false);
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [questionTargetWeekId, setQuestionTargetWeekId] = useState<string | null>(null);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [bulkImportTargetWeekId, setBulkImportTargetWeekId] = useState<string | null>(null);

  useEffect(() => {
    loadWeeks();
  }, []);

  // Reset expanded weeks when quarter filter changes
  useEffect(() => {
    setExpandedWeekIds(new Set());
  }, [activeQuarterId]);

  const filteredWeeks = useMemo(() => {
    if (activeQuarterId === 'unassigned') return weeks.filter((w) => !w.quarter_id);
    if (activeQuarterId) return weeks.filter((w) => w.quarter_id === activeQuarterId);
    return weeks;
  }, [weeks, activeQuarterId]);

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

  async function loadWeekData(wId: string) {
    setLoadingWeekIds((prev) => new Set([...prev, wId]));
    const data = await fetchWeekWithQuestions(wId);
    if (data?.questions) {
      const trackers: Record<string, ProgressTracker | null> = {};
      await Promise.all(
        data.questions.map(async (q) => {
          trackers[q.id] = await getTrackerForQuestion(q.id);
        })
      );
      setTrackersMap((prev) => ({ ...prev, ...trackers }));
    }
    if (data) setWeekDataMap((prev) => new Map([...prev, [wId, data]]));
    setLoadingWeekIds((prev) => {
      const s = new Set(prev);
      s.delete(wId);
      return s;
    });
  }

  async function refreshWeekData(wId: string) {
    const data = await fetchWeekWithQuestions(wId);
    if (data?.questions) {
      const trackers: Record<string, ProgressTracker | null> = {};
      await Promise.all(
        data.questions.map(async (q) => {
          trackers[q.id] = await getTrackerForQuestion(q.id);
        })
      );
      setTrackersMap((prev) => ({ ...prev, ...trackers }));
    }
    if (data) setWeekDataMap((prev) => new Map([...prev, [wId, data]]));
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

  const handleAddWeek = () => {
    setEditingWeek(null);
    setWeekModalOpen(true);
  };

  const handleEditWeek = (wId: string) => {
    const week = weeks.find((w) => w.id === wId);
    if (week) {
      setEditingWeek(week);
      setWeekModalOpen(true);
    }
  };

  const handleSaveWeek = async (
    weekNumber: number,
    topic: string,
    quarterId: string | null,
    questions?: { label: string; text: string; answer?: string }[]
  ) => {
    if (editingWeek) {
      const ok = await updateWeek(editingWeek.id, {
        week_number: weekNumber,
        topic,
        quarter_id: quarterId,
      });
      if (!ok) {
        toast.error('Failed to update week. Please try again.');
        return;
      }
      setWeekDataMap((prev) => {
        const m = new Map(prev);
        m.delete(editingWeek.id);
        return m;
      });
    } else {
      const newWeek = await createWeek(weekNumber, topic, quarterId);
      if (!newWeek) {
        toast.error('Failed to create week. Please try again.');
        return;
      }
      if (questions && questions.length > 0) {
        const imported = await bulkImportQuestions(newWeek.id, questions);
        if (!imported) toast.error('Week created but some questions could not be imported.');
      }
      setExpandedWeekIds((prev) => new Set([...prev, newWeek.id]));
      await loadWeekData(newWeek.id);
    }
    await loadWeeks();
  };

  const handleCopyWeekToQuarter = async (
    targetQuarterId: string | null,
    includeAnswers: boolean
  ) => {
    if (!editingWeek) return;
    const result = await copyWeekToQuarter(editingWeek.id, targetQuarterId, includeAnswers);
    if (!result) {
      toast.error('Failed to copy week. Please try again.');
      return;
    }
    await loadWeeks();
  };

  const handleSaveQuarter = async (label: string, quarterId?: string) => {
    if (quarterId) {
      const ok = await updateQuarter(quarterId, label);
      if (!ok) {
        toast.error('Failed to update quarter. Please try again.');
        return;
      }
    } else {
      const result = await createQuarter(label);
      if (!result) {
        toast.error('Failed to create quarter. Please try again.');
        return;
      }
    }
    await loadWeeks();
  };

  const handleDeleteQuarter = async (quarterId: string) => {
    const ok = await deleteQuarter(quarterId);
    if (!ok) {
      toast.error('Failed to delete quarter. Please try again.');
      return;
    }
    await loadWeeks();
  };

  const handleDeleteWeek = async () => {
    if (!editingWeek) return;
    const ok = await deleteWeek(editingWeek.id);
    if (!ok) {
      toast.error('Failed to delete week. Please try again.');
      return;
    }
    setEditingWeek(null);
    setExpandedWeekIds((prev) => {
      const s = new Set(prev);
      s.delete(editingWeek.id);
      return s;
    });
    setWeekDataMap((prev) => {
      const m = new Map(prev);
      m.delete(editingWeek.id);
      return m;
    });
    await loadWeeks();
  };

  const handleSaveQuestion = async (label: string, text: string) => {
    if (!questionTargetWeekId) return;
    const sortOrder = weekDataMap.get(questionTargetWeekId)?.questions.length || 0;
    const result = await addQuestion(questionTargetWeekId, label, text, sortOrder);
    if (!result) {
      toast.error('Failed to add question. Please try again.');
      return;
    }
    await refreshWeekData(questionTargetWeekId);
  };

  const handleDeleteQuestion = async (questionId: string, wId: string) => {
    if (!confirm('Remove this question?')) return;
    const ok = await deleteQuestion(questionId);
    if (!ok) {
      toast.error('Failed to delete question. Please try again.');
      return;
    }
    await refreshWeekData(wId);
  };

  const handleBulkImport = async (data: BulkImportData) => {
    let targetWeekId = bulkImportTargetWeekId;

    if (data.weekNumber) {
      const existingWeek = weeks.find((w) => w.week_number === data.weekNumber);
      if (existingWeek) {
        targetWeekId = existingWeek.id;
      } else {
        const newWeek = await createWeek(data.weekNumber, data.theme || '');
        if (!newWeek) {
          toast.error('Failed to create week for import. Please try again.');
          return;
        }
        targetWeekId = newWeek.id;
        await loadWeeks();
      }
    }

    if (!targetWeekId) return;
    const ok = await bulkImportQuestions(targetWeekId, data.questions);
    if (!ok) toast.error('Some questions could not be imported. Please check and try again.');
    setExpandedWeekIds((prev) => new Set([...prev, targetWeekId!]));
    await refreshWeekData(targetWeekId);
  };

  const handleSaveAnswer = async (questionId: string, answerText: string): Promise<Result> =>
    await saveAnswer(questionId, answerText);

  const handleStartTracking = async (questionId: string) => {
    const result = await createProgressTracker(questionId);
    if (!result.ok) {
      if (result.error.code === 'auth') {
        toast.error('Your session has expired. Please sign in again.');
      } else {
        toast.error('Failed to start progress tracker. Please try again.');
      }
      return;
    }
    setTrackersMap((prev) => ({ ...prev, [questionId]: result.data }));
    onNavigate(`/progress/${result.data.id}`);
  };

  const hasUnassigned = weeks.some((w) => !w.quarter_id);

  return {
    // data
    weeks,
    quarters,
    filteredWeeks,
    weekDataMap,
    trackersMap,
    hasUnassigned,
    // loading
    isLoading,
    loadingWeekIds,
    // expand state
    expandedWeekIds,
    // filter
    activeQuarterId,
    setActiveQuarterId,
    // week actions
    toggleWeek,
    collapseAll,
    handleAddWeek,
    handleEditWeek,
    handleSaveWeek,
    handleDeleteWeek,
    handleCopyWeekToQuarter,
    // quarter actions
    handleSaveQuarter,
    handleDeleteQuarter,
    // question actions
    handleSaveQuestion,
    handleDeleteQuestion,
    handleBulkImport,
    handleSaveAnswer,
    handleStartTracking,
    // modal state
    weekModalOpen,
    setWeekModalOpen,
    editingWeek,
    setEditingWeek,
    quarterModalOpen,
    setQuarterModalOpen,
    questionModalOpen,
    setQuestionModalOpen,
    setQuestionTargetWeekId,
    bulkImportOpen,
    setBulkImportOpen,
    setBulkImportTargetWeekId,
  };
}
