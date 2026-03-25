// Created: 2026-02-13
// Last Updated: 2026-02-13

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Settings, Check } from 'lucide-react';
import type { ExerciseWeek } from '../../lib/exerciseService';

interface WeekSelectorProps {
  weeks: ExerciseWeek[];
  selectedWeekId: string | null;
  onSelectWeek: (weekId: string) => void;
  onAddWeek: () => void;
  onEditWeek: (weekId: string) => void;
}

export function WeekSelector({
  weeks,
  selectedWeekId,
  onSelectWeek,
  onAddWeek,
  onEditWeek
}: WeekSelectorProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedWeek = weeks.find(w => w.id === selectedWeekId);

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
    <div className="flex items-center justify-between gap-4 mb-6">
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-3 px-4 py-2.5 bg-navy-800 rounded-xl hover:bg-navy-700 transition-colors min-w-[200px]"
        >
          <div className="flex-1 text-left">
            <div className="text-xs text-content-muted uppercase tracking-wide">Current Week</div>
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
              {weeks.map((week) => (
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
                  <div className="flex-1">
                    <div className="font-medium">Week {week.week_number}</div>
                    <div className="text-sm text-content-muted">{week.topic}</div>
                  </div>
                  {selectedWeekId === week.id && (
                    <Check size={18} className="text-accent-gold" />
                  )}
                </button>
              ))}
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
  );
}
