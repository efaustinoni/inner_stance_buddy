import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MainNavigation } from './MainNavigation';

describe('MainNavigation', () => {
  const defaultProps = {
    onNavigate: vi.fn(),
    onSignOut: vi.fn(),
  };

  it('renders the app name', () => {
    render(<MainNavigation {...defaultProps} />);
    expect(screen.getByText('Exercise Journal')).toBeInTheDocument();
  });

  it('calls onNavigate with / when logo clicked', () => {
    render(<MainNavigation {...defaultProps} />);
    fireEvent.click(screen.getByText('Exercise Journal'));
    expect(defaultProps.onNavigate).toHaveBeenCalledWith('/');
  });

  it('calls onNavigate with /profile when avatar button clicked', () => {
    render(<MainNavigation {...defaultProps} userName="Alice" />);
    const profileBtn = screen
      .getAllByRole('button')
      .find((b) => b.className.includes('rounded-lg'));
    if (profileBtn) fireEvent.click(profileBtn);
    expect(defaultProps.onNavigate).toHaveBeenCalledWith('/profile');
  });

  it('calls onSignOut when sign-out button clicked', () => {
    render(<MainNavigation {...defaultProps} />);
    const signOutBtn = screen.getByTitle('Sign out');
    fireEvent.click(signOutBtn);
    expect(defaultProps.onSignOut).toHaveBeenCalledOnce();
  });

  it('renders userName when provided', () => {
    render(<MainNavigation {...defaultProps} userName="Bob" />);
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('renders header element', () => {
    render(<MainNavigation {...defaultProps} />);
    expect(document.querySelector('header')).toBeInTheDocument();
  });
});
