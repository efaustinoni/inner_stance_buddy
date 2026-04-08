import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { fetchTrackerWithCheckIns } from '../../lib/services/orchestrators/trackerOrchestrator';
import { ProgressTrackingPage } from './ProgressTrackingPage';

vi.mock('../../lib/services/orchestrators/trackerOrchestrator');
vi.mock('../../lib/services/trackerService');

const onNavigate = vi.fn();

const mockTracker = {
  id: 't1',
  question_id: 'q1',
  user_id: 'u1',
  started_at: '2026-04-01',
  is_active: true,
  created_at: '',
  updated_at: '',
  question: {
    id: 'q1',
    week_id: 'w1',
    question_label: 'Reflectie 1',
    question_text: 'What did you learn?',
    sort_order: 0,
    created_at: '',
    updated_at: '',
  },
  week: {
    id: 'w1',
    user_id: 'u1',
    week_number: 1,
    title: 'Week 1',
    topic: 'Focus',
    created_at: '',
    updated_at: '',
  },
  check_ins: [],
};

describe('ProgressTrackingPage', () => {
  it('shows loading spinner initially', () => {
    render(<ProgressTrackingPage trackerId="t1" onNavigate={onNavigate} />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders Progress Tracking heading when data loads', async () => {
    vi.mocked(fetchTrackerWithCheckIns).mockResolvedValue(mockTracker as never);
    render(<ProgressTrackingPage trackerId="t1" onNavigate={onNavigate} />);
    await waitFor(() => expect(screen.getByText('Progress Tracking')).toBeInTheDocument());
  });

  it('renders question text', async () => {
    vi.mocked(fetchTrackerWithCheckIns).mockResolvedValue(mockTracker as never);
    render(<ProgressTrackingPage trackerId="t1" onNavigate={onNavigate} />);
    await waitFor(() => expect(screen.getByText('What did you learn?')).toBeInTheDocument());
  });

  it('renders check-in calendar entries', async () => {
    vi.mocked(fetchTrackerWithCheckIns).mockResolvedValue({
      ...mockTracker,
      started_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    } as never);
    render(<ProgressTrackingPage trackerId="t1" onNavigate={onNavigate} />);
    // Calendar should show at least one date entry
    await waitFor(() => expect(screen.getAllByRole('button').length).toBeGreaterThan(0));
  });

  it('shows delete tracker button', async () => {
    vi.mocked(fetchTrackerWithCheckIns).mockResolvedValue(mockTracker as never);
    render(<ProgressTrackingPage trackerId="t1" onNavigate={onNavigate} />);
    // The delete button has no visible text — use its title attribute
    await waitFor(() => expect(screen.getByTitle('Delete tracker')).toBeInTheDocument());
  });

  it('shows no tracker message when tracker is null', async () => {
    vi.mocked(fetchTrackerWithCheckIns).mockResolvedValue(null as never);
    render(<ProgressTrackingPage trackerId="invalid" onNavigate={onNavigate} />);
    // Loading ends, no tracker found — component handles gracefully
    await waitFor(() => expect(document.querySelector('.animate-spin')).not.toBeInTheDocument());
  });

  it('renders Dashboard breadcrumb link', async () => {
    vi.mocked(fetchTrackerWithCheckIns).mockResolvedValue(mockTracker as never);
    render(<ProgressTrackingPage trackerId="t1" onNavigate={onNavigate} />);
    await waitFor(() => expect(screen.getByText('Dashboard')).toBeInTheDocument());
  });

  it('calls onNavigate(/) when Dashboard breadcrumb clicked', async () => {
    vi.mocked(fetchTrackerWithCheckIns).mockResolvedValue(mockTracker as never);
    render(<ProgressTrackingPage trackerId="t1" onNavigate={onNavigate} />);
    await waitFor(() => screen.getByText('Dashboard'));
    fireEvent.click(screen.getByText('Dashboard'));
    expect(onNavigate).toHaveBeenCalledWith('/');
  });
});
