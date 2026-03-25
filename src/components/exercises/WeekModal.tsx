// Created: 2026-02-13
// Last Updated: 2026-02-14 00:10

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Upload, Edit3, Calendar, Tag, AlertCircle } from 'lucide-react';

export interface ParsedQuestion {
  label: string;
  text: string;
  answer?: string;
}

interface WeekModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (weekNumber: number, topic: string, questions?: ParsedQuestion[]) => Promise<void>;
  onDelete?: () => Promise<void>;
  initialData?: {
    week_number: number;
    topic: string;
  };
  existingWeekNumbers: number[];
}

type InputMode = 'manual' | 'csv';

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function parseCSV(csvText: string): { weekNumber?: number; theme?: string; questions: ParsedQuestion[] } {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) {
    return { questions: [] };
  }

  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
  const dataLine = parseCSVLine(lines[1]);

  const weekIdx = headers.indexOf('week');
  const themeIdx = headers.indexOf('theme');

  const weekNumber = weekIdx !== -1 && dataLine[weekIdx] ? parseInt(dataLine[weekIdx], 10) : undefined;
  const theme = themeIdx !== -1 && dataLine[themeIdx] ? dataLine[themeIdx] : undefined;

  const questions: ParsedQuestion[] = [];

  for (let qNum = 1; qNum <= 6; qNum++) {
    const questionKey = `question_${qNum}`;
    const questionIdx = headers.indexOf(questionKey);

    if (questionIdx === -1 || !dataLine[questionIdx]) continue;

    const questionText = dataLine[questionIdx];
    const answers: string[] = [];

    const answerLetters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    for (const letter of answerLetters) {
      const answerKey = `answer_${qNum}${letter}`;
      const answerIdx = headers.indexOf(answerKey);

      if (answerIdx !== -1 && dataLine[answerIdx]) {
        answers.push(dataLine[answerIdx]);
      }
    }

    const formattedAnswer = answers.length > 0
      ? answers.map((a, i) => `${i + 1}. ${a}`).join('\n')
      : '';

    questions.push({
      label: `Vraag ${qNum}`,
      text: questionText,
      answer: formattedAnswer,
    });
  }

  return { weekNumber, theme, questions };
}

