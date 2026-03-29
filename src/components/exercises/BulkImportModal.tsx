// Created: 2026-02-13
// Last Updated: 2026-02-14 03:15

import { useState, useCallback, useRef } from 'react';
import { X, FileText, AlertCircle, Calendar, Tag, Upload, Type, CheckCircle } from 'lucide-react';

export interface BulkImportData {
  weekNumber?: number;
  theme?: string;
  questions: { label: string; text: string; answer?: string }[];
}

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: BulkImportData) => Promise<void>;
}

type ImportMode = 'text' | 'csv';

const QUESTION_LABEL_PATTERN = /^(Reflectie|Actie|Vraag|Question|Action|Reflection|Oefening|Exercise)\s*\d+[a-z]?[:.]\s*/i;
const NUMBERED_LABEL_PATTERN = /^(\d+[a-z]?)[.:]\s+(?=[A-Z])/;
const WEEK_PATTERN = /^Week[:\s]+(\d+)/i;
const THEME_PATTERN = /^(Theme|Thema)[:\s]+(.+)/i;

function parseExerciseText(text: string): BulkImportData {
  const lines = text.split('\n');
  const questions: { label: string; text: string; answer?: string }[] = [];

  let weekNumber: number | undefined;
  let theme: string | undefined;
  let currentQuestion: { label: string; questionText: string; answers: string[] } | null = null;

  const saveCurrentQuestion = () => {
    if (currentQuestion) {
      questions.push({
        label: currentQuestion.label,
        text: currentQuestion.questionText,
        answer: currentQuestion.answers.length > 0 ? currentQuestion.answers.join('\n') : undefined,
      });
    }
  };

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    const weekMatch = trimmedLine.match(WEEK_PATTERN);
    if (weekMatch && !currentQuestion) {
      weekNumber = parseInt(weekMatch[1], 10);
      continue;
    }

    const themeMatch = trimmedLine.match(THEME_PATTERN);
    if (themeMatch && !currentQuestion) {
      theme = themeMatch[2].trim();
      continue;
    }

    const wordLabelMatch = trimmedLine.match(QUESTION_LABEL_PATTERN);
    const numberLabelMatch = trimmedLine.match(NUMBERED_LABEL_PATTERN);

    if (wordLabelMatch) {
      saveCurrentQuestion();
      const label = wordLabelMatch[0].replace(/[:.]\s*$/, '').trim();
      const questionText = trimmedLine.substring(wordLabelMatch[0].length).trim();
      currentQuestion = { label, questionText, answers: [] };
    } else if (numberLabelMatch && !currentQuestion) {
      saveCurrentQuestion();
      const label = numberLabelMatch[1].toUpperCase();
      const questionText = trimmedLine.substring(numberLabelMatch[0].length).trim();
      currentQuestion = { label, questionText, answers: [] };
    } else if (currentQuestion) {
      currentQuestion.answers.push(trimmedLine);
    }
  }

  saveCurrentQuestion();

  return { weekNumber, theme, questions };
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

