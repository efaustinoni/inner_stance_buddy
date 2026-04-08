// Created: 2026-02-13
// Last Updated: 2026-04-08 (ITEM-03: logic extracted to useDashboard hook)

import {
  Search,
  Filter,
  Target,
  MessageSquare,
  ChevronRight,
  Activity,
  BookOpen,
  X,
  Settings,
  ChevronDown,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { type DashboardQuestion } from '../../lib/exerciseService';
import { useDashboard } from '../../hooks/useDashboard';

interface DashboardPageProps {
  onNavigate: (path: string) => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const {
    weeks,
    quarters,
    filteredQuestions,
    stats,
    groupedByQuarterAndWeek,
    loading,
    loadError,
    selectedWeek,
    selectedQuarter,
    filterMode,
    searchQuery,
    hasActiveFilters,
    collapsedQuarters,
    collapsedWeeks,
    loadData,
    setSelectedWeek,
    setSelectedQuarter,
    setFilterMode,
    setSearchQuery,
    clearFilters,
    toggleQuarterCollapse,
    toggleWeekCollapse,
    handleChangeWeekQuarter,
  } = useDashboard();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
        <p className="text-status-error font-medium">Failed to load dashboard data.</p>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-accent-blue text-white rounded-lg hover:bg-accent-blue-hover transition-colors text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content-inverse">Dashboard</h1>
          <p className="text-content-muted mt-1">View and track your exercise questions</p>
        </div>
        <button
          onClick={() => onNavigate('/manage')}
          className="flex items-center gap-2 px-4 py-2 bg-accent-gold text-navy-900 rounded-lg font-medium hover:bg-accent-gold/90 transition-colors"
        >
          <Settings size={18} />
          Manage Weeks
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card variant="elevated" className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-blue/20 rounded-lg">
              <BookOpen size={20} className="text-accent-blue" />
            </div>
            <div>
              <p className="text-2xl font-bold text-content-inverse">{stats.total}</p>
              <p className="text-xs text-content-muted">Total Questions</p>
            </div>
          </div>
        </Card>
        <Card variant="elevated" className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-status-success/20 rounded-lg">
              <MessageSquare size={20} className="text-status-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-content-inverse">{stats.answered}</p>
              <p className="text-xs text-content-muted">Answered</p>
            </div>
          </div>
        </Card>
        <Card variant="elevated" className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-gold/20 rounded-lg">
              <Activity size={20} className="text-accent-gold" />
            </div>
            <div>
              <p className="text-2xl font-bold text-content-inverse">{stats.tracked}</p>
              <p className="text-xs text-content-muted">Tracking</p>
            </div>
          </div>
        </Card>
      </div>

      <Card variant="elevated" className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions or answers..."
              className="w-full pl-10 pr-4 py-2.5 bg-navy-800 border border-navy-700 rounded-lg text-content-inverse placeholder:text-content-muted focus:outline-none focus:border-accent-blue transition-colors"
            />
          </div>

          <div className="flex gap-2">
            {quarters.length > 0 && (
              <select
                value={selectedQuarter || ''}
                onChange={(e) => {
                  setSelectedQuarter(e.target.value || null);
                  setSelectedWeek(null);
                }}
                className="px-3 py-2.5 bg-navy-800 border border-navy-700 rounded-lg text-content-inverse focus:outline-none focus:border-accent-blue transition-colors"
              >
                <option value="">All Quarters</option>
                {quarters.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.label}
                  </option>
                ))}
                <option value="__unassigned__">Unassigned</option>
              </select>
            )}
            <select
              value={selectedWeek || ''}
              onChange={(e) => setSelectedWeek(e.target.value || null)}
              className="px-3 py-2.5 bg-navy-800 border border-navy-700 rounded-lg text-content-inverse focus:outline-none focus:border-accent-blue transition-colors"
            >
              <option value="">All Weeks</option>
              {weeks
                .filter(
                  (w) =>
                    !selectedQuarter ||
                    (selectedQuarter === '__unassigned__'
                      ? !w.quarter_id
                      : w.quarter_id === selectedQuarter)
                )
                .map((week) => (
                  <option key={week.id} value={week.id}>
                    Week {week.week_number} - {week.topic}
                  </option>
                ))}
            </select>

            <div className="flex bg-navy-800 border border-navy-700 rounded-lg overflow-hidden">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-2.5 text-sm font-medium transition-colors ${
                  filterMode === 'all'
                    ? 'bg-accent-blue text-white'
                    : 'text-content-muted hover:text-content-inverse'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterMode('tracked')}
                className={`px-3 py-2.5 text-sm font-medium transition-colors border-l border-navy-700 ${
                  filterMode === 'tracked'
                    ? 'bg-accent-gold text-navy-900'
                    : 'text-content-muted hover:text-content-inverse'
                }`}
              >
                Tracked
              </button>
              <button
                onClick={() => setFilterMode('untracked')}
                className={`px-3 py-2.5 text-sm font-medium transition-colors border-l border-navy-700 ${
                  filterMode === 'untracked'
                    ? 'bg-navy-600 text-content-inverse'
                    : 'text-content-muted hover:text-content-inverse'
                }`}
              >
                Untracked
              </button>
            </div>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-navy-700">
            <span className="text-xs text-content-muted">Active filters:</span>
            {selectedQuarter && (
              <span className="px-2 py-1 text-xs bg-accent-gold/20 text-accent-gold rounded">
                {selectedQuarter === '__unassigned__'
                  ? 'Unassigned'
                  : quarters.find((q) => q.id === selectedQuarter)?.label}
              </span>
            )}
            {selectedWeek && (
              <span className="px-2 py-1 text-xs bg-navy-700 text-content-inverse rounded">
                Week {weeks.find((w) => w.id === selectedWeek)?.week_number}
              </span>
            )}
            {filterMode !== 'all' && (
              <span className="px-2 py-1 text-xs bg-navy-700 text-content-inverse rounded capitalize">
                {filterMode}
              </span>
            )}
            {searchQuery.trim() && (
              <span className="px-2 py-1 text-xs bg-navy-700 text-content-inverse rounded">
                "{searchQuery}"
              </span>
            )}
            <button
              onClick={clearFilters}
              className="ml-auto flex items-center gap-1 text-xs text-content-muted hover:text-content-inverse transition-colors"
            >
              <X size={14} />
              Clear all
            </button>
          </div>
        )}
      </Card>

      {filteredQuestions.length === 0 ? (
        <Card variant="elevated" className="p-8 text-center">
          <Filter size={40} className="mx-auto text-content-muted mb-3" />
          <p className="text-content-inverse font-medium">No questions found</p>
          <p className="text-sm text-content-muted mt-1">
            {hasActiveFilters
              ? 'Try adjusting your filters'
              : 'Add some exercise weeks and questions to get started'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 text-sm text-accent-blue hover:underline"
            >
              Clear filters
            </button>
          )}
        </Card>
      ) : (
        <div className="space-y-8">
          {groupedByQuarterAndWeek.map(([quarterKey, { label: quarterLabel, weeks: weekMap }]) => {
            const isCollapsed = collapsedQuarters.has(quarterKey);
            const weekEntries = Array.from(weekMap.entries()).sort(
              (a, b) => a[1].weekNumber - b[1].weekNumber
            );
            const totalQuestions = weekEntries.reduce((sum, [, w]) => sum + w.questions.length, 0);

            return (
              <div key={quarterKey}>
                {/* Quarter header */}
                <button
                  onClick={() => toggleQuarterCollapse(quarterKey)}
                  className="flex items-center gap-3 w-full mb-4 group"
                >
                  <span
                    className={`px-3 py-1 text-sm font-semibold rounded-lg ${
                      quarterKey === '__unassigned__'
                        ? 'bg-navy-700 text-content-muted'
                        : 'bg-accent-gold/20 text-accent-gold'
                    }`}
                  >
                    {quarterLabel}
                  </span>
                  <span className="text-xs text-content-muted">
                    {weekEntries.length} week{weekEntries.length !== 1 ? 's' : ''} ·{' '}
                    {totalQuestions} question{totalQuestions !== 1 ? 's' : ''}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`ml-auto text-content-muted transition-transform group-hover:text-content-inverse ${
                      isCollapsed ? '-rotate-90' : ''
                    }`}
                  />
                </button>

                {!isCollapsed && (
                  <div className="space-y-6">
                    {weekEntries.map(([weekId, { weekNumber, topic, questions: wqs }]) => {
                      const isWeekCollapsed = collapsedWeeks.has(weekId);
                      return (
                        <div key={weekId}>
                          <div className="flex items-center gap-2 mb-3">
                            {/* Collapse/expand toggle */}
                            <button
                              onClick={() => toggleWeekCollapse(weekId)}
                              className="flex items-center gap-2 min-w-0 flex-1 group text-left"
                            >
                              <span className="px-2 py-1 text-xs font-medium bg-navy-700 text-content-inverse rounded shrink-0">
                                Week {weekNumber}
                              </span>
                              <span className="text-sm text-content-muted truncate">{topic}</span>
                              <ChevronDown
                                size={14}
                                className={`shrink-0 text-content-muted transition-transform group-hover:text-content-inverse ${
                                  isWeekCollapsed ? '-rotate-90' : ''
                                }`}
                              />
                            </button>
                            {/* Quarter selector — shown for all weeks when quarters exist */}
                            {quarters.length > 0 && (
                              <select
                                value={quarterKey === '__unassigned__' ? '' : quarterKey}
                                onChange={(e) => handleChangeWeekQuarter(weekId, e.target.value)}
                                className="px-2 py-1 text-xs bg-navy-700 border border-navy-600 rounded text-content-muted hover:border-accent-blue focus:outline-none focus:border-accent-blue transition-colors cursor-pointer shrink-0"
                              >
                                <option value="">— No quarter —</option>
                                {quarters.map((q) => (
                                  <option key={q.id} value={q.id}>
                                    {q.label}
                                  </option>
                                ))}
                              </select>
                            )}
                            <span className="text-xs text-content-muted shrink-0">
                              {wqs.length} question{wqs.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          {!isWeekCollapsed && (
                            <div className="space-y-2">
                              {wqs.map((question) => (
                                <QuestionCard
                                  key={question.id}
                                  question={question}
                                  onNavigate={onNavigate}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface QuestionCardProps {
  question: DashboardQuestion;
  onNavigate: (path: string) => void;
}

function QuestionCard({ question, onNavigate }: QuestionCardProps) {
  const handleClick = () => {
    if (question.tracker_id) {
      onNavigate(`/progress/${question.tracker_id}`);
    } else {
      onNavigate(`/week/${question.week_id}?question=${question.id}`);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="w-full text-left bg-navy-800/50 hover:bg-navy-800 border border-navy-700 rounded-lg p-4 transition-all group"
    >
      <div className="flex items-start gap-3">
        <div
          className={`p-2 rounded-lg shrink-0 ${
            question.tracker_id ? 'bg-accent-gold/20' : 'bg-navy-700'
          }`}
        >
          <Target
            size={18}
            className={question.tracker_id ? 'text-accent-gold' : 'text-content-muted'}
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs text-content-muted mb-1">{question.question_label}</p>
          <p className="text-sm text-content-inverse font-medium line-clamp-2">
            {question.question_text}
          </p>

          {question.answer_text && (
            <p className="text-xs text-content-muted mt-2 line-clamp-1">
              <span className="text-status-success">Your answer:</span> {question.answer_text}
            </p>
          )}

          {question.tracker_id && (
            <div className="flex items-center gap-2 mt-2">
              <Activity size={12} className="text-accent-gold" />
              <span className="text-xs text-accent-gold">
                Tracking since{' '}
                {new Date(question.tracker_started_at! + 'T00:00:00').toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          )}
        </div>

        <ChevronRight
          size={18}
          className="text-content-muted group-hover:text-content-inverse transition-colors shrink-0 mt-1"
        />
      </div>
    </button>
  );
}
