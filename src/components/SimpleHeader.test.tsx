import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { supabase } from '../lib/supabase';
import SimpleHeader from './SimpleHeader';

vi.mock('../lib/supabase');

describe('SimpleHeader', () => {
  it('renders nothing during loading (no user)', async () => {
    const { container } = render(<SimpleHeader />);
    // Loading state: null render
    expect(container.firstChild).toBeNull();
    // After load with null user: still null
    await waitFor(() => expect(container.firstChild).toBeNull());
  });

  it('renders app name when user is logged in', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'u1', email: 'user@test.com' } as never },
      error: null,
    });
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { display_name: 'Bob' }, error: null }),
    } as never);

    render(<SimpleHeader />);
    await waitFor(() => expect(screen.getByText('Your App Name')).toBeInTheDocument());
  });

  it('shows user display name in header', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'u1', email: 'user@test.com' } as never },
      error: null,
    });
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { display_name: 'Carol' }, error: null }),
    } as never);

    render(<SimpleHeader />);
    await waitFor(() => expect(screen.getByText('Carol')).toBeInTheDocument());
  });

  it('shows sign-out button when authenticated', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'u1', email: 'user@test.com' } as never },
      error: null,
    });
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    } as never);

    render(<SimpleHeader />);
    await waitFor(() => expect(screen.getByText('Sign out')).toBeInTheDocument());
  });
});
