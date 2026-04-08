// Created: 2026-04-08
// Tests: VerificationScreen — renders, callbacks, conditional state

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { VerificationScreen } from './VerificationScreen';

describe('VerificationScreen', () => {
  const defaultProps = {
    verificationEmail: 'alice@example.com',
    error: null,
    isResending: false,
    resendSuccess: false,
    onResend: vi.fn(),
    onBack: vi.fn(),
  };

  it('renders the verification email address', () => {
    render(<VerificationScreen {...defaultProps} />);
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
  });

  it('renders the Check Your Email heading', () => {
    render(<VerificationScreen {...defaultProps} />);
    expect(screen.getByText('Check Your Email')).toBeInTheDocument();
  });

  it('calls onResend when resend button is clicked', () => {
    render(<VerificationScreen {...defaultProps} />);
    fireEvent.click(screen.getByText('Resend Verification Email'));
    expect(defaultProps.onResend).toHaveBeenCalledOnce();
  });

  it('calls onBack when back button is clicked', () => {
    render(<VerificationScreen {...defaultProps} />);
    fireEvent.click(screen.getByText('Back to Sign In'));
    expect(defaultProps.onBack).toHaveBeenCalledOnce();
  });

  it('shows error message when error is provided', () => {
    render(<VerificationScreen {...defaultProps} error="Rate limit exceeded" />);
    expect(screen.getByText('Rate limit exceeded')).toBeInTheDocument();
  });

  it('shows resend success message when resendSuccess is true', () => {
    render(<VerificationScreen {...defaultProps} resendSuccess={true} />);
    expect(screen.getByText(/resent successfully/i)).toBeInTheDocument();
  });

  it('disables resend button while resending', () => {
    render(<VerificationScreen {...defaultProps} isResending={true} />);
    const btn = screen.getByRole('button', { name: /sending/i });
    expect(btn).toBeDisabled();
  });
});
