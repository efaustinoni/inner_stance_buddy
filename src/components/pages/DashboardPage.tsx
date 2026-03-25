// Created: 2026-02-13
// Last Updated: 2026-02-13 18:30

import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Target, MessageSquare, ChevronRight, Activity, BookOpen, X, Settings } from 'lucide-react';
import { Card } from '../ui/Card';
import {
  fetchDashboardData,
  type ExerciseWeek,
  type DashboardQuestion
} from '../../lib/exerciseService';

interface DashboardPageProps {
  onNavigate: (path: string) => void;
}

type FilterMode = 'all' | 'tracked' | 'untracked';

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const [weeks, setWeeks] = useState<ExerciseWeek[]>([]);
  const [questions, setQuestions] = useState<DashboardQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchDashboardData();
    setWeeks(data.weeks);
    setQuestions(data.questions);
    setLoading(false);
  };

  const filteredQuestions = useMemo(() => {
    let result = questions;

    if (selectedWeek) {
      result = result.filter(q => q.week_id === selectedWeek);
    }

    if (filterMode === 'tracked') {
      result = result.filter(q => q.tracker_id);
    } else if (filterMode === 'untracked') {
      result = result.filter(q => !q.tracker_id);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(q =>
        q.question_text.toLowerCase().includes(query) ||
        q.question_label.toLowerCase().includes(query) ||
        q.answer_text?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [questions, selectedWeek, filterMode, searchQuery]);

  const stats = useMemo(() => {
    const total = questions.length;
    const answered = questions.filter(q => q.answer_text).length;
    const tracked = questions.filter(q => q.tracker_id).length;
    return { total, answered, tracked };
  }, [questions]);

  const groupedByWeek = useMemo(() => {
    const groups: Map<number, DashboardQuestion[]> = new Map();
    filteredQuestions.forEach(q => {
      if (!groups.has(q.week_number)) {
        groups.set(q.week_number, []);
      }
      groups.get(q.week_number)!.push(q);
    });
    return Array.from(groups.entries()).sort((a, b) => a[0] - b[0]);
  }, [filteredQuestions]);

  const clearFilters = () => {
    setSelectedWeek(null);
    setFilterMode('all');
    setSearchQuery('');
  };

  const hasActiveFilters = selectedWeek || filterMode !== 'all' || searchQuery.trim();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" />
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
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions or answers..."
              className="w-full pl-10 pr-4 py-2.5 bg-navy-800 border border-navy-700 rounded-lg text-content-inverse placeholder:text-content-muted focus:outline-none focus:border-accent-blue transition-colors"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={selectedWeek || ''}
              onChange={(e) => setSelectedWeek(e.target.value || null)}
              className="px-3 py-2.5 bg-navy-800 border border-navy-700 rounded-lg text-content-inverse focus:outline-none focus:border-accent-blue transition-colors"
            >
              <option value="">All Weeks</option>
              {weeks.map(week => (
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
            {selectedWeek && (
              <span className="px-2 py-1 text-xs bg-navy-700 text-content-inverse rounded">
                Week {weeks.find(w => w.id === selectedWeek)?.week_number}
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
        <div className="space-y-6">
          {groupedByWeek.map(([weekNumber, weekQuestions]) => {
            const week = weeks.find(w => w.week_number === weekNumber);
            return (
              <div key={weekNumber}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-1 text-xs font-medium bg-accent-gold/20 text-accent-gold rounded">
                    Week {weekNumber}
                  </span>
                  <span className="text-sm text-content-muted">{week?.topic}</span>
                  <span className="text-xs text-content-muted ml-auto">
                    {weekQuestions.length} question{weekQuestions.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="space-y-2">
                  {weekQuestions.map(question => (
                    <QuestionCard
                      key={question.id}
                      question={question}
                      onNavigate={onNavigate}
                    />
                  ))}
                </div>
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
        <div className={`p-2 rounded-lg shrink-0 ${
          question.tracker_id
            ? 'bg-accent-gold/20'
            : 'bg-navy-700'
        }`}>
          <Target size={18} className={
            question.tracker_id
              ? 'text-accent-gold'
              : 'text-content-muted'
          } />
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
                Tracking since {new Date(question.tracker_started_at! + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          )}
        </div>

        <ChevronRight size={18} className="text-content-muted group-hover:text-content-inverse transition-colors shrink-0 mt-1" />
      </div>
    </button>
  );
}
