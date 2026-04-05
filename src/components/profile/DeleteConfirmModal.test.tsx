import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DeleteConfirmModal from './DeleteConfirmModal';

const defaultProps = {
  isOpen: true,
  isDeleting: false,
  confirmText: '',
  onConfirmTextChange: vi.fn(),
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
};

describe('DeleteConfirmModal', () => {
  it('returns null when isOpen is false', () => {
    const { container } = render(<DeleteConfirmModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the modal when isOpen is true', () => {
    render(<DeleteConfirmModal {...defaultProps} />);
    // Both the h3 heading and the confirm button contain 'Delete Account'
    expect(screen.getAllByText(/Delete Account/i).length).toBeGreaterThan(0);
  });

  it('shows the DELETE instruction', () => {
    render(<DeleteConfirmModal {...defaultProps} />);
    expect(screen.getByText(/Type/i)).toBeInTheDocument();
  });

  it('confirm button is disabled when confirmText is not DELETE', () => {
    render(<DeleteConfirmModal {...defaultProps} confirmText="wrong" />);
    const confirmBtn = screen.getByRole('button', { name: /Delete Account/i });
    expect(confirmBtn).toBeDisabled();
  });

  it('confirm button is enabled when confirmText is DELETE', () => {
    render(<DeleteConfirmModal {...defaultProps} confirmText="DELETE" />);
    const confirmBtn = screen.getByRole('button', { name: /Delete Account/i });
    expect(confirmBtn).not.toBeDisabled();
  });

  it('calls onConfirm when confirm button clicked with DELETE text', () => {
    render(<DeleteConfirmModal {...defaultProps} confirmText="DELETE" />);
    fireEvent.click(screen.getByRole('button', { name: /Delete Account/i }));
    expect(defaultProps.onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onCancel when cancel clicked', () => {
    render(<DeleteConfirmModal {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(defaultProps.onCancel).toHaveBeenCalledOnce();
  });

  it('calls onConfirmTextChange when input changes', () => {
    render(<DeleteConfirmModal {...defaultProps} />);
    const input = screen.getByPlaceholderText(/Type DELETE/i);
    fireEvent.change(input, { target: { value: 'DEL' } });
    expect(defaultProps.onConfirmTextChange).toHaveBeenCalledWith('DEL');
  });

  it('shows loading state when isDeleting', () => {
    render(<DeleteConfirmModal {...defaultProps} confirmText="DELETE" isDeleting={true} />);
    expect(screen.getByText(/Deleting.../i)).toBeInTheDocument();
  });
});
