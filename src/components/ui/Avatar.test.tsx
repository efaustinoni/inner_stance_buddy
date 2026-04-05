import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Avatar, AvatarGroup } from './Avatar';

describe('Avatar', () => {
  it('renders an img when src is provided', () => {
    render(<Avatar src="https://example.com/photo.jpg" alt="User" />);
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/photo.jpg');
  });

  it('renders initials when name is provided and no src', () => {
    render(<Avatar name="John Doe" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders single initial for single-word name', () => {
    render(<Avatar name="Alice" />);
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('renders fallback icon when no src and no name', () => {
    const { container } = render(<Avatar />);
    // Should render a div with an icon (no img, no text initials)
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('applies xs size class', () => {
    const { container } = render(<Avatar name="A" size="xs" />);
    expect(container.firstChild).toHaveClass('w-6');
  });

  it('applies xl size class', () => {
    const { container } = render(<Avatar name="A" size="xl" />);
    expect(container.firstChild).toHaveClass('w-16');
  });

  it('applies custom className', () => {
    const { container } = render(<Avatar name="A" className="ring-red-500" />);
    expect(container.firstChild).toHaveClass('ring-red-500');
  });

  it('does not render img when src is empty string', () => {
    render(<Avatar src="" name="John" />);
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByText('J')).toBeInTheDocument();
  });
});

describe('AvatarGroup', () => {
  const avatars = [
    { name: 'Alice' },
    { name: 'Bob' },
    { name: 'Carol' },
    { name: 'Dave' },
    { name: 'Eve' },
  ];

  it('renders up to max avatars', () => {
    render(<AvatarGroup avatars={avatars} max={3} />);
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('C')).toBeInTheDocument();
  });

  it('shows overflow count when avatars exceed max', () => {
    render(<AvatarGroup avatars={avatars} max={3} />);
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('does not show overflow count when all fit', () => {
    render(<AvatarGroup avatars={avatars.slice(0, 2)} max={4} />);
    expect(screen.queryByText(/\+/)).toBeNull();
  });
});
