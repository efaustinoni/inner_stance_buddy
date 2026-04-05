import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WeekSelector } from './WeekSelector';
import type { ExerciseQuarter } from '../../lib/exerciseService';

const quarters: ExerciseQuarter[] = [
  { id: 'q1', user_id: 'u1', label: 'Q1 2026', created_at: '', updated_at: '' },
  { id: 'q2', user_id: 'u1', label: 'Q2 2026', created_at: '', updated_at: '' },
];

describe('WeekSelector', () => {
  it('returns null when no quarters and no unassigned', () => {
    const { container } = render(
      <WeekSelector
        quarters={[]}
        hasUnassigned={false}
        activeQuarterId={null}
        onQuarterChange={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders All button', () => {
    render(
      <WeekSelector
        quarters={quarters}
        hasUnassigned={false}
        activeQuarterId={null}
        onQuarterChange={vi.fn()}
      />
    );
    expect(screen.getByText('All')).toBeInTheDocument();
  });

  it('renders quarter labels', () => {
    render(
      <WeekSelector
        quarters={quarters}
        hasUnassigned={false}
        activeQuarterId={null}
        onQuarterChange={vi.fn()}
      />
    );
    expect(screen.getByText('Q1 2026')).toBeInTheDocument();
    expect(screen.getByText('Q2 2026')).toBeInTheDocument();
  });

  it('renders Unassigned badge when hasUnassigned=true', () => {
    render(
      <WeekSelector
        quarters={[]}
        hasUnassigned={true}
        activeQuarterId={null}
        onQuarterChange={vi.fn()}
      />
    );
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
  });

  it('calls onQuarterChange(null) when All clicked', () => {
    const onChange = vi.fn();
    render(
      <WeekSelector
        quarters={quarters}
        hasUnassigned={false}
        activeQuarterId="q1"
        onQuarterChange={onChange}
      />
    );
    fireEvent.click(screen.getByText('All'));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('calls onQuarterChange with quarter id when badge clicked', () => {
    const onChange = vi.fn();
    render(
      <WeekSelector
        quarters={quarters}
        hasUnassigned={false}
        activeQuarterId={null}
        onQuarterChange={onChange}
      />
    );
    fireEvent.click(screen.getByText('Q1 2026'));
    expect(onChange).toHaveBeenCalledWith('q1');
  });

  it('calls onQuarterChange(null) when active quarter badge is clicked again (toggle off)', () => {
    const onChange = vi.fn();
    render(
      <WeekSelector
        quarters={quarters}
        hasUnassigned={false}
        activeQuarterId="q1"
        onQuarterChange={onChange}
      />
    );
    fireEvent.click(screen.getByText('Q1 2026'));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
