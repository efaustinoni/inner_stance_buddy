// Created: 2026-04-07
// Last Updated: 2026-04-07

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  fetchLegalManifest,
  checkAcceptanceStatus,
  recordUserAgreement,
  setLocalAcceptance,
  type LegalManifest,
  type AcceptanceStatus,
} from '../lib/legalService';
import { toast } from '../lib/toast';

export interface LegalStatusState {
  legalManifest: LegalManifest | null;
  acceptanceStatus: AcceptanceStatus | null;
  handleAcceptTerms: () => Promise<void>;
}

export function useLegalStatus(user: User | null): LegalStatusState {
  const [legalManifest, setLegalManifest] = useState<LegalManifest | null>(null);
  const [acceptanceStatus, setAcceptanceStatus] = useState<AcceptanceStatus | null>(null);

  useEffect(() => {
    async function loadLegalStatus() {
      const manifest = await fetchLegalManifest();
      if (!manifest) return;

      setLegalManifest(manifest);

      const status = await checkAcceptanceStatus(user?.id ?? null, manifest);
      setAcceptanceStatus(status);
    }

    loadLegalStatus();
  }, [user]);

  async function handleAcceptTerms() {
    if (!legalManifest) return;

    if (user) {
      const success = await recordUserAgreement(user.id, legalManifest);
      if (success) {
        setAcceptanceStatus(null);
      } else {
        toast.error('Failed to record your acceptance. Please try again.');
      }
    } else {
      setLocalAcceptance(legalManifest);
      setAcceptanceStatus(null);
    }
  }

  return { legalManifest, acceptanceStatus, handleAcceptTerms };
}
