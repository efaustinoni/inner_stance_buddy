import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { fetchUserWeeks } from '../../lib/services/weekService';
import { fetchUserQuarters } from '../../lib/services/quarterService';
import { PowerPage } from './PowerPage';

vi.mock('../../lib/services/weekService');
vi.mock('../../lib/services/quarterService');
vi.mock('../../lib/services/questionService');
vi.mock('../../lib/services/answerService');
vi.mock('../../lib/services/trackerService');
vi.mock('../../services/orchestrators/copyWeekOrchestrator');

const onNavigate = vi.fn();

describe('PowerPage', () => {
  it('shows loading spinner initially', () => {
    render(<PowerPage onNavigate={onNavigate} />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows empty state heading when no weeks', async () => {
    render(<PowerPage onNavigate={onNavigate} />);
    await waitFor(() => expect(screen.getByText(/Manage Exercise Weeks/i)).toBeInTheDocument());
  });

  it('renders Add New Week button', async () => {
    render(<PowerPage onNavigate={onNavigate} />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Add New Week/i })).toBeInTheDocument()
    );
  });

  it('opens WeekModal when Add New Week clicked', async () => {
    render(<PowerPage onNavigate={onNavigate} />);
    await waitFor(() => screen.getByRole('button', { name: /Add New Week/i }));
    fireEvent.click(screen.getByRole('button', { name: /Add New Week/i }));
    await waitFor(() => expect(screen.getByRole('spinbutton')).toBeInTheDocument());
  });

  it('renders weeks when data loaded', async () => {
    vi.mocked(fetchUserWeeks).mockResolvedValue([
      {
        id: 'w1',
        user_id: 'u1',
        week_number: 1,
        title: 'Exercise',
        topic: 'Focus',
        created_at: '',
        updated_at: '',
      },
    ]);
    render(<PowerPage onNavigate={onNavigate} />);
    await waitFor(() => expect(screen.getByText(/Focus/i)).toBeInTheDocument());
  });

  it('renders quarter filter badges when quarters exist', async () => {
    vi.mocked(fetchUserQuarters).mockResolvedValue([
      { id: 'q1', user_id: 'u1', label: 'Q1 2026', created_at: '', updated_at: '' },
    ]);
    render(<PowerPage onNavigate={onNavigate} />);
    await waitFor(() => expect(screen.getByText('Q1 2026')).toBeInTheDocument());
  });

  it('renders Manage Quarters button', async () => {
    render(<PowerPage onNavigate={onNavigate} />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Manage Quarters/i })).toBeInTheDocument()
    );
  });
});
