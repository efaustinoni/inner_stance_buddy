import '@testing-library/jest-dom/vitest';
import { vi, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// jsdom does not implement matchMedia — stub it
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

// Suppress expected console.error noise from error-boundary paths in tests
vi.spyOn(console, 'error').mockImplementation(() => {});

// Reset all mocks between tests so state doesn't bleed across test cases
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
