import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DeletionScheduledView from './DeletionScheduledView';

describe('DeletionScheduledView', () => {
  const onAcknowledge = vi.fn();

  it('renders the scheduled deletion date', () => {
    render(<DeletionScheduledView scheduledDate="2026-05-01" onAcknowledge={onAcknowledge} />);
    expect(screen.getByText('2026-05-01')).toBeInTheDocument();
  });

  it('renders the title', () => {
    render(<DeletionScheduledView scheduledDate="2026-05-01" onAcknowledge={onAcknowledge} />);
    expect(screen.getByText(/Account Deletion Scheduled/i)).toBeInTheDocument();
  });

  it('renders the acknowledge button', () => {
    render(<DeletionScheduledView scheduledDate="2026-05-01" onAcknowledge={onAcknowledge} />);
    expect(screen.getByRole('button', { name: /Acknowledge/i })).toBeInTheDocument();
  });

  it('calls onAcknowledge when button clicked', () => {
    render(<DeletionScheduledView scheduledDate="2026-05-01" onAcknowledge={onAcknowledge} />);
    fireEvent.click(screen.getByRole('button', { name: /Acknowledge/i }));
    expect(onAcknowledge).toHaveBeenCalledOnce();
  });

  it('shows hard delete date label', () => {
    render(<DeletionScheduledView scheduledDate="2026-05-01" onAcknowledge={onAcknowledge} />);
    expect(screen.getByText(/Hard Delete Date/i)).toBeInTheDocument();
  });
});
