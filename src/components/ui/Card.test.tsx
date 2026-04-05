import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Hello Card</Card>);
    expect(screen.getByText('Hello Card')).toBeInTheDocument();
  });

  it('applies light variant by default', () => {
    const { container } = render(<Card>light</Card>);
    expect(container.firstChild).toHaveClass('bg-surface-light');
  });

  it('applies dark variant', () => {
    const { container } = render(<Card variant="dark">dark</Card>);
    expect(container.firstChild).toHaveClass('bg-navy-800');
  });

  it('applies glass variant', () => {
    const { container } = render(<Card variant="glass">glass</Card>);
    expect(container.firstChild).toHaveClass('backdrop-blur-sm');
  });

  it('applies elevated variant', () => {
    const { container } = render(<Card variant="elevated">elevated</Card>);
    expect(container.firstChild).toHaveClass('bg-navy-700');
  });

  it('applies hover classes when hover=true', () => {
    const { container } = render(<Card hover>hoverable</Card>);
    expect(container.firstChild).toHaveClass('hover:shadow-card-hover');
  });

  it('applies custom className', () => {
    const { container } = render(<Card className="custom-class">x</Card>);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('applies sm padding', () => {
    const { container } = render(<Card padding="sm">x</Card>);
    expect(container.firstChild).toHaveClass('p-4');
  });

  it('applies none padding', () => {
    const { container } = render(<Card padding="none">x</Card>);
    expect(container.firstChild).not.toHaveClass('p-4');
  });
});

describe('CardHeader', () => {
  it('renders children', () => {
    render(<CardHeader>Header</CardHeader>);
    expect(screen.getByText('Header')).toBeInTheDocument();
  });
});

describe('CardTitle', () => {
  it('renders as h3 by default', () => {
    render(<CardTitle>Title</CardTitle>);
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Title');
  });

  it('renders as h2 when specified', () => {
    render(<CardTitle as="h2">Title</CardTitle>);
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });
});

describe('CardContent', () => {
  it('renders children', () => {
    render(<CardContent>Content</CardContent>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});

describe('CardFooter', () => {
  it('renders children with border', () => {
    const { container } = render(<CardFooter>Footer</CardFooter>);
    expect(container.firstChild).toHaveClass('border-t');
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });
});
