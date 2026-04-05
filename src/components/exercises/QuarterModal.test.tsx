import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QuarterModal } from './QuarterModal';
import type { ExerciseQuarter } from '../../lib/exerciseService';

const quarters: ExerciseQuarter[] = [
  { id: 'q1', user_id: 'u1', label: 'Q1 2026', created_at: '', updated_at: '' },
  { id: 'q2', user_id: 'u1', label: 'Q2 2026', created_at: '', updated_at: '' },
];

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onSave: vi.fn().mockResolvedValue(undefined),
  onDelete: vi.fn().mockResolvedValue(undefined),
  quarters,
};

describe('QuarterModal', () => {
  it('returns null when not open', () => {
    const { container } = render(<QuarterModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders Manage Quarters title', () => {
    render(<QuarterModal {...defaultProps} />);
    expect(screen.getByText('Manage Quarters')).toBeInTheDocument();
  });

  it('renders existing quarters', () => {
    render(<QuarterModal {...defaultProps} />);
    expect(screen.getByText('Q1 2026')).toBeInTheDocument();
    expect(screen.getByText('Q2 2026')).toBeInTheDocument();
  });

  it('shows empty message when no quarters', () => {
    render(<QuarterModal {...defaultProps} quarters={[]} />);
    expect(screen.getByText(/No quarters yet/i)).toBeInTheDocument();
  });

  it('calls onSave when new quarter is added', async () => {
    render(<QuarterModal {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText(/e.g. 2026-Q2/i), {
      target: { value: 'Q3 2026' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Add/i }));
    await waitFor(() => expect(defaultProps.onSave).toHaveBeenCalledWith('Q3 2026'));
  });

  it('shows duplicate error when same quarter name entered', () => {
    render(<QuarterModal {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText(/e.g. 2026-Q2/i), {
      target: { value: 'Q1 2026' },
    });
    expect(screen.getByText(/already exists/i)).toBeInTheDocument();
  });

  it('calls onClose when Done button clicked', () => {
    render(<QuarterModal {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /Done/i }));
    expect(defaultProps.onClose).toHaveBeenCalledOnce();
  });

  it('calls onDelete when delete button clicked for a quarter', async () => {
    render(<QuarterModal {...defaultProps} />);
    const deleteBtns = screen.getAllByTitle('Delete');
    fireEvent.click(deleteBtns[0]);
    await waitFor(() => expect(defaultProps.onDelete).toHaveBeenCalledWith('q1'));
  });

  it('enters edit mode and saves renamed quarter', async () => {
    render(<QuarterModal {...defaultProps} />);
    const renameBtns = screen.getAllByTitle('Rename');
    fireEvent.click(renameBtns[0]);
    const input = screen.getByDisplayValue('Q1 2026');
    fireEvent.change(input, { target: { value: 'Updated Q1' } });
    fireEvent.click(screen.getByTitle('Save'));
    await waitFor(() => expect(defaultProps.onSave).toHaveBeenCalledWith('Updated Q1', 'q1'));
  });
});
