// Created: 2026-04-08
// Tests: useLegalStatus — manifest loading / acceptance status / handleAcceptTerms paths

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchLegalManifest,
  checkAcceptanceStatus,
  recordUserAgreement,
  setLocalAcceptance,
} from '../lib/legalService';
import { useLegalStatus } from './useLegalStatus';

vi.mock('../lib/legalService');
vi.mock('../lib/toast');

const mockManifest = {
  terms: { version: '1.0', lastUpdated: '2026-01-01', pdfPath: '/terms.pdf' },
  privacy: { version: '1.0', lastUpdated: '2026-01-01', pdfPath: '/privacy.pdf' },
};

const mockStatus = {
  termsNeedsUpdate: true,
  privacyNeedsUpdate: false,
  termsLastUpdated: null,
  privacyLastUpdated: null,
  requiresAcceptance: true,
};

const mockUser = { id: 'u1', email: 'test@example.com' };

describe('useLegalStatus', () => {
  beforeEach(() => vi.clearAllMocks());

  it('leaves state null when fetchLegalManifest returns null', async () => {
    vi.mocked(fetchLegalManifest).mockResolvedValue(null);

    const { result } = renderHook(() => useLegalStatus(null));

    // Give the effect time to settle
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.legalManifest).toBeNull();
    expect(result.current.acceptanceStatus).toBeNull();
  });

  it('loads the manifest and acceptance status on mount', async () => {
    vi.mocked(fetchLegalManifest).mockResolvedValue(mockManifest as never);
    vi.mocked(checkAcceptanceStatus).mockResolvedValue(mockStatus);

    const { result } = renderHook(() => useLegalStatus(null));

    await waitFor(() => expect(result.current.legalManifest).not.toBeNull());

    expect(result.current.legalManifest).toEqual(mockManifest);
    expect(result.current.acceptanceStatus).toEqual(mockStatus);
  });

  it('calls recordUserAgreement and clears status when authenticated user accepts', async () => {
    vi.mocked(fetchLegalManifest).mockResolvedValue(mockManifest as never);
    vi.mocked(checkAcceptanceStatus).mockResolvedValue(mockStatus);
    vi.mocked(recordUserAgreement).mockResolvedValue(true);

    const { result } = renderHook(() => useLegalStatus(mockUser as never));

    await waitFor(() => expect(result.current.legalManifest).not.toBeNull());

    await act(async () => {
      await result.current.handleAcceptTerms();
    });

    expect(recordUserAgreement).toHaveBeenCalledWith(mockUser.id, mockManifest);
    expect(result.current.acceptanceStatus).toBeNull();
  });

  it('calls setLocalAcceptance and clears status when unauthenticated user accepts', async () => {
    vi.mocked(fetchLegalManifest).mockResolvedValue(mockManifest as never);
    vi.mocked(checkAcceptanceStatus).mockResolvedValue(mockStatus);

    const { result } = renderHook(() => useLegalStatus(null));

    await waitFor(() => expect(result.current.legalManifest).not.toBeNull());

    await act(async () => {
      await result.current.handleAcceptTerms();
    });

    expect(setLocalAcceptance).toHaveBeenCalledWith(mockManifest);
    expect(result.current.acceptanceStatus).toBeNull();
  });

  it('does not clear acceptance status when recordUserAgreement fails', async () => {
    vi.mocked(fetchLegalManifest).mockResolvedValue(mockManifest as never);
    vi.mocked(checkAcceptanceStatus).mockResolvedValue(mockStatus);
    vi.mocked(recordUserAgreement).mockResolvedValue(false);

    const { result } = renderHook(() => useLegalStatus(mockUser as never));

    await waitFor(() => expect(result.current.legalManifest).not.toBeNull());

    await act(async () => {
      await result.current.handleAcceptTerms();
    });

    // Status should stay
    expect(result.current.acceptanceStatus).not.toBeNull();
  });
});
