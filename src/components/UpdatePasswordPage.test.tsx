import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { supabase } from '../lib/supabase';
import UpdatePasswordPage from './UpdatePasswordPage';

vi.mock('../lib/supabase');

describe('UpdatePasswordPage', () => {
  const onComplete = vi.fn();

  it('renders the Set New Password form', () => {
    render(<UpdatePasswordPage onComplete={onComplete} />);
    expect(screen.getByText('Set New Password')).toBeInTheDocument();
  });

  it('renders two password inputs', () => {
    render(<UpdatePasswordPage onComplete={onComplete} />);
    const inputs = screen.getAllByPlaceholderText(/password/i);
    expect(inputs.length).toBeGreaterThanOrEqual(2);
  });

  it('submit button is disabled initially', () => {
    render(<UpdatePasswordPage onComplete={onComplete} />);
    expect(screen.getByRole('button', { name: /Update Password/i })).toBeDisabled();
  });

  it('shows error when password is too short', async () => {
    render(<UpdatePasswordPage onComplete={onComplete} />);
    fireEvent.change(screen.getByPlaceholderText(/Enter new password/i), {
      target: { value: 'abc' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Confirm/i), { target: { value: 'abc' } });
    // Enable by manually bypassing disabled — submit the form directly
    const form = document.querySelector('form');
    if (form) fireEvent.submit(form);
    await waitFor(() => expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument());
  });

  it('shows error when passwords do not match', async () => {
    render(<UpdatePasswordPage onComplete={onComplete} />);
    fireEvent.change(screen.getByPlaceholderText(/Enter new password/i), {
      target: { value: 'password1' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Confirm/i), { target: { value: 'password2' } });
    const form = document.querySelector('form');
    if (form) fireEvent.submit(form);
    // Both the error div and the inline hint show 'do not match' — use getAllByText
    await waitFor(() => expect(screen.getAllByText(/do not match/i).length).toBeGreaterThan(0));
  });

  it('shows success state after successful update', async () => {
    vi.mocked(supabase.auth.updateUser).mockResolvedValue({
      data: { user: null as never },
      error: null,
    });
    render(<UpdatePasswordPage onComplete={onComplete} />);
    fireEvent.change(screen.getByPlaceholderText(/Enter new password/i), {
      target: { value: 'newpass123' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Confirm/i), { target: { value: 'newpass123' } });
    const form = document.querySelector('form');
    if (form) fireEvent.submit(form);
    await waitFor(() => expect(screen.getByText(/Password Updated/i)).toBeInTheDocument());
  });

  it('toggles password visibility', () => {
    render(<UpdatePasswordPage onComplete={onComplete} />);
    const toggleBtn = screen
      .getAllByRole('button')
      .find((b) => b.getAttribute('aria-label') === 'Show password');
    if (toggleBtn) {
      fireEvent.click(toggleBtn);
      expect(screen.getByPlaceholderText(/Enter new password/i)).toHaveAttribute('type', 'text');
    }
  });

  it('shows mismatch hint inline when passwords differ', () => {
    render(<UpdatePasswordPage onComplete={onComplete} />);
    fireEvent.change(screen.getByPlaceholderText(/Enter new password/i), {
      target: { value: 'abc123' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Confirm/i), { target: { value: 'xyz789' } });
    expect(screen.getByText(/do not match/i)).toBeInTheDocument();
  });
});
