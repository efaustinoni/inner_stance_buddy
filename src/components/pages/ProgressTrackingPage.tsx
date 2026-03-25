// Created: 2026-02-13
// Last Updated: 2026-02-14 01:10

import { useState, useEffect, useMemo, useCallback } from 'react';
import { ArrowLeft, Trash2, Check, Calendar, MessageSquare, ChevronDown, ChevronUp, FileText, Save, Home, ChevronRight } from 'lucide-react';
import { Card } from '../ui/Card';
import {
  fetchTrackerWithCheckIns,
  toggleCheckIn,
  updateCheckInNotes,
  deleteProgressTracker,
  type TrackerWithCheckIns,
  type ProgressCheckIn
} from '../../lib/exerciseService';

interface ProgressTrackingPageProps {
  trackerId: string;
  onNavigate: (path: string) => void;
}

function Breadcrumb({
  weekNumber,
  weekTopic,
  onNavigate
}: {
  weekNumber?: number;
  weekTopic?: string;
  onNavigate: (path: string) => void;
}) {
  return (
    <nav className="flex items-center gap-2 text-sm mb-4">
      <button
        onClick={() => onNavigate('/')}
        className="flex items-center gap-1 text-content-muted hover:text-accent-blue transition-colors"
      >
        <Home size={14} />
        <span>Dashboard</span>
      </button>
      {weekNumber && (
        <>
          <ChevronRight size={14} className="text-content-muted/50" />
          <span className="text-content-muted">Week {weekNumber}</span>
          {weekTopic && (
            <span className="text-content-muted/50 hidden sm:inline">- {weekTopic}</span>
          )}
        </>
      )}
      <ChevronRight size={14} className="text-content-muted/50" />
      <span className="text-accent-blue">Progress Tracking</span>
    </nav>
  );
}

