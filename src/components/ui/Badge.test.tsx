import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge, NotificationBadge, StatusDot } from './Badge';

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('applies default variant', () => {
    const { container } = render(<Badge>Default</Badge>);
    expect(container.firstChild).toHaveClass('bg-gray-100');
  });

  it('applies primary variant', () => {
    const { container } = render(<Badge variant="primary">Primary</Badge>);
    expect(container.firstChild).toHaveClass('bg-accent-blue');
  });

  it('applies success variant', () => {
    const { container } = render(<Badge variant="success">Success</Badge>);
    expect(container.firstChild).toHaveClass('bg-status-success');
  });

  it('applies warning variant', () => {
    const { container } = render(<Badge variant="warning">Warning</Badge>);
    expect(container.firstChild).toHaveClass('bg-status-warning');
  });

  it('applies error variant', () => {
    const { container } = render(<Badge variant="error">Error</Badge>);
    expect(container.firstChild).toHaveClass('bg-status-error');
  });

  it('applies gold variant', () => {
    const { container } = render(<Badge variant="gold">Gold</Badge>);
    expect(container.firstChild).toHaveClass('bg-accent-gold');
  });

  it('applies md size', () => {
    const { container } = render(<Badge size="md">Md</Badge>);
    expect(container.firstChild).toHaveClass('px-2.5');
  });

  it('applies pill shape by default', () => {
    const { container } = render(<Badge>Pill</Badge>);
    expect(container.firstChild).toHaveClass('rounded-pill');
  });

  it('applies rounded-md when pill=false', () => {
    const { container } = render(<Badge pill={false}>Square</Badge>);
    expect(container.firstChild).toHaveClass('rounded-md');
  });
});

describe('NotificationBadge', () => {
  it('returns null when count is 0', () => {
    const { container } = render(<NotificationBadge count={0} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders count when positive', () => {
    render(<NotificationBadge count={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders maxCount+ when count exceeds maxCount', () => {
    render(<NotificationBadge count={150} maxCount={99} />);
    expect(screen.getByText('99+')).toBeInTheDocument();
  });
});

describe('StatusDot', () => {
  it('renders online status', () => {
    const { container } = render(<StatusDot status="online" />);
    expect(container.firstChild).toHaveClass('bg-status-success');
  });

  it('renders offline status', () => {
    const { container } = render(<StatusDot status="offline" />);
    expect(container.firstChild).toHaveClass('bg-gray-400');
  });

  it('renders busy status', () => {
    const { container } = render(<StatusDot status="busy" />);
    expect(container.firstChild).toHaveClass('bg-status-error');
  });

  it('renders away status', () => {
    const { container } = render(<StatusDot status="away" />);
    expect(container.firstChild).toHaveClass('bg-status-warning');
  });
});
