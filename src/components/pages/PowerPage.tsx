// Created: 2026-02-13
// Last Updated: 2026-02-14 01:15

import { useState, useEffect } from 'react';
import { Plus, FileText, Loader2, ArrowLeft, Home, ChevronRight, Layers } from 'lucide-react';
import {
  WeekSelector,
  ExerciseQuestionCard,
  WeekModal,
  QuestionModal,
  BulkImportModal,
  QuarterModal,
  type BulkImportData
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
  type ProgressTracker
} from '../../lib/exerciseService';

interface PowerPageProps {
  weekId?: string;
  onNavigate: (path: string) => void;
}

export function PowerPage({ weekId, onNavigate }: PowerPageProps) {
  const [weeks, setWeeks] = useState<ExerciseWeek[]>([]);
  const [quarters, setQuarters] = useState<ExerciseQuarter[]>([]);
  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(weekId || null);
  const [selectedWeekData, setSelectedWeekData] = useState<WeekWithQuestions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingWeek, setIsLoadingWeek] = useState(false);
  const [trackersMap, setTrackersMap] = useState<Record<string, ProgressTracker | null>>({});

  const [weekModalOpen, setWeekModalOpen] = useState(false);
  const [editingWeek, setEditingWeek] = useState<ExerciseWeek | null>(null);
  const [quarterModalOpen, setQuarterModalOpen] = useState(false);
  const [editingQuarter, setEditingQuarter] = useState<ExerciseQuarter | null>(null);

  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);

  useEffect(() => {
    loadWeeks();
  }, []);

  useEffect(() => {
    if (selectedWeekId) {
      loadWeekData(selectedWeekId);
    }
  }, [selectedWeekId]);

  async function loadWeeks() {
    setIsLoading(true);
    const [data, quartersData] = await Promise.all([fetchUserWeeks(), fetchUserQuarters()]);
    setWeeks(data);
    setQuarters(quartersData);
    if (data.length > 0 && !selectedWeekId) {
      const targetWeek = weekId ? data.find(w => w.id === weekId) : data[0];
      setSelectedWeekId(targetWeek?.id || data[0]?.id || null);
    }
    setIsLoading(false);
  }

  async function loadWeekData(weekId: string) {
    setIsLoadingWeek(true);
    const data = await fetchWeekWithQuestions(weekId);
    setSelectedWeekData(data);
    if (data?.questions) {
      const trackers: Record<string, ProgressTracker | null> = {};
      await Promise.all(
        data.questions.map(async (q) => {
          trackers[q.id] = await getTrackerForQuestion(q.id);
        })
      );
      setTrackersMap(trackers);
    }
    setIsLoadingWeek(false);
  }

  const handleAddWeek = () => {
    setEditingWeek(null);
    setWeekModalOpen(true);
  };

  const handleEditWeek = (weekId: string) => {
    const week = weeks.find(w => w.id === weekId);
    if (week) {
      setEditingWeek(week);
      setWeekModalOpen(true);
    }
  };

  const handleSaveWeek = async (weekNumber: number, topic: string, quarterId: string | null, questions?: { label: string; text: string; answer?: string }[]) => {
    if (editingWeek) {
      await updateWeek(editingWeek.id, { week_number: weekNumber, topic, quarter_id: quarterId });
    } else {
      const newWeek = await createWeek(weekNumber, topic, quarterId);
      if (newWeek) {
        setSelectedWeekId(newWeek.id);
        if (questions && questions.length > 0) {
          await bulkImportQuestions(newWeek.id, questions);
          await loadWeekData(newWeek.id);
        }
      }
    }
    await loadWeeks();
  };

  const handleCopyWeekToQuarter = async (targetQuarterId: string | null, includeAnswers: boolean) => {
    if (!editingWeek) return;
    await copyWeekToQuarter(editingWeek.id, targetQuarterId, includeAnswers);
    await loadWeeks();
  };

  const handleSaveQuarter = async (label: string) => {
    if (editingQuarter) {
      await updateQuarter(editingQuarter.id, label);
    } else {
      await createQuarter(label);
    }
    await loadWeeks();
  };

  const handleDeleteQuarter = async () => {
    if (!editingQuarter) return;
    await deleteQuarter(editingQuarter.id);
    setEditingQuarter(null);
    await loadWeeks();
  };

  const handleDeleteWeek = async () => {
    if (!editingWeek) return;
    await deleteWeek(editingWeek.id);
    setEditingWeek(null);
    if (selectedWeekId === editingWeek.id) {
      setSelectedWeekId(weeks.find(w => w.id !== editingWeek.id)?.id || null);
      setSelectedWeekData(null);
    }
    await loadWeeks();
  };

  const handleAddQuestion = () => {
    setQuestionModalOpen(true);
  };

  const handleSaveQuestion = async (label: string, text: string) => {
    if (!selectedWeekId) return;
    const sortOrder = selectedWeekData?.questions.length || 0;
    await addQuestion(selectedWeekId, label, text, sortOrder);
    await loadWeekData(selectedWeekId);
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Remove this question?')) return;
    await deleteQuestion(questionId);
    if (selectedWeekId) {
      await loadWeekData(selectedWeekId);
    }
  };

  const handleBulkImport = async (data: BulkImportData) => {
    let targetWeekId = selectedWeekId;

    if (data.weekNumber) {
      const existingWeek = weeks.find(w => w.week_number === data.weekNumber);
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
    setSelectedWeekId(targetWeekId);
    await loadWeekData(targetWeekId);
  };

  const handleSaveAnswer = async (questionId: string, answerText: string): Promise<boolean> => {
    return await saveAnswer(questionId, answerText);
  };

  const handleStartTracking = async (questionId: string) => {
    const tracker = await createProgressTracker(questionId);
    if (tracker) {
      setTrackersMap(prev => ({ ...prev, [questionId]: tracker }));
      onNavigate(`/progress/${tracker.id}`);
    }
  };

  const handleViewProgress = (trackerId: string) => {
    onNavigate(`/progress/${trackerId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="text-accent-blue animate-spin" />
      </div>
    );
  }

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      onNavigate('/');
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
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

      <div className="flex items-center gap-4 mb-2">
        <button
          onClick={handleGoBack}
          className="p-2 text-content-muted hover:text-content-inverse hover:bg-navy-800 rounded-lg transition-colors"
          title="Go back"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-content-inverse">Manage Exercise Weeks</h1>
          <p className="text-sm text-content-muted">Add, edit, and organize your weekly exercises</p>
        </div>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <WeekSelector
          weeks={weeks}
          quarters={quarters}
          selectedWeekId={selectedWeekId}
          onSelectWeek={setSelectedWeekId}
          onAddWeek={handleAddWeek}
          onEditWeek={handleEditWeek}
        />
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setEditingQuarter(null); setQuarterModalOpen(true); }}
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

      {selectedWeekId && selectedWeekData && (
        <>
          {isLoadingWeek ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="text-accent-blue animate-spin" />
            </div>
          ) : selectedWeekData.questions.length === 0 ? (
            <div className="bg-navy-800 rounded-xl p-8 text-center">
              <FileText size={48} className="text-content-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-content-inverse mb-2">
                No questions yet
              </h3>
              <p className="text-content-muted mb-6 max-w-md mx-auto">
                Add questions manually or use bulk import to paste them from the official platform.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handleAddQuestion}
                  className="flex items-center gap-2 px-4 py-2 bg-navy-700 text-content-inverse rounded-lg font-medium hover:bg-navy-600 transition-colors"
                >
                  <Plus size={18} />
                  Add Question
                </button>
                <button
                  onClick={() => setBulkImportOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-accent-gold text-navy-900 rounded-lg font-medium hover:bg-accent-gold/90 transition-colors"
                >
                  <FileText size={18} />
                  Bulk Import
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedWeekData.questions.map((question) => (
                <div key={question.id} className="bg-navy-800 rounded-xl p-5 sm:p-6">
                  <ExerciseQuestionCard
                    question={question}
                    tracker={trackersMap[question.id]}
                    onSaveAnswer={handleSaveAnswer}
                    onDeleteQuestion={handleDeleteQuestion}
                    onStartTracking={handleStartTracking}
                    onViewProgress={handleViewProgress}
                  />
                </div>
              ))}

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleAddQuestion}
                  className="flex items-center gap-2 px-4 py-2.5 bg-navy-800 text-content-inverse rounded-xl font-medium hover:bg-navy-700 transition-colors border-2 border-dashed border-navy-600 hover:border-accent-blue"
                >
                  <Plus size={18} />
                  Add Question
                </button>
                <button
                  onClick={() => setBulkImportOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 text-content-muted hover:text-accent-gold rounded-xl font-medium transition-colors"
                >
                  <FileText size={18} />
                  Bulk Import
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <WeekModal
        isOpen={weekModalOpen}
        onClose={() => {
          setWeekModalOpen(false);
          setEditingWeek(null);
        }}
        onSave={handleSaveWeek}
        onDelete={editingWeek ? handleDeleteWeek : undefined}
        onCopyToQuarter={editingWeek ? handleCopyWeekToQuarter : undefined}
        initialData={editingWeek ? {
          week_number: editingWeek.week_number,
          topic: editingWeek.topic,
          quarter_id: editingWeek.quarter_id
        } : undefined}
        existingWeekNumbers={weeks.map(w => w.week_number)}
        weekNumbersInQuarter={weeks
          .filter(w => w.quarter_id === (editingWeek?.quarter_id ?? null))
          .map(w => w.week_number)
          .filter(n => !editingWeek || n !== editingWeek.week_number)}
        quarters={quarters}
      />

      <QuarterModal
        isOpen={quarterModalOpen}
        onClose={() => {
          setQuarterModalOpen(false);
          setEditingQuarter(null);
        }}
        onSave={handleSaveQuarter}
        onDelete={editingQuarter ? handleDeleteQuarter : undefined}
        initialData={editingQuarter || undefined}
        existingLabels={quarters.map(q => q.label)}
      />

      <QuestionModal
        isOpen={questionModalOpen}
        onClose={() => setQuestionModalOpen(false)}
        onSave={handleSaveQuestion}
      />

      <BulkImportModal
        isOpen={bulkImportOpen}
        onClose={() => setBulkImportOpen(false)}
        onImport={handleBulkImport}
      />
    </div>
  );
}
