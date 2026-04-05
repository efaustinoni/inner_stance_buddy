import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QuestionModal } from './QuestionModal';

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onSave: vi.fn().mockResolvedValue(undefined),
};

describe('QuestionModal', () => {
  it('returns null when not open', () => {
    const { container } = render(<QuestionModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders Add Question title by default', () => {
    render(<QuestionModal {...defaultProps} />);
    // Both h2 heading and submit button contain 'Add Question' — use heading role
    expect(screen.getByRole('heading', { name: 'Add Question' })).toBeInTheDocument();
  });

  it('renders Edit Question title when initialData provided', () => {
    render(
      <QuestionModal
        {...defaultProps}
        initialData={{ question_label: 'Reflectie 1', question_text: 'What did you learn?' }}
      />
    );
    expect(screen.getByText('Edit Question')).toBeInTheDocument();
  });

  it('pre-fills label and text from initialData', () => {
    render(
      <QuestionModal
        {...defaultProps}
        initialData={{ question_label: 'Actie 2', question_text: 'Take action' }}
      />
    );
    expect(screen.getByDisplayValue('Actie 2')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Take action')).toBeInTheDocument();
  });

  it('save button is disabled with empty inputs', () => {
    render(<QuestionModal {...defaultProps} />);
    expect(screen.getByRole('button', { name: /Add Question/i })).toBeDisabled();
  });

  it('save button enables when both fields filled', () => {
    render(<QuestionModal {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText(/e.g., Reflectie 1a/i), {
      target: { value: 'Q1' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Enter the full question/i), {
      target: { value: 'Text' },
    });
    expect(screen.getByRole('button', { name: 'Add Question' })).not.toBeDisabled();
  });

  it('calls onSave with trimmed values and closes', async () => {
    render(<QuestionModal {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText(/e.g., Reflectie 1a/i), {
      target: { value: ' MyLabel ' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Enter the full question/i), {
      target: { value: ' MyText ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add Question' }));
    await waitFor(() => expect(defaultProps.onSave).toHaveBeenCalledWith('MyLabel', 'MyText'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onClose when Cancel clicked', () => {
    render(<QuestionModal {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(defaultProps.onClose).toHaveBeenCalledOnce();
  });
});