export function ProgressTrackingPage({ trackerId, onNavigate }: ProgressTrackingPageProps) {
  const [tracker, setTracker] = useState<TrackerWithCheckIns | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkInsMap, setCheckInsMap] = useState<Record<string, boolean>>({});
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [savingDate, setSavingDate] = useState<string | null>(null);
  const [savingNotes, setSavingNotes] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadTracker();
  }, [trackerId]);

  const loadTracker = async () => {
    setLoading(true);
    const data = await fetchTrackerWithCheckIns(trackerId);
    setTracker(data);
    if (data) {
      const doneMap: Record<string, boolean> = {};
      const notes: Record<string, string> = {};
      data.check_ins.forEach((ci: ProgressCheckIn) => {
        doneMap[ci.check_in_date] = ci.is_done;
        notes[ci.check_in_date] = ci.notes || '';
      });
      setCheckInsMap(doneMap);
      setNotesMap(notes);
      setEditingNotes(notes);
    }
    setLoading(false);
  };

  const toggleExpanded = useCallback((dateStr: string) => {
    setExpandedDates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dateStr)) {
        newSet.delete(dateStr);
      } else {
        newSet.add(dateStr);
      }
      return newSet;
    });
  }, []);

  const dates = useMemo(() => {
    if (!tracker) return [];
    const [year, month, day] = tracker.started_at.split('-').map(Number);
    const startDate = new Date(year, month - 1, day);
    startDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result: Date[] = [];
    const current = new Date(startDate);
    while (current <= today) {
      result.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return result;
  }, [tracker]);

  const completedCount = useMemo(() => {
    return Object.values(checkInsMap).filter(Boolean).length;
  }, [checkInsMap]);

  const completionRate = useMemo(() => {
    if (dates.length === 0) return 0;
    return Math.round((completedCount / dates.length) * 100);
  }, [completedCount, dates.length]);

  const handleToggle = async (date: Date, e: React.MouseEvent) => {
    e.stopPropagation();
    const dateStr = formatDateStr(date);
    const newValue = !checkInsMap[dateStr];
    setSavingDate(dateStr);
    setCheckInsMap(prev => ({ ...prev, [dateStr]: newValue }));
    const success = await toggleCheckIn(trackerId, dateStr, newValue);
    if (!success) {
      setCheckInsMap(prev => ({ ...prev, [dateStr]: !newValue }));
    }
    setSavingDate(null);
  };

  const handleSaveNotes = async (dateStr: string) => {
    const notes = editingNotes[dateStr] || '';
    if (notes === notesMap[dateStr]) return;

    setSavingNotes(dateStr);
    const success = await updateCheckInNotes(trackerId, dateStr, notes);
    if (success) {
      setNotesMap(prev => ({ ...prev, [dateStr]: notes }));
    } else {
      setEditingNotes(prev => ({ ...prev, [dateStr]: notesMap[dateStr] || '' }));
    }
    setSavingNotes(null);
  };

  const hasNotesChanged = (dateStr: string) => {
    return (editingNotes[dateStr] || '') !== (notesMap[dateStr] || '');
  };

  const handleDelete = async () => {
    setDeleting(true);
    const success = await deleteProgressTracker(trackerId);
    if (success) {
      onNavigate('/');
    }
    setDeleting(false);
    setShowDeleteConfirm(false);
  };

  const formatDateStr = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateLong = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateDisplay = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!tracker) {
    return (
      <div className="text-center py-12">
        <p className="text-content-muted">Tracker not found</p>
        <button
          onClick={() => onNavigate('/')}
          className="mt-4 text-accent-blue hover:underline"
        >
          Go back
        </button>
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
    <div className="space-y-6">
      <Breadcrumb
        weekNumber={tracker.week.week_number}
        weekTopic={tracker.week.topic}
        onNavigate={onNavigate}
      />

      <div className="flex items-start gap-4">
        <button
          onClick={handleGoBack}
          className="p-2 text-content-muted hover:text-content-inverse hover:bg-navy-800 rounded-lg transition-colors mt-1"
          title="Go back"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-content-muted mb-1">{tracker.question.question_label}</p>
          <h1 className="text-lg sm:text-xl font-semibold text-content-inverse leading-snug">
            {tracker.question.question_text}
          </h1>
        </div>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="p-2 text-content-muted hover:text-status-error hover:bg-status-error/10 rounded-lg transition-colors"
          title="Delete tracker"
        >
          <Trash2 size={20} />
        </button>
      </div>

      {tracker.answer?.answer_text && (
        <Card variant="elevated" className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg shrink-0">
              <MessageSquare size={18} className="text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-amber-400/80 mb-1 font-medium">Your commitment</p>
              <p className="text-sm text-content-inverse/90 whitespace-pre-wrap break-words">
                {tracker.answer.answer_text}
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card variant="elevated" className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-content-inverse">Daily Check-ins</h2>
            <div className="flex items-center gap-2 mt-1">
              <Calendar size={14} className="text-content-muted" />
              <span className="text-xs text-content-muted">
                Started {formatDateLong(new Date(tracker.started_at + 'T00:00:00'))}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-content-muted">
              {completedCount} / {dates.length} days
            </span>
            <div className="flex items-center gap-2 px-3 py-1 bg-navy-700 rounded-full">
              <div className="w-2 h-2 rounded-full bg-status-success" />
              <span className="text-sm font-medium text-content-inverse">{completionRate}%</span>
            </div>
          </div>
        </div>

        <div className="w-full bg-navy-700 rounded-full h-2 mb-6">
          <div
            className="bg-gradient-to-r from-status-success to-emerald-400 h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionRate}%` }}
          />
        </div>

        <div className="space-y-2">
          {dates.slice().reverse().map((date) => {
            const dateStr = formatDateStr(date);
            const isDone = checkInsMap[dateStr] || false;
            const isSaving = savingDate === dateStr;
            const isSavingNote = savingNotes === dateStr;
            const today = isToday(date);
            const isExpanded = expandedDates.has(dateStr);
            const hasNotes = !!(notesMap[dateStr] || editingNotes[dateStr]);

            return (
              <div
                key={dateStr}
                className={`
                  rounded-lg overflow-hidden transition-all
                  ${today ? 'bg-accent-blue/10 border border-accent-blue/30' : 'bg-navy-800/50'}
                `}
              >
                <div
                  onClick={() => toggleExpanded(dateStr)}
                  className={`
                    w-full flex items-center justify-between p-3 sm:p-4 cursor-pointer
                    ${!isExpanded && !today ? 'hover:bg-navy-700' : ''}
                    transition-colors
                  `}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => handleToggle(date, e)}
                      disabled={isSaving}
                      className="shrink-0"
                    >
                      <div
                        className={`
                          w-6 h-6 rounded-md flex items-center justify-center transition-all
                          ${isDone
                            ? 'bg-status-success text-white'
                            : 'bg-navy-700 border-2 border-navy-600 hover:border-navy-500'
                          }
                        `}
                      >
                        {isSaving ? (
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : isDone ? (
                          <Check size={14} />
                        ) : null}
                      </div>
                    </button>
                    <div className="text-left">
                      <p className={`text-sm font-medium ${today ? 'text-accent-blue' : 'text-content-inverse'}`}>
                        {formatDateDisplay(date)}
                        {today && <span className="ml-2 text-xs">(Today)</span>}
                      </p>
                    </div>
                    {hasNotes && !isExpanded ? (
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 rounded-full">
                        <FileText size={12} className="text-amber-400" />
                        <span className="text-xs text-amber-400">Notes</span>
                      </div>
                    ) : !isExpanded && (
                      <span className="text-xs text-content-muted/50 hover:text-amber-400/70 transition-colors">
                        + Add notes
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm ${isDone ? 'text-status-success' : 'text-content-muted'}`}>
                      {isDone ? 'Done' : 'Not done'}
                    </span>
                    {isExpanded ? (
                      <ChevronUp size={16} className="text-content-muted" />
                    ) : (
                      <ChevronDown size={16} className="text-content-muted" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-3 border-t border-navy-700/50">
                    <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 bg-amber-500/20 rounded-lg">
                          <FileText size={14} className="text-amber-400" />
                        </div>
                        <span className="text-sm font-medium text-amber-400">Daily Journal</span>
                      </div>
                      <textarea
                        value={editingNotes[dateStr] || ''}
                        onChange={(e) => setEditingNotes(prev => ({ ...prev, [dateStr]: e.target.value }))}
                        placeholder="What happened today? How did you feel? What did you learn?"
                        className="w-full min-h-[100px] p-3 bg-navy-900/80 border border-amber-500/30 rounded-lg text-sm text-content-inverse placeholder-amber-600/50 focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/20 resize-y"
                      />
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-amber-500/60">
                          {(editingNotes[dateStr] || '').length} characters
                        </span>
                        {hasNotesChanged(dateStr) && (
                          <button
                            onClick={() => handleSaveNotes(dateStr)}
                            disabled={isSavingNote}
                            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-navy-900 rounded-lg text-xs font-semibold hover:bg-amber-400 transition-colors disabled:opacity-50 shadow-lg shadow-amber-500/20"
                          >
                            {isSavingNote ? (
                              <div className="w-3 h-3 border-2 border-navy-900 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Save size={12} />
                            )}
                            Save Notes
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-xs text-content-muted mt-4 text-center">
          New days appear automatically as you continue tracking
        </p>
      </Card>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative bg-navy-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-semibold text-content-inverse mb-2">
              Delete Progress Tracker?
            </h3>
            <p className="text-content-muted mb-6">
              This will permanently delete all your check-in history for this question. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-content-muted hover:text-content-inverse transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 bg-status-error text-white rounded-lg hover:bg-status-error/90 transition-colors disabled:opacity-50"
              >
                {deleting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
