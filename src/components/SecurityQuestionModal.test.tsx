import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SecurityQuestionModal from './SecurityQuestionModal';

vi.mock('../lib/supabase');
vi.mock('../lib/crypto');

const defaultProps = {
  isOpen: true,
  currentQuestion: 'What is your pet name?',
  onClose: vi.fn(),
  onSuccess: vi.fn(),
};

describe('SecurityQuestionModal', () => {
  it('returns null when not open', () => {
    const { container } = render(<SecurityQuestionModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the modal title', () => {
    render(<SecurityQuestionModal {...defaultProps} />);
    expect(screen.getByText('Manage Security Question')).toBeInTheDocument();
  });

  it('renders the security question dropdown', () => {
    render(<SecurityQuestionModal {...defaultProps} />);
    expect(screen.getByText(/Select a security question/i)).toBeInTheDocument();
  });

  it('renders current password field', () => {
    render(<SecurityQuestionModal {...defaultProps} />);
    // Placeholder is "Enter your password to verify"
    expect(screen.getByPlaceholderText(/Enter your password to verify/i)).toBeInTheDocument();
  });

  it('shows validation error on empty form submit', async () => {
    render(<SecurityQuestionModal {...defaultProps} />);
    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() =>
      expect(screen.getByText(/Please enter your current password/i)).toBeInTheDocument()
    );
  });

  it('shows mismatch error when answers differ', async () => {
    render(<SecurityQuestionModal {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText(/Enter your password to verify/i), {
      target: { value: 'password' },
    });
    // Select a question
    const select = document.querySelector('select') as HTMLSelectElement;
    if (select) {
      fireEvent.change(select, { target: { value: 'What city were you born in?' } });
    }
    const answerInputs = screen.getAllByPlaceholderText(/answer/i);
    if (answerInputs.length >= 2) {
      fireEvent.change(answerInputs[0], { target: { value: 'London' } });
      fireEvent.change(answerInputs[1], { target: { value: 'Paris' } });
    }
    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() => expect(screen.getByText(/do not match/i)).toBeInTheDocument());
  });

  it('calls onClose when close button clicked', () => {
    render(<SecurityQuestionModal {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Close modal'));
    expect(defaultProps.onClose).toHaveBeenCalledOnce();
  });

  it('shows no question selected error when question not selected', async () => {
    render(<SecurityQuestionModal {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText(/Enter your password to verify/i), {
      target: { value: 'password123' },
    });
    fireEvent.submit(document.querySelector('form')!);
    await waitFor(() =>
      expect(screen.getByText(/Please select a security question/i)).toBeInTheDocument()
    );
  });
});
