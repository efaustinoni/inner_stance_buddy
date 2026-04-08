// Created: 2026-02-13
// Last Updated: 2026-04-02 (add From Image tab)

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Upload,
  Edit3,
  Calendar,
  Tag,
  AlertCircle,
  Type,
  Copy,
  Image as ImageIcon,
  Loader2,
  ScanSearch,
} from 'lucide-react';
import { parseExerciseText } from './BulkImportModal';
import type { ExerciseQuarter } from '../../lib/services/quarterService';
import { extractQuestionsFromImage } from '../../lib/services/questionService';

export interface ParsedQuestion {
  label: string;
  text: string;
  answer?: string;
}

interface WeekModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    weekNumber: number,
    topic: string,
    quarterId: string | null,
    questions?: ParsedQuestion[]
  ) => Promise<void>;
  onDelete?: () => Promise<void>;
  onCopyToQuarter?: (targetQuarterId: string | null, includeAnswers: boolean) => Promise<void>;
  initialData?: {
    week_number: number;
    topic: string;
    quarter_id?: string | null;
  };
  existingWeekNumbers: number[];
  quarters: ExerciseQuarter[];
  /** week numbers already used in the selected quarter (for uniqueness check) */
  weekNumbersInQuarter?: number[];
}

type InputMode = 'manual' | 'csv' | 'text' | 'image';

/** Resize + JPEG-compress an image file, returning base64 (no data-URL prefix). */
async function compressAndEncodeImage(
  file: File,
  maxDim = 2048,
  quality = 0.85
): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve({ base64: dataUrl.split(',')[1], mimeType: 'image/jpeg' });
      };
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

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

function parseCSV(csvText: string): {
  weekNumber?: number;
  theme?: string;
  questions: ParsedQuestion[];
} {
  let text = csvText;
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }

  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) {
    return { questions: [] };
  }

  const rawHeaders = parseCSVLine(lines[0]);
  const headers = rawHeaders.map((h) =>
    h
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_]/g, '')
  );
  const dataLine = parseCSVLine(lines[1]);

  const weekIdx = headers.findIndex((h) => h === 'week');
  const themeIdx = headers.findIndex((h) => h === 'theme' || h === 'thema');

  const weekNumber =
    weekIdx !== -1 && dataLine[weekIdx] ? parseInt(dataLine[weekIdx], 10) : undefined;
  const theme = themeIdx !== -1 && dataLine[themeIdx] ? dataLine[themeIdx] : undefined;

  const questions: ParsedQuestion[] = [];

  for (let qNum = 1; qNum <= 10; qNum++) {
    const questionKey = `question_${qNum}`;
    const questionIdx = headers.indexOf(questionKey);

    if (questionIdx === -1 || !dataLine[questionIdx]) continue;

    const questionText = dataLine[questionIdx];
    let answer: string | undefined;

    // Try direct answer_N column first (supports | for multi-line)
    const directAnswerKey = `answer_${qNum}`;
    const directAnswerIdx = headers.indexOf(directAnswerKey);

    if (directAnswerIdx !== -1 && dataLine[directAnswerIdx]) {
      answer = dataLine[directAnswerIdx]
        .split('|')
        .map((a: string) => a.trim())
        .join('\n');
    } else {
      // Fall back to answer_Na, answer_Nb, etc.
      const subAnswers: string[] = [];
      const answerLetters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
      for (const letter of answerLetters) {
        const answerKey = `answer_${qNum}${letter}`;
        const answerIdx = headers.indexOf(answerKey);
        if (answerIdx !== -1 && dataLine[answerIdx]) {
          subAnswers.push(dataLine[answerIdx]);
        }
      }
      if (subAnswers.length > 0) {
        answer = subAnswers.join('\n');
      }
    }

    // Support optional label_N column
    const labelKey = `label_${qNum}`;
    const labelIdx = headers.indexOf(labelKey);
    const questionLabel =
      labelIdx !== -1 && dataLine[labelIdx] ? dataLine[labelIdx] : `Vraag ${qNum}`;

    questions.push({
      label: questionLabel,
      text: questionText,
      answer,
    });
  }

  return { weekNumber, theme, questions };
}

