import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { supabase } from '../lib/supabase';
import WelcomePage from './WelcomePage';

vi.mock('../lib/supabase');
vi.mock('./AddToHomeScreenButton', () => ({ default: () => <div data-testid="aths-btn" /> }));

describe('WelcomePage', () => {
  it('shows loading spinner initially', () => {
    render(<WelcomePage />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders welcome content after user loads', async () => {
    render(<WelcomePage />);
    await waitFor(() => expect(screen.getByText(/Welcome/i)).toBeInTheDocument());
  });

  it('shows display name from profile', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'u1', email: 'alice@example.com' } as never },
      error: null,
    });
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { display_name: 'Alice' }, error: null }),
    } as never);

    render(<WelcomePage />);
    await waitFor(() => expect(screen.getByText(/Welcome, Alice!/i)).toBeInTheDocument());
  });

  it('renders Legal & Privacy links', async () => {
    render(<WelcomePage />);
    await waitFor(() => expect(screen.getByText('Terms of Service')).toBeInTheDocument());
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
  });

  it('renders AddToHomeScreen component', async () => {
    render(<WelcomePage />);
    await waitFor(() => expect(screen.getByTestId('aths-btn')).toBeInTheDocument());
  });

  it('renders Quick Actions section', async () => {
    render(<WelcomePage />);
    await waitFor(() => expect(screen.getByText(/Quick Actions/i)).toBeInTheDocument());
  });
});
