// Created: 2026-02-13
// Last Updated: 2026-04-03 07:43 UTC (simplified to controlled quarter badge filter only)

import type { ExerciseQuarter } from '../../lib/exerciseService';

interface WeekSelectorProps {
  quarters: ExerciseQuarter[];
  hasUnassigned: boolean;
  activeQuarterId: string | 'unassigned' | null;
  onQuarterChange: (qId: string | 'unassigned' | null) => void;
}

export function WeekSelector({ quarters, hasUnassigned, activeQuarterId, onQuarterChange }: WeekSelectorProps) {
  if (quarters.length === 0 && !hasUnassigned) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onQuarterChange(null)}
        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
          activeQuarterId === null
            ? 'bg-accent-blue text-white'
            : 'bg-navy-700 text-content-muted hover:text-content-inverse'
        }`}
      >
        All
      </button>
      {quarters.map(q => (
        <button
          key={q.id}
          onClick={() => onQuarterChange(activeQuarterId === q.id ? null : q.id)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            activeQuarterId === q.id
              ? 'bg-accent-gold text-navy-900'
              : 'bg-navy-700 text-content-muted hover:text-content-inverse'
          }`}
        >
          {q.label}
        </button>
      ))}
      {hasUnassigned && (
        <button
          onClick={() => onQuarterChange(activeQuarterId === 'unassigned' ? null : 'unassigned')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            activeQuarterId === 'unassigned'
              ? 'bg-navy-600 text-content-inverse'
              : 'bg-navy-700 text-content-muted hover:text-content-inverse'
          }`}
        >
          Unassigned
        </button>
      )}
    </div>
  );
}
