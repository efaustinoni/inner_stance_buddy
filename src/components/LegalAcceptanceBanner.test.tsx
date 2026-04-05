import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LegalAcceptanceBanner from './LegalAcceptanceBanner';
import type { AcceptanceStatus, LegalManifest } from '../lib/legalService';

const manifest: LegalManifest = {
  terms: { version: '1.0', lastUpdated: '2026-01-01', filePath: '/terms.pdf' },
  privacy: { version: '1.0', lastUpdated: '2026-01-01', filePath: '/privacy.pdf' },
  requiresAcceptance: false,
};

const noUpdateStatus: AcceptanceStatus = {
  termsNeedsUpdate: false,
  privacyNeedsUpdate: false,
  termsLastUpdated: null,
  privacyLastUpdated: null,
  requiresAcceptance: false,
};

const updateStatus: AcceptanceStatus = {
  termsNeedsUpdate: true,
  privacyNeedsUpdate: false,
  termsLastUpdated: '2026-01-01',
  privacyLastUpdated: null,
  requiresAcceptance: false,
};

const blockingStatus: AcceptanceStatus = {
  ...updateStatus,
  requiresAcceptance: true,
};

describe('LegalAcceptanceBanner', () => {
  it('returns null when no updates needed', () => {
    const { container } = render(
      <LegalAcceptanceBanner
        status={noUpdateStatus}
        manifest={manifest}
        onAccept={vi.fn()}
        onSignOut={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders banner when terms need update', () => {
    render(
      <LegalAcceptanceBanner
        status={updateStatus}
        manifest={manifest}
        onAccept={vi.fn()}
        onSignOut={vi.fn()}
      />
    );
    // Banner text contains "accept" and there is an Accept button — both match /Accept/i
    expect(screen.getAllByText(/Accept/i).length).toBeGreaterThan(0);
  });

  it('calls onAccept when accept button clicked', async () => {
    const onAccept = vi.fn().mockResolvedValue(undefined);
    render(
      <LegalAcceptanceBanner
        status={updateStatus}
        manifest={manifest}
        onAccept={onAccept}
        onSignOut={vi.fn()}
      />
    );
    // Use role to pick the Accept button specifically (not the banner text)
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));
    expect(onAccept).toHaveBeenCalledOnce();
  });

  it('renders blocking modal when requiresAcceptance=true', () => {
    render(
      <LegalAcceptanceBanner
        status={blockingStatus}
        manifest={manifest}
        onAccept={vi.fn()}
        onSignOut={vi.fn()}
      />
    );
    expect(screen.getByText(/Updated Legal Documents/i)).toBeInTheDocument();
  });

  it('calls onSignOut when sign-out clicked in modal', () => {
    const onSignOut = vi.fn();
    render(
      <LegalAcceptanceBanner
        status={blockingStatus}
        manifest={manifest}
        onAccept={vi.fn()}
        onSignOut={onSignOut}
      />
    );
    fireEvent.click(screen.getByText(/Sign Out/i));
    expect(onSignOut).toHaveBeenCalledOnce();
  });

  it('shows Terms of Service update message', () => {
    render(
      <LegalAcceptanceBanner
        status={updateStatus}
        manifest={manifest}
        onAccept={vi.fn()}
        onSignOut={vi.fn()}
      />
    );
    expect(screen.getByText(/Terms of Service/i)).toBeInTheDocument();
  });
});
