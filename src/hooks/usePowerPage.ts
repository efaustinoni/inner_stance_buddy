// Created: 2026-04-08
// Hook: usePowerPage
// Owns modal state and CRUD action handlers for the Manage Weeks page.
// Data loading and expand-state are delegated to useWeekData.

import { useState } from 'react';
import { toast } from '../lib/toast';
import { createWeek, updateWeek, deleteWeek, type ExerciseWeek } from '../lib/services/weekService';
import { createQuarter, updateQuarter, deleteQuarter } from '../lib/services/quarterService';
import { addQuestion, deleteQuestion, bulkImportQuestions } from '../lib/services/questionService';
import { saveAnswer, type Result } from '../lib/services/answerService';
import { createProgressTracker } from '../lib/services/trackerService';
import { copyWeekToQuarter } from '../lib/services/orchestrators/copyWeekOrchestrator';
import type { BulkImportData } from '../components/exercises';
import { useWeekData } from './useWeekData';

export function usePowerPage(onNavigate: (path: string) => void) {
  const {
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
    setExpandedWeekIds,
    setWeekDataMap,
    setTrackersMap,
    setActiveQuarterId,
    loadWeeks,
    loadWeekData,
    refreshWeekData,
    toggleWeek,
    collapseAll,
  } = useWeekData();

  // Modal state
  const [weekModalOpen, setWeekModalOpen] = useState(false);
  const [editingWeek, setEditingWeek] = useState<ExerciseWeek | null>(null);
  const [quarterModalOpen, setQuarterModalOpen] = useState(false);
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [questionTargetWeekId, setQuestionTargetWeekId] = useState<string | null>(null);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [bulkImportTargetWeekId, setBulkImportTargetWeekId] = useState<string | null>(null);

  // Pending question deletion — replaces confirm() with state-driven confirmation in the UI
  const [pendingDeleteQuestion, setPendingDeleteQuestion] = useState<{
    questionId: string;
    weekId: string;
  } | null>(null);

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

  // Sets pending state — UI is responsible for rendering a confirm dialog
  const handleDeleteQuestion = (questionId: string, weekId: string) => {
    setPendingDeleteQuestion({ questionId, weekId });
  };

  const handleConfirmDeleteQuestion = async () => {
    if (!pendingDeleteQuestion) return;
    const { questionId, weekId } = pendingDeleteQuestion;
    setPendingDeleteQuestion(null);
    const ok = await deleteQuestion(questionId);
    if (!ok) {
      toast.error('Failed to delete question. Please try again.');
      return;
    }
    await refreshWeekData(weekId);
  };

  const handleCancelDeleteQuestion = () => setPendingDeleteQuestion(null);

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
      toast.error(
        result.error.code === 'auth'
          ? 'Your session has expired. Please sign in again.'
          : 'Failed to start progress tracker. Please try again.'
      );
      return;
    }
    setTrackersMap((prev) => ({ ...prev, [questionId]: result.data }));
    onNavigate(`/progress/${result.data.id}`);
  };

  return {
    weeks,
    quarters,
    filteredWeeks,
    weekDataMap,
    trackersMap,
    hasUnassigned,
    isLoading,
    loadingWeekIds,
    expandedWeekIds,
    activeQuarterId,
    setActiveQuarterId,
    toggleWeek,
    collapseAll,
    handleAddWeek,
    handleEditWeek,
    handleSaveWeek,
    handleDeleteWeek,
    handleCopyWeekToQuarter,
    handleSaveQuarter,
    handleDeleteQuarter,
    handleSaveQuestion,
    handleDeleteQuestion,
    handleConfirmDeleteQuestion,
    handleCancelDeleteQuestion,
    handleBulkImport,
    handleSaveAnswer,
    handleStartTracking,
    pendingDeleteQuestion,
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