export function WeekModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  onCopyToQuarter,
  initialData,
  existingWeekNumbers,
  quarters,
  weekNumbersInQuarter = [],
}: WeekModalProps) {
  const [inputMode, setInputMode] = useState<InputMode>('manual');
  const [weekNumber, setWeekNumber] = useState(initialData?.week_number || 1);
  const [topic, setTopic] = useState(initialData?.topic || '');
  const [selectedQuarterId, setSelectedQuarterId] = useState<string | null>(
    initialData?.quarter_id ?? null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Copy to quarter state
  const [showCopyPanel, setShowCopyPanel] = useState(false);
  const [copyTargetQuarterId, setCopyTargetQuarterId] = useState<string | null>(null);
  const [copyIncludeAnswers, setCopyIncludeAnswers] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  const [csvFileName, setCsvFileName] = useState('');
  const [csvQuestions, setCsvQuestions] = useState<ParsedQuestion[]>([]);
  const [rawText, setRawText] = useState('');
  const [parseError, setParseError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image-mode state
  const [imageFileName, setImageFileName] = useState('');
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setWeekNumber(initialData.week_number);
        setTopic(initialData.topic);
        setSelectedQuarterId(initialData.quarter_id ?? null);
        setInputMode('manual');
      } else {
        const nextWeek = existingWeekNumbers.length > 0 ? Math.max(...existingWeekNumbers) + 1 : 1;
        setWeekNumber(nextWeek);
        setTopic('');
        setSelectedQuarterId(null);
        setCsvFileName('');
        setCsvQuestions([]);
        setParseError('');
      }
      setShowCopyPanel(false);
      setCopyTargetQuarterId(null);
      setCopyIncludeAnswers(false);
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
        setParseError(
          'Could not parse any questions from CSV. Ensure the file has headers like question_1, answer_1a, answer_1b, etc.'
        );
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
    const questionsToImport =
      (inputMode === 'csv' || inputMode === 'text' || inputMode === 'image') &&
      csvQuestions.length > 0
        ? csvQuestions
        : undefined;
    await onSave(weekNumber, topic.trim(), selectedQuarterId, questionsToImport);
    setIsSaving(false);
    onClose();
  };

  const handleCopy = async () => {
    if (!onCopyToQuarter) return;
    setIsCopying(true);
    await onCopyToQuarter(copyTargetQuarterId, copyIncludeAnswers);
    setIsCopying(false);
    setShowCopyPanel(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    await onDelete();
    setIsDeleting(false);
    onClose();
  };

  const handleTextChange = useCallback((text: string) => {
    setRawText(text);
    setParseError('');
    if (!text.trim()) {
      setCsvQuestions([]);
      return;
    }
    const result = parseExerciseText(text);
    setCsvQuestions(result.questions);
    if (result.weekNumber) setWeekNumber(result.weekNumber);
    if (result.theme) setTopic(result.theme);
    if (result.questions.length === 0) {
      setParseError(
        'Could not parse any questions. Start each question with a label like "Vraag 1a:" or "1a."'
      );
    }
  }, []);

  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageFileName(file.name);
    setParseError('');
    setCsvQuestions([]);

    const previewUrl = URL.createObjectURL(file);
    setImagePreviewUrl(previewUrl);

    setIsExtracting(true);
    try {
      const { base64, mimeType } = await compressAndEncodeImage(file);
      const result = await extractQuestionsFromImage(base64, mimeType);

      if (result === null) {
        setParseError(
          'Extraction failed — check the Supabase edge function logs for details (model may not support vision, or API key invalid).'
        );
        return;
      }
      if (result.questions.length === 0) {
        setParseError(
          'The AI returned no questions. Try a different image or check that the model supports vision inputs.'
        );
        return;
      }

      if (result.weekNumber) setWeekNumber(result.weekNumber);
      if (result.theme) setTopic(result.theme);
      setCsvQuestions(result.questions);
    } catch (err) {
      console.error('[WeekModal] Image extraction error:', err);
      setParseError(`Extraction error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsExtracting(false);
    }
  }, []);

  const handleModeChange = (mode: InputMode) => {
    setInputMode(mode);
    setCsvFileName('');
    setCsvQuestions([]);
    setRawText('');
    setParseError('');
    setImageFileName('');
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  if (!isOpen) return null;

  const isEditMode = !!initialData;
  const weekNumberInUse = !isEditMode && weekNumbersInQuarter.includes(weekNumber);

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
            <button
              onClick={() => handleModeChange('text')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                inputMode === 'text'
                  ? 'text-accent-blue border-b-2 border-accent-blue bg-accent-blue/5'
                  : 'text-content-muted hover:text-content-inverse'
              }`}
            >
              <Type size={16} />
              Paste Text
            </button>
            <button
              onClick={() => handleModeChange('image')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                inputMode === 'image'
                  ? 'text-accent-blue border-b-2 border-accent-blue bg-accent-blue/5'
                  : 'text-content-muted hover:text-content-inverse'
              }`}
            >
              <ScanSearch size={16} />
              From Image
            </button>
          </div>
        )}

        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Quarter selector — shown in both create and edit modes */}
          {!showCopyPanel && (
            <div>
              <label className="block text-sm font-medium text-content-muted mb-1">
                Quarter <span className="text-xs font-normal">(optional)</span>
              </label>
              <select
                value={selectedQuarterId || ''}
                onChange={(e) => setSelectedQuarterId(e.target.value || null)}
                className="w-full px-3 py-2 bg-navy-900 border border-navy-600 rounded-lg text-content-inverse focus:outline-none focus:border-accent-blue"
              >
                <option value="">— No quarter —</option>
                {quarters.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.label}
                  </option>
                ))}
              </select>
              {!selectedQuarterId && (
                <p className="text-xs text-content-muted mt-1">
                  This week will appear as "Unassigned".
                </p>
              )}
            </div>
          )}

          {/* Copy to Quarter panel (edit mode only) */}
          {isEditMode && onCopyToQuarter && showCopyPanel && (
            <div className="p-4 bg-navy-900 rounded-lg border border-navy-600 space-y-3">
              <p className="text-sm font-medium text-content-inverse">
                Copy week to another quarter
              </p>
              <div>
                <label className="block text-xs text-content-muted mb-1">Target Quarter</label>
                <select
                  value={copyTargetQuarterId || ''}
                  onChange={(e) => setCopyTargetQuarterId(e.target.value || null)}
                  className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded-lg text-content-inverse focus:outline-none focus:border-accent-blue"
                >
                  <option value="">— No quarter (unassigned) —</option>
                  {quarters.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.label}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={copyIncludeAnswers}
                  onChange={(e) => setCopyIncludeAnswers(e.target.checked)}
                  className="rounded border-navy-600"
                />
                <span className="text-sm text-content-inverse">Include answers</span>
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  disabled={isCopying}
                  className="flex-1 px-3 py-2 bg-accent-blue text-white rounded-lg text-sm font-medium hover:bg-accent-blue/90 transition-colors disabled:opacity-50"
                >
                  {isCopying ? 'Copying...' : 'Copy Week'}
                </button>
                <button
                  onClick={() => setShowCopyPanel(false)}
                  className="px-3 py-2 text-content-muted hover:text-content-inverse rounded-lg text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {inputMode === 'image' && !isEditMode && (
            <div>
              <label className="block text-sm font-medium text-content-muted mb-1">
                Upload Image
              </label>
              <p className="text-xs text-content-muted mb-3">
                Take a photo of your exercise sheet — AI will extract questions and answers
                automatically.
              </p>
              <div
                onClick={() => !isExtracting && imageInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-5 text-center transition-colors ${
                  isExtracting
                    ? 'border-navy-600 cursor-not-allowed opacity-60'
                    : 'border-navy-600 cursor-pointer hover:border-accent-blue/50'
                }`}
              >
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {isExtracting ? (
                  <div className="flex flex-col items-center gap-2 py-2">
                    <Loader2 size={28} className="text-accent-blue animate-spin" />
                    <p className="text-content-inverse font-medium text-sm">
                      Extracting questions…
                    </p>
                    <p className="text-xs text-content-muted">AI is reading your image</p>
                  </div>
                ) : imagePreviewUrl ? (
                  <div className="flex flex-col items-center gap-2">
                    <img
                      src={imagePreviewUrl}
                      alt="Preview"
                      className="max-h-32 rounded-lg object-contain mx-auto"
                    />
                    <p className="text-content-muted text-xs mt-1">
                      {imageFileName} — click to replace
                    </p>
                  </div>
                ) : (
                  <>
                    <ImageIcon size={28} className="mx-auto text-content-muted mb-2" />
                    <p className="text-content-inverse font-medium">
                      Click to upload or take a photo
                    </p>
                    <p className="text-xs text-content-muted mt-1">
                      JPG, PNG, HEIC — large images are auto-compressed
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {inputMode === 'text' && !isEditMode && (
            <div>
              <label className="block text-sm font-medium text-content-muted mb-1">
                Paste your questions below
              </label>
              <p className="text-xs text-content-muted mb-2">
                Include "Week: 2" and "Thema: Non-negotiable Targets" to auto-fill week number and
                topic
              </p>
              <textarea
                value={rawText}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder={`Week: 2\nThema: Non-negotiable Targets\n\nVraag 1a: Voor welk bedrijf werk je?\nAI Global Experts\n\nVraag 1b: Wat is je huidige functie?\nOndernemer / Founder`}
                rows={8}
                className="w-full px-3 py-2 bg-navy-900 border border-navy-600 rounded-lg text-content-inverse placeholder-content-muted focus:outline-none focus:border-accent-blue resize-y text-sm font-mono"
              />
            </div>
          )}

          {inputMode === 'csv' && !isEditMode && (
            <div>
              <label className="block text-sm font-medium text-content-muted mb-1">
                Upload CSV File
              </label>
              <p className="text-xs text-content-muted mb-3">
                CSV format: week, theme, label_1, question_1, answer_1, ... (label_N optional; use |
                for multi-line answers)
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

          {parseError && (inputMode === 'csv' || inputMode === 'text' || inputMode === 'image') && (
            <div className="flex items-start gap-2 p-3 bg-status-error/10 border border-status-error/20 rounded-lg">
              <AlertCircle size={18} className="text-status-error flex-shrink-0 mt-0.5" />
              <p className="text-sm text-status-error">{parseError}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-content-muted mb-1">Week Number</label>
            <input
              type="number"
              min="1"
              value={weekNumber}
              onChange={(e) => setWeekNumber(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 bg-navy-900 border border-navy-600 rounded-lg text-content-inverse focus:outline-none focus:border-accent-blue"
            />
            {weekNumberInUse && (
              <p className="text-xs text-status-error mt-1">Week {weekNumber} already exists</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-content-muted mb-1">Week Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., War on Weakness, Non-negotiable Standards"
              className="w-full px-3 py-2 bg-navy-900 border border-navy-600 rounded-lg text-content-inverse placeholder-content-muted focus:outline-none focus:border-accent-blue"
            />
          </div>

          {(inputMode === 'csv' || inputMode === 'text' || inputMode === 'image') &&
            csvQuestions.length > 0 && (
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
                      <span className="text-content-muted text-sm line-clamp-2">
                        {q.text.split('\n')[0]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>

        <div className="flex items-center justify-between p-4 border-t border-navy-700">
          <div className="flex items-center gap-2">
            {isEditMode && onDelete && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-status-error hover:bg-status-error/10 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Week'}
              </button>
            )}
            {isEditMode && onCopyToQuarter && !showCopyPanel && (
              <button
                onClick={() => setShowCopyPanel(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-content-muted hover:text-accent-blue hover:bg-navy-700 rounded-lg text-sm font-medium transition-colors"
              >
                <Copy size={14} />
                Copy to Quarter
              </button>
            )}
            {!isEditMode && !onDelete && <div />}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-content-muted hover:text-content-inverse rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || isExtracting || !topic.trim() || weekNumberInUse}
              className="px-4 py-2 bg-accent-blue text-white rounded-lg font-medium hover:bg-accent-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving
                ? 'Saving...'
                : isExtracting
                  ? 'Extracting...'
                  : isEditMode
                    ? 'Save Changes'
                    : (inputMode === 'csv' || inputMode === 'text' || inputMode === 'image') &&
                        csvQuestions.length > 0
                      ? `Create Week & Import ${csvQuestions.length} Questions`
                      : 'Create Week'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
