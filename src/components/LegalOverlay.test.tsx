// Created: 2026-04-08
// Tests: LegalOverlay — conditional rendering based on route and acceptance status

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LegalOverlay } from './LegalOverlay';

// Mock wouter's useLocation — controls the current path in each test
vi.mock('wouter', () => ({
  useLocation: vi.fn(() => ['/']),
}));

// Mock the banner so tests focus on the overlay logic, not the banner internals
vi.mock('./LegalAcceptanceBanner', () => ({
  default: () => <div data-testid="legal-banner">Legal Banner</div>,
}));

import { useLocation } from 'wouter';

const manifest = {
  terms: { version: '1.0', lastUpdated: '2026-01-01', filePath: '/terms.pdf' },
  privacy: { version: '1.0', lastUpdated: '2026-01-01', filePath: '/privacy.pdf' },
  requiresAcceptance: true,
};

const needsUpdate = {
  termsNeedsUpdate: true,
  privacyNeedsUpdate: false,
  termsLastUpdated: '2026-01-01',
  privacyLastUpdated: null,
  requiresAcceptance: true,
};

describe('LegalOverlay', () => {
  it('renders nothing when acceptanceStatus is null', () => {
    const { container } = render(
      <LegalOverlay
        acceptanceStatus={null}
        legalManifest={manifest}
        onAccept={vi.fn()}
        onSignOut={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when legalManifest is null', () => {
    const { container } = render(
      <LegalOverlay
        acceptanceStatus={needsUpdate}
        legalManifest={null}
        onAccept={vi.fn()}
        onSignOut={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing on a public path even when acceptance is needed', () => {
    vi.mocked(useLocation).mockReturnValue(['/signin', vi.fn()]);

    const { container } = render(
      <LegalOverlay
        acceptanceStatus={needsUpdate}
        legalManifest={manifest}
        onAccept={vi.fn()}
        onSignOut={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the banner on a protected route when acceptance is needed', () => {
    vi.mocked(useLocation).mockReturnValue(['/', vi.fn()]);

    render(
      <LegalOverlay
        acceptanceStatus={needsUpdate}
        legalManifest={manifest}
        onAccept={vi.fn()}
        onSignOut={vi.fn()}
      />
    );
    expect(screen.getByTestId('legal-banner')).toBeInTheDocument();
  });

  it('renders nothing when no updates are required', () => {
    vi.mocked(useLocation).mockReturnValue(['/', vi.fn()]);

    const upToDate = {
      termsNeedsUpdate: false,
      privacyNeedsUpdate: false,
      termsLastUpdated: null,
      privacyLastUpdated: null,
      requiresAcceptance: true,
    };

    const { container } = render(
      <LegalOverlay
        acceptanceStatus={upToDate}
        legalManifest={manifest}
        onAccept={vi.fn()}
        onSignOut={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