function parseCSV(csvText: string): BulkImportData {
  let text = csvText;
  if (text.charCodeAt(0) === 0xFEFF) {
    text = text.slice(1);
  }

  const lines = text.split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) {
    return { questions: [] };
  }

  const rawHeaders = parseCSVLine(lines[0]);
  const headers = rawHeaders.map(h => h.toLowerCase().trim().replace(/[^a-z0-9_]/g, ''));
  const dataLine = parseCSVLine(lines[1]);

  console.log('[CSV Parser] Headers:', headers);
  console.log('[CSV Parser] Data columns:', dataLine.length);
  dataLine.forEach((val, idx) => {
    if (headers[idx]?.includes('answer')) {
      console.log(`[CSV Parser] ${headers[idx]}: "${val.substring(0, 100)}..." (length: ${val.length})`);
    }
  });

  const weekIdx = headers.findIndex(h => h === 'week');
  const themeIdx = headers.findIndex(h => h === 'theme' || h === 'thema');

  const weekNumber = weekIdx !== -1 && dataLine[weekIdx] ? parseInt(dataLine[weekIdx], 10) : undefined;
  const theme = themeIdx !== -1 && dataLine[themeIdx] ? dataLine[themeIdx] : undefined;

  const questions: { label: string; text: string; answer?: string }[] = [];

  for (let qNum = 1; qNum <= 10; qNum++) {
    const questionKey = `question_${qNum}`;
    const questionIdx = headers.indexOf(questionKey);

    if (questionIdx === -1 || !dataLine[questionIdx]) continue;

    const questionText = dataLine[questionIdx];

    const directAnswerKey = `answer_${qNum}`;
    const directAnswerIdx = headers.indexOf(directAnswerKey);
    let answer: string | undefined;

    console.log(`[CSV Parser] Q${qNum}: Looking for ${directAnswerKey}, found at index ${directAnswerIdx}, value length: ${dataLine[directAnswerIdx]?.length || 0}`);

    if (directAnswerIdx !== -1 && dataLine[directAnswerIdx]) {
      const rawAnswer = dataLine[directAnswerIdx];
      console.log(`[CSV Parser] Q${qNum}: Raw answer has ${rawAnswer.split('|').length} parts`);
      answer = rawAnswer.split('|').map(a => a.trim()).join('\n');
      console.log(`[CSV Parser] Q${qNum}: Final answer length: ${answer.length}`);
    } else {
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
        console.log(`[CSV Parser] Q${qNum}: Using ${subAnswers.length} sub-answers`);
      }
    }

    const labelKey = `label_${qNum}`;
    const labelIdx = headers.indexOf(labelKey);
    const questionLabel = (labelIdx !== -1 && dataLine[labelIdx]) ? dataLine[labelIdx] : `Vraag ${qNum}`;

    questions.push({
      label: questionLabel,
      text: questionText,
      answer,
    });
  }

  return { weekNumber, theme, questions };
}

