import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { supabase } from '../lib/supabase';
import ProfilePage from './ProfilePage';

vi.mock('../lib/supabase');
vi.mock('./TimezonePicker', () => ({ default: () => <div data-testid="tz-picker" /> }));
vi.mock('./SecurityQuestionModal', () => ({ default: () => null }));
vi.mock('./profile/DeleteConfirmModal', () => ({ default: () => null }));
vi.mock('./profile/DeletionScheduledView', () => ({ default: () => null }));

describe('ProfilePage', () => {
  const onBack = vi.fn();

  it('shows loading spinner initially', () => {
    render(<ProfilePage onBack={onBack} />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows unauthenticated message when no user', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: null }, error: null });
    render(<ProfilePage onBack={onBack} />);
    // Component sets error to 'Not authenticated' when user is null
    await waitFor(() => expect(screen.getByText(/Not authenticated/i)).toBeInTheDocument());
  });

  it('renders profile form when user is loaded', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'u1', email: 'alice@test.com' } as never },
      error: null,
    });
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: 'u1',
          display_name: 'Alice',
          timezone: 'UTC',
          security_question: 'Pet name?',
          deleted_at: null,
        },
        error: null,
      }),
    } as never);

    render(<ProfilePage onBack={onBack} />);
    await waitFor(() => expect(screen.getByDisplayValue('Alice')).toBeInTheDocument());
  });

  it('renders timezone picker', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'u1', email: 'alice@test.com' } as never },
      error: null,
    });
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi
        .fn()
        .mockResolvedValue({
          data: {
            id: 'u1',
            display_name: 'Alice',
            timezone: 'UTC',
            security_question: '',
            deleted_at: null,
          },
          error: null,
        }),
    } as never);

    render(<ProfilePage onBack={onBack} />);
    await waitFor(() => expect(screen.getByTestId('tz-picker')).toBeInTheDocument());
  });
});
