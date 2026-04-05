// Created: 2026-02-13
// Last Updated: 2026-02-13

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface QuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (label: string, text: string) => Promise<void>;
  initialData?: {
    question_label: string;
    question_text: string;
  };
}

export function QuestionModal({ isOpen, onClose, onSave, initialData }: QuestionModalProps) {
  const [label, setLabel] = useState(initialData?.question_label || '');
  const [text, setText] = useState(initialData?.question_text || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLabel(initialData?.question_label || '');
      setText(initialData?.question_text || '');
    }
  }, [isOpen, initialData]);

  const handleSave = async () => {
    if (!label.trim() || !text.trim()) return;
    setIsSaving(true);
    await onSave(label.trim(), text.trim());
    setIsSaving(false);
    onClose();
  };

  if (!isOpen) return null;

  const isEditMode = !!initialData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-navy-800 rounded-xl shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-navy-700">
          <h2 className="text-lg font-semibold text-content-inverse">
            {isEditMode ? 'Edit Question' : 'Add Question'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-content-muted hover:text-content-inverse rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-content-muted mb-1">
              Question Label
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Reflectie 1a, Actie 2"
              className="w-full px-3 py-2 bg-navy-900 border border-navy-600 rounded-lg text-content-inverse placeholder-content-muted focus:outline-none focus:border-accent-blue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-content-muted mb-1">
              Question Text
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter the full question text..."
              rows={4}
              className="w-full px-3 py-2 bg-navy-900 border border-navy-600 rounded-lg text-content-inverse placeholder-content-muted focus:outline-none focus:border-accent-blue resize-y"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-navy-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-content-muted hover:text-content-inverse rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !label.trim() || !text.trim()}
            className="px-4 py-2 bg-accent-blue text-white rounded-lg font-medium hover:bg-accent-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : isEditMode ? 'Save Changes' : 'Add Question'}
          </button>
        </div>
      </div>
    </div>
  );
}
