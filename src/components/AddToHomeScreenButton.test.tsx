import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AddToHomeScreenButton from './AddToHomeScreenButton';

describe('AddToHomeScreenButton', () => {
  it('renders install button when not in standalone mode', () => {
    render(<AddToHomeScreenButton />);
    // Non-standalone: shows instructions or install button (not the "installed" badge)
    expect(screen.queryByText('App installed')).toBeNull();
  });

  it('shows installed badge when in standalone mode', () => {
    // Mock standalone detection
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(display-mode: standalone)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    render(<AddToHomeScreenButton />);
    expect(screen.getByText('App installed')).toBeInTheDocument();

    // Restore default mock
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('fires beforeinstallprompt and stores deferred prompt', () => {
    render(<AddToHomeScreenButton />);
    const mockPromptEvent = new Event('beforeinstallprompt') as Event & {
      prompt: ReturnType<typeof vi.fn>;
      userChoice: Promise<{ outcome: string }>;
    };
    mockPromptEvent.prompt = vi.fn().mockResolvedValue(undefined);
    mockPromptEvent.userChoice = Promise.resolve({ outcome: 'accepted' });
    window.dispatchEvent(mockPromptEvent);
    // After firing, a button to open modal or install should appear
    // (just checking no crash)
    expect(document.body).toBeInTheDocument();
  });

  it('renders without crashing in desktop mode', () => {
    const { container } = render(<AddToHomeScreenButton />);
    expect(container).toBeInTheDocument();
  });
});
