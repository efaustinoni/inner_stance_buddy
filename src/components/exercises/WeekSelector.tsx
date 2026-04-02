// Created: 2026-02-13
// Last Updated: 2026-04-02 17:28 UTC (show quarter label in dropdown)

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Settings, Check } from 'lucide-react';
import type { ExerciseWeek, ExerciseQuarter } from '../../lib/exerciseService';

interface WeekSelectorProps {
  weeks: ExerciseWeek[];
  quarters: ExerciseQuarter[];
  selectedWeekId: string | null;
  onSelectWeek: (weekId: string) => void;
  onAddWeek: () => void;
  onEditWeek: (weekId: string) => void;
}

export function WeekSelector({
  weeks,
  quarters,
  selectedWeekId,
  onSelectWeek,
  onAddWeek,
  onEditWeek
}: WeekSelectorProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeQuarterId, setActiveQuarterId] = useState<string | 'unassigned' | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedWeek = weeks.find(w => w.id === selectedWeekId);

  const filteredWeeks = activeQuarterId === 'unassigned'
    ? weeks.filter(w => !w.quarter_id)
    : activeQuarterId
    ? weeks.filter(w => w.quarter_id === activeQuarterId)
    : weeks;

  const hasUnassigned = weeks.some(w => !w.quarter_id);
  const hasQuarters = quarters.length > 0;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (weeks.length === 0) {
    return (
      <div className="bg-navy-800 rounded-xl p-8 text-center">
        <h2 className="text-xl font-semibold text-content-inverse mb-2">Welcome to Your Exercise Journal</h2>
        <p className="text-content-muted mb-6">Start by adding your first week of exercises.</p>
        <button
          onClick={onAddWeek}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-blue text-white rounded-lg font-medium hover:bg-accent-blue/90 transition-colors"
        >
          <Plus size={18} />
          Add Your First Week
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 mb-6">
      {/* Quarter filter badges */}
      {(hasQuarters || hasUnassigned) && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveQuarterId(null)}
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
              onClick={() => setActiveQuarterId(activeQuarterId === q.id ? null : q.id)}
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
              onClick={() => setActiveQuarterId(activeQuarterId === 'unassigned' ? null : 'unassigned')}
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
      )}

      <div className="flex items-center justify-between gap-4">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 px-4 py-2.5 bg-navy-800 rounded-xl hover:bg-navy-700 transition-colors min-w-[200px]"
          >
            <div className="flex-1 text-left">
              <div className="text-xs text-content-muted uppercase tracking-wide">
                {selectedWeek?.quarter_label ?? 'Unassigned'}
              </div>
              <div className="text-lg font-semibold text-accent-gold">
                Week {selectedWeek?.week_number}: {selectedWeek?.topic}
              </div>
            </div>
            <ChevronDown
              size={20}
              className={`text-content-muted transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-navy-800 rounded-xl shadow-xl border border-navy-700 overflow-hidden z-20">
              <div className="max-h-64 overflow-y-auto">
                {filteredWeeks.map((week) => (
                  <button
                    key={week.id}
                    onClick={() => {
                      onSelectWeek(week.id);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      selectedWeekId === week.id
                        ? 'bg-accent-blue/20 text-accent-gold'
                        : 'text-content-inverse hover:bg-navy-700'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">Week {week.week_number}: {week.topic}</div>
                      <div className="text-xs text-content-muted mt-0.5">
                        {week.quarter_label ? (
                          <span className="text-accent-gold/80">{week.quarter_label}</span>
                        ) : (
                          <span className="text-content-muted/60">No quarter</span>
                        )}
                      </div>
                    </div>
                    {selectedWeekId === week.id && (
                      <Check size={18} className="text-accent-gold" />
                    )}
                  </button>
                ))}
                {filteredWeeks.length === 0 && (
                  <p className="px-4 py-3 text-sm text-content-muted">No weeks in this quarter.</p>
                )}
              </div>
              <div className="border-t border-navy-700 p-2">
                <button
                  onClick={() => {
                    onAddWeek();
                    setIsDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-accent-blue hover:bg-navy-700 rounded-lg transition-colors"
                >
                  <Plus size={18} />
                  <span className="font-medium">Add New Week</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {selectedWeek && (
          <button
            onClick={() => onEditWeek(selectedWeek.id)}
            className="p-2.5 text-content-muted hover:text-content-inverse hover:bg-navy-800 rounded-lg transition-colors"
            title="Edit week settings"
          >
            <Settings size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
