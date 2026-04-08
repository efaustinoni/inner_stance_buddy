// Created: 2026-02-13
// Last Updated: 2026-04-08 (ITEM-04: logic extracted to usePowerPage hook)

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
} from '../exercises';
import { usePowerPage } from '../../hooks/usePowerPage';

interface PowerPageProps {
  weekId?: string;
  onNavigate: (path: string) => void;
}

export function PowerPage({ onNavigate }: PowerPageProps) {
  const {
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
    handleBulkImport,
    handleSaveAnswer,
    handleStartTracking,
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
  } = usePowerPage(onNavigate);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="text-accent-blue animate-spin" />
      </div>
    );
  }

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
