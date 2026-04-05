import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ForgotPasswordPage from './ForgotPasswordPage';

// Mock global fetch for the password-reset edge function
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('renders email step by default', () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByText(/Reset Your Password/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
  });

  it('continue button is disabled when email is empty', () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByRole('button', { name: /Continue/i })).toBeDisabled();
  });

  it('continue button enables when email entered', () => {
    render(<ForgotPasswordPage />);
    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), {
      target: { value: 'user@example.com' },
    });
    expect(screen.getByRole('button', { name: /Continue/i })).not.toBeDisabled();
  });

  it('shows security question step after successful email lookup', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ question: 'What is your pet name?' }),
    });

    render(<ForgotPasswordPage />);
    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    await waitFor(() => expect(screen.getByText('What is your pet name?')).toBeInTheDocument());
    expect(screen.getByText(/Security Verification/i)).toBeInTheDocument();
  });

  it('shows error when no question found', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ question: null }),
    });

    render(<ForgotPasswordPage />);
    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), {
      target: { value: 'unknown@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    await waitFor(() => expect(screen.getByText(/No account found/i)).toBeInTheDocument());
  });

  it('shows error on API failure', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ error: 'Server error' }),
    });

    render(<ForgotPasswordPage />);
    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    await waitFor(() => expect(screen.getByText(/Server error/i)).toBeInTheDocument());
  });

  it('shows success step after correct answer submitted', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ question: 'Pet name?' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true }),
      });

    render(<ForgotPasswordPage />);
    fireEvent.change(screen.getByPlaceholderText(/you@example.com/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    await waitFor(() => screen.getByText('Pet name?'));
    fireEvent.change(screen.getByPlaceholderText(/Enter your answer/i), {
      target: { value: 'Fluffy' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Verify/i }));

    await waitFor(() => expect(screen.getByText(/Check Your Email/i)).toBeInTheDocument());
  });
});
