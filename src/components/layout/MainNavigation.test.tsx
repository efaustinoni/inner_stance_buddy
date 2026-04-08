import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MainNavigation } from './MainNavigation';

const mockHandleSignOut = vi.fn();

vi.mock('../../contexts/AuthContext', () => ({
  useAuthContext: () => ({
    userName: 'Alice',
    handleSignOut: mockHandleSignOut,
  }),
}));

describe('MainNavigation', () => {
  const defaultProps = {
    onNavigate: vi.fn(),
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
    render(<MainNavigation {...defaultProps} />);
    const profileBtn = screen
      .getAllByRole('button')
      .find((b) => b.className.includes('rounded-lg'));
    if (profileBtn) fireEvent.click(profileBtn);
    expect(defaultProps.onNavigate).toHaveBeenCalledWith('/profile');
  });

  it('calls handleSignOut from context when sign-out button clicked', () => {
    render(<MainNavigation {...defaultProps} />);
    const signOutBtn = screen.getByTitle('Sign out');
    fireEvent.click(signOutBtn);
    expect(mockHandleSignOut).toHaveBeenCalledOnce();
  });

  it('renders userName from context', () => {
    render(<MainNavigation {...defaultProps} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('renders header element', () => {
    render(<MainNavigation {...defaultProps} />);
    expect(document.querySelector('header')).toBeInTheDocument();
  });
});
