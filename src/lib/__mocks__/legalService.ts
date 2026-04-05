import { vi } from 'vitest';

export const fetchLegalManifest = vi.fn().mockResolvedValue(null);
export const getPdfPublicUrl = vi.fn().mockReturnValue('/terms.pdf');
export const getUserLatestAgreement = vi.fn().mockResolvedValue(null);
export const recordUserAgreement = vi.fn().mockResolvedValue(true);
export const getLocalAcceptance = vi.fn().mockReturnValue(null);
export const setLocalAcceptance = vi.fn();
export const compareVersions = vi.fn().mockReturnValue(0);
export const checkAcceptanceStatus = vi.fn().mockResolvedValue({
  termsNeedsUpdate: false,
  privacyNeedsUpdate: false,
  termsLastUpdated: null,
  privacyLastUpdated: null,
  requiresAcceptance: false,
});
export const formatDate = vi.fn().mockImplementation((d: string) => d);
