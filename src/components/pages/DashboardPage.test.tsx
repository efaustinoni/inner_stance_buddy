import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { fetchDashboardData } from '../../lib/services/orchestrators/dashboardOrchestrator';
import { DashboardPage } from './DashboardPage';

vi.mock('../../lib/services/orchestrators/dashboardOrchestrator');
vi.mock('../../lib/services/quarterService');

const onNavigate = vi.fn();

describe('DashboardPage', () => {
  it('shows loading spinner initially', () => {
    render(<DashboardPage onNavigate={onNavigate} />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders dashboard title after data loads', async () => {
    render(<DashboardPage onNavigate={onNavigate} />);
    await waitFor(() => expect(screen.getByText('Dashboard')).toBeInTheDocument());
  });

  it('renders Manage Weeks button', async () => {
    render(<DashboardPage onNavigate={onNavigate} />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Manage Weeks/i })).toBeInTheDocument()
    );
  });

  it('calls onNavigate to /manage when Manage Weeks clicked', async () => {
    render(<DashboardPage onNavigate={onNavigate} />);
    await waitFor(() => screen.getByRole('button', { name: /Manage Weeks/i }));
    fireEvent.click(screen.getByRole('button', { name: /Manage Weeks/i }));
    expect(onNavigate).toHaveBeenCalledWith('/manage');
  });

  it('shows zero stats when no data', async () => {
    render(<DashboardPage onNavigate={onNavigate} />);
    // Three stat cards all show '0' — use getAllByText
    await waitFor(() => expect(screen.getAllByText('0').length).toBeGreaterThan(0));
  });

  it('renders questions when data loaded', async () => {
    vi.mocked(fetchDashboardData).mockResolvedValue({
      weeks: [
        {
          id: 'w1',
          user_id: 'u1',
          week_number: 1,
          title: 'Week 1',
          topic: 'Focus',
          created_at: '',
          updated_at: '',
        },
      ],
      questions: [
        {
          id: 'q1',
          question_label: 'Reflectie 1',
          question_text: 'What did you learn?',
          week_id: 'w1',
          week_number: 1,
          week_topic: 'Focus',
          quarter_id: null,
          quarter_label: null,
        },
      ],
    });

    render(<DashboardPage onNavigate={onNavigate} />);
    await waitFor(() => expect(screen.getByText('What did you learn?')).toBeInTheDocument());
  });

  it('renders search input', async () => {
    render(<DashboardPage onNavigate={onNavigate} />);
    await waitFor(() => expect(screen.getByPlaceholderText(/Search/i)).toBeInTheDocument());
  });

  it('filters questions by search query', async () => {
    vi.mocked(fetchDashboardData).mockResolvedValue({
      weeks: [],
      questions: [
        {
          id: 'q1',
          question_label: 'Q1',
          question_text: 'Learn something',
          week_id: 'w1',
          week_number: 1,
          week_topic: 'Focus',
          quarter_id: null,
          quarter_label: null,
        },
        {
          id: 'q2',
          question_label: 'Q2',
          question_text: 'Do something else',
          week_id: 'w1',
          week_number: 1,
          week_topic: 'Focus',
          quarter_id: null,
          quarter_label: null,
        },
      ],
    });
    render(<DashboardPage onNavigate={onNavigate} />);
    await waitFor(() => screen.getByPlaceholderText(/Search/i));
    fireEvent.change(screen.getByPlaceholderText(/Search/i), { target: { value: 'Learn' } });
    expect(screen.getByText('Learn something')).toBeInTheDocument();
    expect(screen.queryByText('Do something else')).not.toBeInTheDocument();
  });
});
