import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { supabase } from '../lib/supabase';
import AuthPage from './AuthPage';

vi.mock('../lib/supabase');
vi.mock('../lib/legalService');
vi.mock('../lib/crypto');
vi.mock('./AddToHomeScreenButton', () => ({ default: () => null }));
vi.mock('./TimezonePicker', () => ({
  default: ({ onChange }: { onChange: (v: string) => void }) => (
    <input data-testid="tz-picker" onChange={(e) => onChange(e.target.value)} />
  ),
}));

describe('AuthPage — sign-in mode (default)', () => {
  it('renders sign-in form', () => {
    render(<AuthPage />);
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
  });

  it('sign-in button is disabled with empty fields', () => {
    render(<AuthPage />);
    const btn = screen.getByRole('button', { name: /Sign In/i });
    expect(btn).toBeDisabled();
  });

  it('sign-in button enables when email and password entered', () => {
    render(<AuthPage />);
    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), {
      target: { value: 'user@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'pass123' } });
    expect(screen.getByRole('button', { name: /Sign In/i })).not.toBeDisabled();
  });

  it('calls supabase.auth.signInWithPassword on submit', async () => {
    render(<AuthPage />);
    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), {
      target: { value: 'user@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'pass123' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
    await waitFor(() =>
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'user@test.com',
        password: 'pass123',
      })
    );
  });

  it('shows error message on sign-in failure', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: Object.assign(new Error('invalid login credentials'), {
        name: 'AuthError',
        status: 400,
      }) as never,
    });
    render(<AuthPage />);
    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), {
      target: { value: 'user@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    await waitFor(() => expect(screen.getByText(/Invalid email or password/i)).toBeInTheDocument());
  });

  it('shows forgot password link', () => {
    render(<AuthPage />);
    expect(screen.getByText(/Forgot/i)).toBeInTheDocument();
  });
});

describe('AuthPage — sign-up mode', () => {
  // Mode-switch button text is 'Sign up' (lowercase) when in sign-in mode
  it('switches to sign-up mode when Sign up button clicked', () => {
    render(<AuthPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }));
    expect(screen.getByPlaceholderText(/Your full name/i)).toBeInTheDocument();
  });

  it('renders timezone picker in sign-up mode', () => {
    render(<AuthPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }));
    expect(screen.getByTestId('tz-picker')).toBeInTheDocument();
  });

  it('renders security question dropdown in sign-up mode', () => {
    render(<AuthPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }));
    // select option text + validation list may both contain "Select a security question"
    expect(screen.getAllByText(/Select a security question/i).length).toBeGreaterThan(0);
  });

  it('shows terms checkbox in sign-up mode', () => {
    render(<AuthPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Sign up' }));
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });
});
