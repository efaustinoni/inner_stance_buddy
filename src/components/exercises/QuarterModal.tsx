// Created: 2026-04-02

import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import type { ExerciseQuarter } from '../../lib/exerciseService';

interface QuarterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (label: string) => Promise<void>;
  onDelete?: () => Promise<void>;
  initialData?: ExerciseQuarter;
  existingLabels: string[];
}

export function QuarterModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
  existingLabels,
}: QuarterModalProps) {
  const [label, setLabel] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLabel(initialData?.label || '');
    }
  }, [isOpen, initialData]);

  const isEditMode = !!initialData;
  const trimmed = label.trim();
  const isDuplicate =
    trimmed.length > 0 &&
    existingLabels
      .filter(l => l !== initialData?.label)
      .some(l => l.toLowerCase() === trimmed.toLowerCase());

  const canSave = trimmed.length > 0 && !isDuplicate;

  const handleSave = async () => {
    if (!canSave) return;
    setIsSaving(true);
    await onSave(trimmed);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-navy-800 rounded-xl shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-navy-700">
          <h2 className="text-lg font-semibold text-content-inverse">
            {isEditMode ? 'Edit Quarter' : 'Add New Quarter'}
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
              Quarter Label
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="e.g. 2026-Q2, Q2 - Effectiveness"
              className="w-full px-3 py-2 bg-navy-900 border border-navy-600 rounded-lg text-content-inverse placeholder-content-muted focus:outline-none focus:border-accent-blue"
              autoFocus
            />
            {isDuplicate && (
              <div className="flex items-center gap-2 mt-2">
                <AlertCircle size={14} className="text-status-error" />
                <p className="text-xs text-status-error">A quarter with this name already exists.</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between p-4 border-t border-navy-700">
          {isEditMode && onDelete ? (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 text-status-error hover:bg-status-error/10 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete Quarter'}
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
              disabled={isSaving || !canSave}
              className="px-4 py-2 bg-accent-blue text-white rounded-lg font-medium hover:bg-accent-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Quarter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
