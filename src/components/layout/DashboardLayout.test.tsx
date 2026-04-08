import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DashboardLayout } from './DashboardLayout';

// MainNavigation reads from AuthContext internally — mock it to keep layout tests isolated
vi.mock('./MainNavigation', () => ({
  MainNavigation: () => <nav data-testid="main-nav" />,
}));

describe('DashboardLayout', () => {
  const defaultProps = {
    onNavigate: vi.fn(),
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

  it('wraps content in main element', () => {
    const { container } = render(<DashboardLayout {...defaultProps} />);
    expect(container.querySelector('main')).toBeInTheDocument();
  });
});