export function WeekModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
  existingWeekNumbers
}: WeekModalProps) {
  const [inputMode, setInputMode] = useState<InputMode>('manual');
  const [weekNumber, setWeekNumber] = useState(initialData?.week_number || 1);
  const [topic, setTopic] = useState(initialData?.topic || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [csvFileName, setCsvFileName] = useState('');
  const [csvQuestions, setCsvQuestions] = useState<ParsedQuestion[]>([]);
  const [parseError, setParseError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setWeekNumber(initialData.week_number);
        setTopic(initialData.topic);
        setInputMode('manual');
      } else {
        const nextWeek = existingWeekNumbers.length > 0
          ? Math.max(...existingWeekNumbers) + 1
          : 1;
        setWeekNumber(nextWeek);
        setTopic('');
        setCsvFileName('');
        setCsvQuestions([]);
        setParseError('');
      }
    }
  }, [isOpen, initialData, existingWeekNumbers]);

  const handleCSVUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    setParseError('');

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        setParseError('Could not read file');
        return;
      }

      const result = parseCSV(text);

      if (result.weekNumber) {
        setWeekNumber(result.weekNumber);
      }
      if (result.theme) {
        setTopic(result.theme);
      }

      setCsvQuestions(result.questions);

      if (result.questions.length === 0) {
        setParseError('Could not parse any questions from CSV. Ensure the file has headers like question_1, answer_1a, answer_1b, etc.');
      }
    };
    reader.onerror = () => {
      setParseError('Error reading file');
    };
    reader.readAsText(file);
  }, []);

  const handleSave = async () => {
    if (!topic.trim()) return;
    setIsSaving(true);
    const questionsToImport = inputMode === 'csv' && csvQuestions.length > 0 ? csvQuestions : undefined;
    await onSave(weekNumber, topic.trim(), questionsToImport);
    setIsSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    await onDelete();
    setIsDeleting(false);
    onClose();
  };

  const handleModeChange = (mode: InputMode) => {
    setInputMode(mode);
    if (mode === 'manual') {
      setCsvFileName('');
      setCsvQuestions([]);
      setParseError('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!isOpen) return null;

  const isEditMode = !!initialData;
  const weekNumberInUse = !isEditMode && existingWeekNumbers.includes(weekNumber);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-navy-800 rounded-xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-navy-700">
          <h2 className="text-lg font-semibold text-content-inverse">
            {isEditMode ? 'Edit Week' : 'Add New Week'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-content-muted hover:text-content-inverse rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {!isEditMode && (
          <div className="flex border-b border-navy-700">
            <button
              onClick={() => handleModeChange('manual')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                inputMode === 'manual'
                  ? 'text-accent-blue border-b-2 border-accent-blue bg-accent-blue/5'
                  : 'text-content-muted hover:text-content-inverse'
              }`}
            >
              <Edit3 size={16} />
              Manual Entry
            </button>
            <button
              onClick={() => handleModeChange('csv')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                inputMode === 'csv'
                  ? 'text-accent-blue border-b-2 border-accent-blue bg-accent-blue/5'
                  : 'text-content-muted hover:text-content-inverse'
              }`}
            >
              <Upload size={16} />
              Import CSV
            </button>
          </div>
        )}

        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {inputMode === 'csv' && !isEditMode && (
            <div>
              <label className="block text-sm font-medium text-content-muted mb-1">
                Upload CSV File
              </label>
              <p className="text-xs text-content-muted mb-3">
                CSV format: week, theme, question_1, answer_1a, answer_1b, ...
              </p>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-navy-600 rounded-lg p-5 text-center cursor-pointer hover:border-accent-blue/50 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="hidden"
                />
                <Upload size={28} className="mx-auto text-content-muted mb-2" />
                {csvFileName ? (
                  <p className="text-content-inverse font-medium">{csvFileName}</p>
                ) : (
                  <>
                    <p className="text-content-inverse font-medium">Click to upload CSV</p>
                    <p className="text-xs text-content-muted mt-1">or drag and drop</p>
                  </>
                )}
              </div>
            </div>
          )}

          {parseError && inputMode === 'csv' && (
            <div className="flex items-start gap-2 p-3 bg-status-error/10 border border-status-error/20 rounded-lg">
              <AlertCircle size={18} className="text-status-error flex-shrink-0 mt-0.5" />
              <p className="text-sm text-status-error">{parseError}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-content-muted mb-1">
              Week Number
            </label>
            <input
              type="number"
              min="1"
              value={weekNumber}
              onChange={(e) => setWeekNumber(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 bg-navy-900 border border-navy-600 rounded-lg text-content-inverse focus:outline-none focus:border-accent-blue"
            />
            {weekNumberInUse && (
              <p className="text-xs text-status-error mt-1">
                Week {weekNumber} already exists
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-content-muted mb-1">
              Week Topic
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., War on Weakness, Non-negotiable Standards"
              className="w-full px-3 py-2 bg-navy-900 border border-navy-600 rounded-lg text-content-inverse placeholder-content-muted focus:outline-none focus:border-accent-blue"
            />
          </div>

          {inputMode === 'csv' && csvQuestions.length > 0 && (
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-accent-blue/10 border border-accent-blue/30 rounded-lg">
                  <Calendar size={14} className="text-accent-blue" />
                  <span className="text-sm text-accent-blue font-medium">Week {weekNumber}</span>
                </div>
                {topic && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-accent-gold/10 border border-accent-gold/30 rounded-lg">
                    <Tag size={14} className="text-accent-gold" />
                    <span className="text-sm text-accent-gold font-medium">{topic}</span>
                  </div>
                )}
              </div>

              <h3 className="text-sm font-medium text-content-inverse mb-2">
                Questions to Import ({csvQuestions.length})
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {csvQuestions.map((q, index) => (
                  <div
                    key={index}
                    className="p-2.5 bg-navy-900 rounded-lg border border-navy-700"
                  >
                    <span className="text-accent-gold font-medium text-sm">{q.label}:</span>{' '}
                    <span className="text-content-muted text-sm line-clamp-2">{q.text.split('\n')[0]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-4 border-t border-navy-700">
          {isEditMode && onDelete ? (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 text-status-error hover:bg-status-error/10 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete Week'}
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-content-muted hover:text-content-inverse rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !topic.trim() || weekNumberInUse}
              className="px-4 py-2 bg-accent-blue text-white rounded-lg font-medium hover:bg-accent-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : isEditMode ? 'Save Changes' : inputMode === 'csv' && csvQuestions.length > 0 ? `Create Week & Import ${csvQuestions.length} Questions` : 'Create Week'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
