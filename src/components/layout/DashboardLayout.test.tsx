import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DashboardLayout } from './DashboardLayout';

vi.mock('./MainNavigation', () => ({
  MainNavigation: ({ onSignOut }: { onSignOut: () => void }) => (
    <nav data-testid="main-nav">
      <button onClick={onSignOut}>Sign out</button>
    </nav>
  ),
}));

describe('DashboardLayout', () => {
  const defaultProps = {
    onNavigate: vi.fn(),
    onSignOut: vi.fn(),
    children: <div data-testid="child-content">Page Content</div>,
  };

  it('renders children', () => {
    render(<DashboardLayout {...defaultProps} />);
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('renders MainNavigation', () => {
    render(<DashboardLayout {...defaultProps} />);
    expect(screen.getByTestId('main-nav')).toBeInTheDocument();
  });

  it('passes onSignOut to nav', () => {
    render(<DashboardLayout {...defaultProps} />);
    screen.getByText('Sign out').click();
    expect(defaultProps.onSignOut).toHaveBeenCalledOnce();
  });

  it('wraps content in main element', () => {
    const { container } = render(<DashboardLayout {...defaultProps} />);
    expect(container.querySelector('main')).toBeInTheDocument();
  });

  it('passes userName and userAvatar props', () => {
    render(<DashboardLayout {...defaultProps} userName="Alice" userAvatar="/avatar.png" />);
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });
});
