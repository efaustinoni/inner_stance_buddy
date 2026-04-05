// Created: 2026-04-02
// Last Updated: 2026-04-02

import { useState, useEffect } from 'react';
import { X, AlertCircle, Pencil, Trash2, Check, Plus } from 'lucide-react';
import type { ExerciseQuarter } from '../../lib/exerciseService';

interface QuarterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (label: string, quarterId?: string) => Promise<void>;
  onDelete: (quarterId: string) => Promise<void>;
  quarters: ExerciseQuarter[];
}

export function QuarterModal({ isOpen, onClose, onSave, onDelete, quarters }: QuarterModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setEditingId(null);
      setEditingLabel('');
      setNewLabel('');
    }
  }, [isOpen]);

  const existingLabels = quarters.map((q) => q.label);

  const isDuplicateEdit =
    editingLabel.trim().length > 0 &&
    existingLabels
      .filter((l) => l !== quarters.find((q) => q.id === editingId)?.label)
      .some((l) => l.toLowerCase() === editingLabel.trim().toLowerCase());

  const isDuplicateNew =
    newLabel.trim().length > 0 &&
    existingLabels.some((l) => l.toLowerCase() === newLabel.trim().toLowerCase());

  const handleStartEdit = (q: ExerciseQuarter) => {
    setEditingId(q.id);
    setEditingLabel(q.label);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editingLabel.trim() || isDuplicateEdit) return;
    setSavingId(id);
    await onSave(editingLabel.trim(), id);
    setSavingId(null);
    setEditingId(null);
    setEditingLabel('');
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await onDelete(id);
    setDeletingId(null);
  };

  const handleAdd = async () => {
    if (!newLabel.trim() || isDuplicateNew) return;
    setIsAdding(true);
    await onSave(newLabel.trim());
    setIsAdding(false);
    setNewLabel('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-navy-800 rounded-xl shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-navy-700">
          <h2 className="text-lg font-semibold text-content-inverse">Manage Quarters</h2>
          <button
            onClick={onClose}
            className="p-1 text-content-muted hover:text-content-inverse rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
          {quarters.length === 0 && (
            <p className="text-sm text-content-muted text-center py-4">
              No quarters yet. Add one below.
            </p>
          )}
          {quarters.map((q) => (
            <div key={q.id} className="flex items-center gap-2 p-2 bg-navy-900 rounded-lg">
              {editingId === q.id ? (
                <>
                  <input
                    type="text"
                    value={editingLabel}
                    onChange={(e) => setEditingLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit(q.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    className="flex-1 px-2 py-1 bg-navy-800 border border-accent-blue rounded text-content-inverse text-sm focus:outline-none"
                    autoFocus
                  />
                  {isDuplicateEdit && (
                    <AlertCircle
                      size={14}
                      className="text-status-error shrink-0"
                      aria-label="Label already exists"
                    />
                  )}
                  <button
                    onClick={() => handleSaveEdit(q.id)}
                    disabled={!editingLabel.trim() || isDuplicateEdit || savingId === q.id}
                    className="p-1.5 text-status-success hover:bg-status-success/10 rounded transition-colors disabled:opacity-40"
                    title="Save"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-1.5 text-content-muted hover:text-content-inverse rounded transition-colors"
                    title="Cancel"
                  >
                    <X size={16} />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-content-inverse">{q.label}</span>
                  <button
                    onClick={() => handleStartEdit(q)}
                    className="p-1.5 text-content-muted hover:text-accent-blue rounded transition-colors"
                    title="Rename"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(q.id)}
                    disabled={deletingId === q.id}
                    className="p-1.5 text-content-muted hover:text-status-error rounded transition-colors disabled:opacity-40"
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-navy-700 space-y-2">
          <label className="block text-xs font-medium text-content-muted">Add new quarter</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="e.g. 2026-Q2, Q2 - Effectiveness"
              className="flex-1 px-3 py-2 bg-navy-900 border border-navy-600 rounded-lg text-content-inverse placeholder-content-muted focus:outline-none focus:border-accent-blue text-sm"
            />
            <button
              onClick={handleAdd}
              disabled={!newLabel.trim() || isDuplicateNew || isAdding}
              className="flex items-center gap-1.5 px-3 py-2 bg-accent-blue text-white rounded-lg text-sm font-medium hover:bg-accent-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={16} />
              Add
            </button>
          </div>
          {isDuplicateNew && (
            <div className="flex items-center gap-1.5">
              <AlertCircle size={13} className="text-status-error" />
              <p className="text-xs text-status-error">A quarter with this name already exists.</p>
            </div>
          )}
        </div>

        <div className="flex justify-end p-4 border-t border-navy-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-navy-700 text-content-inverse rounded-lg font-medium hover:bg-navy-600 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