export function BulkImportModal({ isOpen, onClose, onImport }: BulkImportModalProps) {
  const [importMode, setImportMode] = useState<ImportMode>('csv');
  const [rawText, setRawText] = useState('');
  const [csvFileName, setCsvFileName] = useState('');
  const [parsedData, setParsedData] = useState<BulkImportData>({ questions: [] });
  const [isImporting, setIsImporting] = useState(false);
  const [parseError, setParseError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextChange = useCallback((text: string) => {
    setRawText(text);
    setParseError('');

    if (!text.trim()) {
      setParsedData({ questions: [] });
      return;
    }

    const result = parseExerciseText(text);
    setParsedData(result);

    if (result.questions.length === 0 && text.trim()) {
      setParseError('Could not parse any questions. Each question should start with a label like "Reflectie 1a:" or "Actie 2:"');
    }
  }, []);

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
      setParsedData(result);

      if (result.questions.length === 0) {
        setParseError('Could not parse any questions from CSV. Ensure the file has headers like question_1, answer_1a, answer_1b, etc.');
      }
    };
    reader.onerror = () => {
      setParseError('Error reading file');
    };
    reader.readAsText(file);
  }, []);

  const handleImport = async () => {
    if (parsedData.questions.length === 0) return;
    setIsImporting(true);
    await onImport(parsedData);
    setIsImporting(false);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setRawText('');
    setCsvFileName('');
    setParsedData({ questions: [] });
    setParseError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleModeChange = (mode: ImportMode) => {
    setImportMode(mode);
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-navy-800 rounded-xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-navy-700">
          <div className="flex items-center gap-2">
            <FileText size={20} className="text-accent-gold" />
            <h2 className="text-lg font-semibold text-content-inverse">
              Bulk Import Questions
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 text-content-muted hover:text-content-inverse rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-navy-700">
          <button
            onClick={() => handleModeChange('csv')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              importMode === 'csv'
                ? 'text-accent-blue border-b-2 border-accent-blue bg-accent-blue/5'
                : 'text-content-muted hover:text-content-inverse'
            }`}
          >
            <Upload size={16} />
            CSV File
          </button>
          <button
            onClick={() => handleModeChange('text')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              importMode === 'text'
                ? 'text-accent-blue border-b-2 border-accent-blue bg-accent-blue/5'
                : 'text-content-muted hover:text-content-inverse'
            }`}
          >
            <Type size={16} />
            Paste Text
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {importMode === 'csv' ? (
            <div>
              <label className="block text-sm font-medium text-content-muted mb-1">
                Upload CSV File
              </label>
              <p className="text-xs text-content-muted mb-3">
                CSV format: week, theme, label_1, question_1, answer_1, label_2, question_2, answer_2, ... (label_N is optional; use | to separate multi-line answers)
              </p>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-navy-600 rounded-lg p-6 text-center cursor-pointer hover:border-accent-blue/50 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUpload}
                  className="hidden"
                />
                <Upload size={32} className="mx-auto text-content-muted mb-2" />
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
          ) : (
            <div>
              <label className="block text-sm font-medium text-content-muted mb-1">
                Paste your questions below
              </label>
              <p className="text-xs text-content-muted mb-2">
                Include "Week: 3" and "Thema: War on Weakness" at the top to create a new week automatically
              </p>
              <textarea
                value={rawText}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder={`Week: 3\nThema: War on Weakness\n\nReflectie 1a: Waar kies ik gemak boven groei?\n\nProfessioneel kies ik...\nPersoonlijk kies ik...\n\nActie 2: Formuleer een zin...\n\nIk verklaar oorlog aan...`}
                rows={8}
                className="w-full px-3 py-2 bg-navy-900 border border-navy-600 rounded-lg text-content-inverse placeholder-content-muted focus:outline-none focus:border-accent-blue resize-y text-sm font-mono"
              />
            </div>
          )}

          {parseError && (
            <div className="flex items-start gap-2 p-3 bg-status-error/10 border border-status-error/20 rounded-lg">
              <AlertCircle size={18} className="text-status-error flex-shrink-0 mt-0.5" />
              <p className="text-sm text-status-error">{parseError}</p>
            </div>
          )}

          {(parsedData.weekNumber || parsedData.theme) && (
            <div className="flex flex-wrap gap-3">
              {parsedData.weekNumber && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-accent-blue/10 border border-accent-blue/30 rounded-lg">
                  <Calendar size={14} className="text-accent-blue" />
                  <span className="text-sm text-accent-blue font-medium">Week {parsedData.weekNumber}</span>
                </div>
              )}
              {parsedData.theme && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-accent-gold/10 border border-accent-gold/30 rounded-lg">
                  <Tag size={14} className="text-accent-gold" />
                  <span className="text-sm text-accent-gold font-medium">{parsedData.theme}</span>
                </div>
              )}
            </div>
          )}

          {parsedData.questions.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-content-inverse mb-2">
                Preview ({parsedData.questions.length} questions found)
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {parsedData.questions.map((q, index) => (
                  <div
                    key={index}
                    className="p-3 bg-navy-900 rounded-lg border border-navy-700"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-accent-gold font-medium text-sm shrink-0">{q.label}:</span>
                      <span className="text-content-inverse text-sm">{q.text}</span>
                    </div>
                    {q.answer && (
                      <div className="flex items-start gap-2 mt-2 pt-2 border-t border-navy-700">
                        <CheckCircle size={14} className="text-status-success shrink-0 mt-0.5" />
                        <span className="text-status-success text-xs line-clamp-2">{q.answer}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-navy-700">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-content-muted hover:text-content-inverse rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={isImporting || parsedData.questions.length === 0}
            className="px-4 py-2 bg-accent-blue text-white rounded-lg font-medium hover:bg-accent-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isImporting ? 'Importing...' : `Import ${parsedData.questions.length} Questions`}
          </button>
        </div>
      </div>
    </div>
  );
}
