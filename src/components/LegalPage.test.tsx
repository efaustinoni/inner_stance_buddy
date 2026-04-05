import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { fetchLegalManifest } from '../lib/legalService';
import LegalPage from './LegalPage';

vi.mock('../lib/legalService');

describe('LegalPage', () => {
  it('shows loading state initially', () => {
    render(<LegalPage type="terms" />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('shows error when manifest fails to load', async () => {
    vi.mocked(fetchLegalManifest).mockResolvedValue(null);
    render(<LegalPage type="terms" />);
    await waitFor(() => expect(screen.getAllByText(/Unable to load/i).length).toBeGreaterThan(0));
  });

  it('renders Terms of Service title', async () => {
    vi.mocked(fetchLegalManifest).mockResolvedValue({
      terms: { version: '1.0', lastUpdated: '2026-01-01', filePath: 'terms.pdf' },
      privacy: { version: '1.0', lastUpdated: '2026-01-01', filePath: 'privacy.pdf' },
      requiresAcceptance: false,
    });

    render(<LegalPage type="terms" />);
    await waitFor(() => expect(screen.getByText('Terms of Service')).toBeInTheDocument());
  });

  it('renders Privacy Policy title', async () => {
    vi.mocked(fetchLegalManifest).mockResolvedValue({
      terms: { version: '1.0', lastUpdated: '2026-01-01', filePath: 'terms.pdf' },
      privacy: { version: '1.0', lastUpdated: '2026-01-01', filePath: 'privacy.pdf' },
      requiresAcceptance: false,
    });

    render(<LegalPage type="privacy" />);
    await waitFor(() => expect(screen.getByText('Privacy Policy')).toBeInTheDocument());
  });

  it('shows version and date when manifest loads', async () => {
    vi.mocked(fetchLegalManifest).mockResolvedValue({
      terms: { version: '2.1', lastUpdated: '2026-03-15', filePath: 'terms.pdf' },
      privacy: { version: '1.0', lastUpdated: '2026-01-01', filePath: 'privacy.pdf' },
      requiresAcceptance: false,
    });

    render(<LegalPage type="terms" />);
    await waitFor(() => expect(screen.getByText(/Version 2.1/i)).toBeInTheDocument());
  });

  it('shows go-back button', async () => {
    vi.mocked(fetchLegalManifest).mockResolvedValue({
      terms: { version: '1.0', lastUpdated: '2026-01-01', filePath: 'terms.pdf' },
      privacy: { version: '1.0', lastUpdated: '2026-01-01', filePath: 'privacy.pdf' },
      requiresAcceptance: false,
    });
    render(<LegalPage type="terms" />);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument()
    );
  });
});
