// Created: 2026-02-13
// Last Updated: 2026-04-03 07:43 UTC (collapsible week list with quarter filter)

import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  FileText,
  Loader2,
  ArrowLeft,
  Home,
  ChevronRight,
  Layers,
  ChevronDown,
  Settings,
} from 'lucide-react';
import {
  WeekSelector,
  ExerciseQuestionCard,
  WeekModal,
  QuestionModal,
  BulkImportModal,
  QuarterModal,
  type BulkImportData,
} from '../exercises';
import {
  fetchUserWeeks,
  fetchUserQuarters,
  fetchWeekWithQuestions,
  createWeek,
  updateWeek,
  deleteWeek,
  addQuestion,
  deleteQuestion,
  saveAnswer,
  bulkImportQuestions,
  createProgressTracker,
  getTrackerForQuestion,
  createQuarter,
  updateQuarter,
  deleteQuarter,
  copyWeekToQuarter,
  type ExerciseWeek,
  type ExerciseQuarter,
  type WeekWithQuestions,
  type ProgressTracker,
} from '../../lib/exerciseService';

interface PowerPageProps {
  weekId?: string;
  onNavigate: (path: string) => void;
}

export function PowerPage({ onNavigate }: PowerPageProps) {
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
    const [data, quartersData] = await Promise.all([fetchUserWeeks(), fetchUserQuarters()]);
    setWeeks(data);
    setQuarters(quartersData);
    setIsLoading(false);
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
      await updateWeek(editingWeek.id, { week_number: weekNumber, topic, quarter_id: quarterId });
      setWeekDataMap((prev) => {
        const m = new Map(prev);
        m.delete(editingWeek.id);
        return m;
      });
    } else {
      const newWeek = await createWeek(weekNumber, topic, quarterId);
      if (newWeek) {
        if (questions && questions.length > 0) {
          await bulkImportQuestions(newWeek.id, questions);
        }
        setExpandedWeekIds((prev) => new Set([...prev, newWeek.id]));
        await loadWeekData(newWeek.id);
      }
    }
    await loadWeeks();
  };

  const handleCopyWeekToQuarter = async (
    targetQuarterId: string | null,
    includeAnswers: boolean
  ) => {
    if (!editingWeek) return;
    await copyWeekToQuarter(editingWeek.id, targetQuarterId, includeAnswers);
    await loadWeeks();
  };

  const handleSaveQuarter = async (label: string, quarterId?: string) => {
    if (quarterId) {
      await updateQuarter(quarterId, label);
    } else {
      await createQuarter(label);
    }
    await loadWeeks();
  };

  const handleDeleteQuarter = async (quarterId: string) => {
    await deleteQuarter(quarterId);
    await loadWeeks();
  };

  const handleDeleteWeek = async () => {
    if (!editingWeek) return;
    await deleteWeek(editingWeek.id);
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
    await addQuestion(questionTargetWeekId, label, text, sortOrder);
    await refreshWeekData(questionTargetWeekId);
  };

  const handleDeleteQuestion = async (questionId: string, wId: string) => {
    if (!confirm('Remove this question?')) return;
    await deleteQuestion(questionId);
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
        if (newWeek) {
          targetWeekId = newWeek.id;
          await loadWeeks();
        }
      }
    }

    if (!targetWeekId) return;
    await bulkImportQuestions(targetWeekId, data.questions);
    setExpandedWeekIds((prev) => new Set([...prev, targetWeekId!]));
    await refreshWeekData(targetWeekId);
  };

  const handleSaveAnswer = async (questionId: string, answerText: string): Promise<boolean> =>
    await saveAnswer(questionId, answerText);

  const handleStartTracking = async (questionId: string) => {
    const tracker = await createProgressTracker(questionId);
    if (tracker) {
      setTrackersMap((prev) => ({ ...prev, [questionId]: tracker }));
      onNavigate(`/progress/${tracker.id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="text-accent-blue animate-spin" />
      </div>
    );
  }

  const hasUnassigned = weeks.some((w) => !w.quarter_id);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm">
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-1 text-content-muted hover:text-accent-blue transition-colors"
        >
          <Home size={14} />
          <span>Dashboard</span>
        </button>
        <ChevronRight size={14} className="text-content-muted/50" />
        <span className="text-accent-blue">Manage Weeks</span>
      </nav>

      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => (window.history.length > 1 ? window.history.back() : onNavigate('/'))}
          className="p-2 text-content-muted hover:text-content-inverse hover:bg-navy-800 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold text-content-inverse">Manage Exercise Weeks</h1>
          <p className="text-sm text-content-muted">Add, edit and organise your weekly exercises</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {expandedWeekIds.size > 0 && (
            <button
              onClick={collapseAll}
              className="px-3 py-2 text-xs text-content-muted hover:text-content-inverse bg-navy-800 hover:bg-navy-700 rounded-lg transition-colors"
            >
              Collapse All
            </button>
          )}
          <button
            onClick={() => setQuarterModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-navy-700 text-content-inverse rounded-lg font-medium hover:bg-navy-600 transition-colors"
          >
            <Layers size={18} />
            Manage Quarters
          </button>
          <button
            onClick={handleAddWeek}
            className="flex items-center gap-2 px-4 py-2.5 bg-accent-gold text-navy-900 rounded-lg font-medium hover:bg-accent-gold/90 transition-colors"
          >
            <Plus size={18} />
            Add New Week
          </button>
        </div>
      </div>

      {/* Quarter filter badges */}
      <WeekSelector
        quarters={quarters}
        hasUnassigned={hasUnassigned}
        activeQuarterId={activeQuarterId}
        onQuarterChange={setActiveQuarterId}
      />

      {/* Week list */}
      {weeks.length === 0 ? (
        <div className="bg-navy-800 rounded-xl p-8 text-center">
          <h2 className="text-xl font-semibold text-content-inverse mb-2">
            Welcome to Your Exercise Journal
          </h2>
          <p className="text-content-muted mb-6">Start by adding your first week of exercises.</p>
          <button
            onClick={handleAddWeek}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-blue text-white rounded-lg font-medium hover:bg-accent-blue/90 transition-colors"
          >
            <Plus size={18} />
            Add Your First Week
          </button>
        </div>
      ) : filteredWeeks.length === 0 ? (
        <div className="bg-navy-800 rounded-xl p-8 text-center">
          <p className="text-content-muted mb-4">No weeks in this quarter yet.</p>
          <button
            onClick={handleAddWeek}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent-gold text-navy-900 rounded-lg font-medium hover:bg-accent-gold/90 transition-colors text-sm"
          >
            <Plus size={16} />
            Add Week
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredWeeks.map((week) => {
            const isExpanded = expandedWeekIds.has(week.id);
            const weekData = weekDataMap.get(week.id);
            const isLoadingWeek = loadingWeekIds.has(week.id);

            return (
              <div key={week.id} className="bg-navy-800 rounded-xl overflow-hidden">
                {/* Week header */}
                <div className="flex items-center gap-2 px-4 py-3">
                  <button
                    onClick={() => toggleWeek(week.id)}
                    className="flex items-center gap-3 flex-1 text-left min-w-0 group"
                  >
                    <ChevronDown
                      size={16}
                      className={`shrink-0 text-content-muted transition-transform group-hover:text-content-inverse ${isExpanded ? '' : '-rotate-90'}`}
                    />
                    <span className="px-2 py-0.5 text-xs font-medium bg-navy-700 text-content-inverse rounded shrink-0">
                      Week {week.week_number}
                    </span>
                    <span className="text-sm font-medium text-content-inverse truncate">
                      {week.topic}
                    </span>
                    {week.quarter_label && (
                      <span className="text-xs text-accent-gold/70 shrink-0 hidden sm:inline">
                        {week.quarter_label}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => handleEditWeek(week.id)}
                    className="p-1.5 text-content-muted hover:text-content-inverse hover:bg-navy-700 rounded-lg transition-colors shrink-0"
                    title="Edit week"
                  >
                    <Settings size={15} />
                  </button>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-navy-700">
                    {isLoadingWeek ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 size={22} className="text-accent-blue animate-spin" />
                      </div>
                    ) : !weekData || weekData.questions.length === 0 ? (
                      <div className="p-6 text-center">
                        <p className="text-content-muted text-sm mb-4">No questions yet.</p>
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => {
                              setQuestionTargetWeekId(week.id);
                              setQuestionModalOpen(true);
                            }}
                            className="flex items-center gap-2 px-3 py-2 bg-navy-700 text-content-inverse rounded-lg text-sm font-medium hover:bg-navy-600 transition-colors"
                          >
                            <Plus size={16} />
                            Add Question
                          </button>
                          <button
                            onClick={() => {
                              setBulkImportTargetWeekId(week.id);
                              setBulkImportOpen(true);
                            }}
                            className="flex items-center gap-2 px-3 py-2 bg-accent-gold text-navy-900 rounded-lg text-sm font-medium hover:bg-accent-gold/90 transition-colors"
                          >
                            <FileText size={16} />
                            Bulk Import
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 space-y-3">
                        {weekData.questions.map((question) => (
                          <div key={question.id} className="bg-navy-900 rounded-lg p-4">
                            <ExerciseQuestionCard
                              question={question}
                              tracker={trackersMap[question.id]}
                              onSaveAnswer={handleSaveAnswer}
                              onDeleteQuestion={(qId) => handleDeleteQuestion(qId, week.id)}
                              onStartTracking={handleStartTracking}
                              onViewProgress={(trackerId) => onNavigate(`/progress/${trackerId}`)}
                            />
                          </div>
                        ))}
                        <div className="flex items-center gap-3 pt-1">
                          <button
                            onClick={() => {
                              setQuestionTargetWeekId(week.id);
                              setQuestionModalOpen(true);
                            }}
                            className="flex items-center gap-2 px-3 py-2 bg-navy-700 text-content-inverse rounded-lg text-sm font-medium hover:bg-navy-600 transition-colors border border-dashed border-navy-600 hover:border-accent-blue"
                          >
                            <Plus size={15} />
                            Add Question
                          </button>
                          <button
                            onClick={() => {
                              setBulkImportTargetWeekId(week.id);
                              setBulkImportOpen(true);
                            }}
                            className="flex items-center gap-2 px-3 py-2 text-content-muted hover:text-accent-gold rounded-lg text-sm font-medium transition-colors"
                          >
                            <FileText size={15} />
                            Bulk Import
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <WeekModal
        isOpen={weekModalOpen}
        onClose={() => {
          setWeekModalOpen(false);
          setEditingWeek(null);
        }}
        onSave={handleSaveWeek}
        onDelete={editingWeek ? handleDeleteWeek : undefined}
        onCopyToQuarter={editingWeek ? handleCopyWeekToQuarter : undefined}
        initialData={
          editingWeek
            ? {
                week_number: editingWeek.week_number,
                topic: editingWeek.topic,
                quarter_id: editingWeek.quarter_id,
              }
            : undefined
        }
        existingWeekNumbers={weeks.map((w) => w.week_number)}
        weekNumbersInQuarter={weeks
          .filter((w) => w.quarter_id === (editingWeek?.quarter_id ?? null))
          .map((w) => w.week_number)
          .filter((n) => !editingWeek || n !== editingWeek.week_number)}
        quarters={quarters}
      />

      <QuarterModal
        isOpen={quarterModalOpen}
        onClose={() => setQuarterModalOpen(false)}
        onSave={handleSaveQuarter}
        onDelete={handleDeleteQuarter}
        quarters={quarters}
      />

      <QuestionModal
        isOpen={questionModalOpen}
        onClose={() => {
          setQuestionModalOpen(false);
          setQuestionTargetWeekId(null);
        }}
        onSave={handleSaveQuestion}
      />

      <BulkImportModal
        isOpen={bulkImportOpen}
        onClose={() => {
          setBulkImportOpen(false);
          setBulkImportTargetWeekId(null);
        }}
        onImport={handleBulkImport}
      />
    </div>
  );
}
