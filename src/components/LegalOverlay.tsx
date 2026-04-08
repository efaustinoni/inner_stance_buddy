// Created: 2026-04-08
// Renders the legal acceptance banner when the current route requires it.
// Owns the public-path exclusion list and the needs-update check so that
// App.tsx does not need to know about either.

import { useLocation } from 'wouter';
import LegalAcceptanceBanner from './LegalAcceptanceBanner';
import type { LegalManifest, AcceptanceStatus } from '../lib/legalService';

const PUBLIC_PATHS = ['/terms', '/privacy', '/signin', '/signup', '/forgot-password'];

interface LegalOverlayProps {
  acceptanceStatus: AcceptanceStatus | null;
  legalManifest: LegalManifest | null;
  onAccept: () => Promise<void>;
  onSignOut: () => Promise<void>;
}

export function LegalOverlay({
  acceptanceStatus,
  legalManifest,
  onAccept,
  onSignOut,
}: LegalOverlayProps) {
  const [location] = useLocation();

  const isPublicPath = PUBLIC_PATHS.some((p) => location.startsWith(p));
  const show =
    !isPublicPath &&
    !!acceptanceStatus &&
    !!legalManifest &&
    (acceptanceStatus.termsNeedsUpdate || acceptanceStatus.privacyNeedsUpdate);

  if (!show || !acceptanceStatus || !legalManifest) return null;

  return (
    <LegalAcceptanceBanner
      status={acceptanceStatus}
      manifest={legalManifest}
      onAccept={onAccept}
      onSignOut={onSignOut}
    />
  );
}
