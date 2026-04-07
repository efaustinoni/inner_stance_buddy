// Created: 2026-02-13
// Last Updated: 2026-04-07 (error toast on save failure)

import { useState, useEffect } from 'react';
import { toast } from '../../lib/toast';
import { Save, Check, X, Target, ArrowRight } from 'lucide-react';
import type { QuestionWithAnswer, ProgressTracker } from '../../lib/exerciseService';

interface ExerciseQuestionCardProps {
  question: QuestionWithAnswer;
  tracker?: ProgressTracker | null;
  onSaveAnswer: (questionId: string, answerText: string) => Promise<boolean>;
  onDeleteQuestion: (questionId: string) => void;
  onStartTracking: (questionId: string) => Promise<void>;
  onViewProgress: (trackerId: string) => void;
}

export function ExerciseQuestionCard({
  question,
  tracker,
  onSaveAnswer,
  onDeleteQuestion,
  onStartTracking,
  onViewProgress,
}: ExerciseQuestionCardProps) {
  const [answer, setAnswer] = useState(question.answer?.answer_text || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isStartingTracker, setIsStartingTracker] = useState(false);

  useEffect(() => {
    setAnswer(question.answer?.answer_text || '');
    setHasChanges(false);
  }, [question.answer?.answer_text]);

  const handleAnswerChange = (value: string) => {
    setAnswer(value);
    setHasChanges(value !== (question.answer?.answer_text || ''));
    setSaved(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const success = await onSaveAnswer(question.id, answer);
    setIsSaving(false);
    if (success) {
      setSaved(true);
      setHasChanges(false);
      setTimeout(() => setSaved(false), 2000);
    } else {
      toast.error('Failed to save your answer. Please try again.');
    }
  };

  const handleStartTracking = async () => {
    setIsStartingTracker(true);
    await onStartTracking(question.id);
    setIsStartingTracker(false);
  };

  return (
    <div className="group relative space-y-3">
      <button
        onClick={() => onDeleteQuestion(question.id)}
        className="absolute -top-2 -right-2 p-1.5 bg-navy-700 text-content-muted hover:bg-status-error hover:text-white rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
        title="Remove question"
      >
        <X size={14} />
      </button>

      <div className="pr-6">
        <h3 className="text-base sm:text-lg font-medium text-content-inverse whitespace-pre-wrap">
          <span className="text-content-muted">{question.question_label}:</span>{' '}
          {question.question_text}
        </h3>
      </div>

      <div className="relative">
        <textarea
          value={answer}
          onChange={(e) => handleAnswerChange(e.target.value)}
          placeholder="Type your answer here..."
          className="w-full min-h-[140px] p-4 bg-amber-100 border-2 border-amber-300 rounded-lg text-navy-900 placeholder-amber-600/50 focus:outline-none focus:border-amber-400 resize-y text-sm sm:text-base leading-relaxed"
        />

        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-content-muted">{answer.length} characters</span>

          <div className="flex items-center gap-2">
            {saved && (
              <span className="flex items-center gap-1 text-xs text-status-success">
                <Check size={14} />
                Saved
              </span>
            )}
            {hasChanges && (
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-blue text-white rounded-lg text-sm font-medium hover:bg-accent-blue/90 transition-colors disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                Save
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-navy-700">
        {tracker ? (
          <button
            onClick={() => onViewProgress(tracker.id)}
            className="flex items-center gap-2 px-3 py-2 bg-status-success/20 text-status-success border border-status-success/30 rounded-lg text-sm font-medium hover:bg-status-success/30 transition-colors"
          >
            <Target size={16} />
            <span>View Progress</span>
            <ArrowRight size={14} />
          </button>
        ) : (
          <button
            onClick={handleStartTracking}
            disabled={isStartingTracker}
            className="flex items-center gap-2 px-3 py-2 bg-navy-700 text-content-muted border border-navy-600 rounded-lg text-sm font-medium hover:bg-navy-600 hover:text-content-inverse transition-colors disabled:opacity-50"
          >
            {isStartingTracker ? (
              <div className="w-4 h-4 border-2 border-content-muted border-t-transparent rounded-full animate-spin" />
            ) : (
              <Target size={16} />
            )}
            <span>Track Progress</span>
          </button>
        )}
      </div>
    </div>
  );
}
