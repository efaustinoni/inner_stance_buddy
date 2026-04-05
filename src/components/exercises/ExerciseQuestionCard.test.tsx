import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ExerciseQuestionCard } from './ExerciseQuestionCard';
import type { QuestionWithAnswer, ProgressTracker } from '../../lib/exerciseService';

const mockQuestion: QuestionWithAnswer = {
  id: 'q1',
  week_id: 'w1',
  question_label: 'Reflectie 1a',
  question_text: 'What did you learn this week?',
  sort_order: 0,
  created_at: '',
  updated_at: '',
};

const mockQuestionWithAnswer: QuestionWithAnswer = {
  ...mockQuestion,
  answer: {
    id: 'a1',
    question_id: 'q1',
    user_id: 'u1',
    answer_text: 'I learned a lot',
    created_at: '',
    updated_at: '',
  },
};

const mockTracker: ProgressTracker = {
  id: 't1',
  question_id: 'q1',
  user_id: 'u1',
  started_at: '2026-01-01',
  is_active: true,
  created_at: '',
  updated_at: '',
};

describe('ExerciseQuestionCard', () => {
  const defaultProps = {
    question: mockQuestion,
    tracker: null,
    onSaveAnswer: vi.fn().mockResolvedValue(true),
    onDeleteQuestion: vi.fn(),
    onStartTracking: vi.fn().mockResolvedValue(undefined),
    onViewProgress: vi.fn(),
  };

  it('renders the question label and text', () => {
    render(<ExerciseQuestionCard {...defaultProps} />);
    expect(screen.getByText('Reflectie 1a:')).toBeInTheDocument();
    expect(screen.getByText('What did you learn this week?')).toBeInTheDocument();
  });

  it('renders empty textarea when no answer', () => {
    render(<ExerciseQuestionCard {...defaultProps} />);
    expect(screen.getByPlaceholderText(/Type your answer/i)).toHaveValue('');
  });

  it('pre-fills textarea with existing answer', () => {
    render(<ExerciseQuestionCard {...defaultProps} question={mockQuestionWithAnswer} />);
    expect(screen.getByPlaceholderText(/Type your answer/i)).toHaveValue('I learned a lot');
  });

  it('shows save button when answer is changed', () => {
    render(<ExerciseQuestionCard {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText(/Type your answer/i), {
      target: { value: 'New answer' },
    });
    expect(screen.getByRole('button', { name: /Save/i })).toBeInTheDocument();
  });

  it('calls onSaveAnswer when save button clicked', async () => {
    render(<ExerciseQuestionCard {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText(/Type your answer/i), {
      target: { value: 'My answer' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Save/i }));
    await waitFor(() => expect(defaultProps.onSaveAnswer).toHaveBeenCalledWith('q1', 'My answer'));
  });

  it('shows Track Progress button when no tracker', () => {
    render(<ExerciseQuestionCard {...defaultProps} />);
    expect(screen.getByText('Track Progress')).toBeInTheDocument();
  });

  it('calls onStartTracking when Track Progress clicked', async () => {
    render(<ExerciseQuestionCard {...defaultProps} />);
    fireEvent.click(screen.getByText('Track Progress'));
    await waitFor(() => expect(defaultProps.onStartTracking).toHaveBeenCalledWith('q1'));
  });

  it('shows View Progress button when tracker exists', () => {
    render(<ExerciseQuestionCard {...defaultProps} tracker={mockTracker} />);
    expect(screen.getByText('View Progress')).toBeInTheDocument();
  });

  it('calls onViewProgress when View Progress clicked', () => {
    render(<ExerciseQuestionCard {...defaultProps} tracker={mockTracker} />);
    fireEvent.click(screen.getByText('View Progress'));
    expect(defaultProps.onViewProgress).toHaveBeenCalledWith('t1');
  });
});
