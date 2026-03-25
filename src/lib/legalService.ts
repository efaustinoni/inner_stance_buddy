// Created: 2025-12-22
// Last updated: 2025-12-22 (fixed version comparison with date fallback)

import { supabase } from './supabase';

export interface LegalDocument {
  version: string;
  lastUpdated: string;
  filePath: string;
}

export interface LegalManifest {
  terms: LegalDocument;
  privacy: LegalDocument;
  requiresAcceptance: boolean;
}

export interface UserTermsAgreement {
  id: string;
  user_id: string;
  terms_version: string;
  privacy_version: string;
  terms_version_string: string | null;
  privacy_version_string: string | null;
  agreed_at: string;
  created_at: string;
}

interface LegalDocumentRow {
  id: string;
  document_type: 'terms' | 'privacy';
  version: string;
  last_updated: string;
  file_path: string;
  is_active: boolean;
  requires_acceptance: boolean;
}

const LOCAL_STORAGE_KEY = 'legal_acceptance';

interface LocalAcceptance {
  termsVersion: string;
  privacyVersion: string;
  acceptedAt: string;
}

export async function fetchLegalManifest(): Promise<LegalManifest | null> {
  try {
    const { data, error } = await supabase
      .from('legal_documents')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching legal documents:', error);
      return null;
    }

    if (!data || data.length === 0) {
      console.error('No active legal documents found');
      return null;
    }

    const docs = data as LegalDocumentRow[];
    const termsDoc = docs.find(d => d.document_type === 'terms');
    const privacyDoc = docs.find(d => d.document_type === 'privacy');

    if (!termsDoc || !privacyDoc) {
      console.error('Missing terms or privacy document');
      return null;
    }

    const requiresAcceptance = docs.some(d => d.requires_acceptance);

    return {
      terms: {
        version: termsDoc.version,
        lastUpdated: termsDoc.last_updated,
        filePath: termsDoc.file_path,
      },
      privacy: {
        version: privacyDoc.version,
        lastUpdated: privacyDoc.last_updated,
        filePath: privacyDoc.file_path,
      },
      requiresAcceptance,
    };
  } catch (err) {
    console.error('Error fetching legal manifest:', err);
    return null;
  }
}

export function getPdfPublicUrl(filePath: string): string {
  return `/${filePath}`;
}

export async function getUserLatestAgreement(userId: string): Promise<UserTermsAgreement | null> {
  const { data, error } = await supabase
    .from('user_terms_agreements')
    .select('*')
    .eq('user_id', userId)
    .order('agreed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user agreement:', error);
    return null;
  }

  return data;
}

export async function recordUserAgreement(
  userId: string,
  manifest: LegalManifest
): Promise<boolean> {
  const { error } = await supabase
    .from('user_terms_agreements')
    .insert({
      user_id: userId,
      terms_version: manifest.terms.lastUpdated,
      privacy_version: manifest.privacy.lastUpdated,
      terms_version_string: manifest.terms.version,
      privacy_version_string: manifest.privacy.version,
      user_agent: navigator.userAgent,
    });

  if (error) {
    console.error('Error recording agreement:', error);
    return false;
  }

  return true;
}

export function getLocalAcceptance(): LocalAcceptance | null {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as LocalAcceptance;
  } catch {
    return null;
  }
}

export function setLocalAcceptance(manifest: LegalManifest): void {
  const acceptance: LocalAcceptance = {
    termsVersion: manifest.terms.version,
    privacyVersion: manifest.privacy.version,
    acceptedAt: new Date().toISOString(),
  };
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(acceptance));
}

export function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  const maxLen = Math.max(parts1.length, parts2.length);

  for (let i = 0; i < maxLen; i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;

    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }

  return 0;
}

export interface AcceptanceStatus {
  termsNeedsUpdate: boolean;
  privacyNeedsUpdate: boolean;
  termsLastUpdated: string | null;
  privacyLastUpdated: string | null;
  requiresAcceptance: boolean;
}

export async function checkAcceptanceStatus(
  userId: string | null,
  manifest: LegalManifest
): Promise<AcceptanceStatus> {
  let acceptedTermsVersion: string | null = null;
  let acceptedPrivacyVersion: string | null = null;
  let acceptedTermsDate: string | null = null;
  let acceptedPrivacyDate: string | null = null;

  if (userId) {
    const agreement = await getUserLatestAgreement(userId);
    if (agreement) {
      acceptedTermsVersion = agreement.terms_version_string;
      acceptedPrivacyVersion = agreement.privacy_version_string;
      acceptedTermsDate = agreement.terms_version;
      acceptedPrivacyDate = agreement.privacy_version;
    }
  }

  if (!acceptedTermsVersion || !acceptedPrivacyVersion) {
    const local = getLocalAcceptance();
    if (local) {
      acceptedTermsVersion = acceptedTermsVersion || local.termsVersion;
      acceptedPrivacyVersion = acceptedPrivacyVersion || local.privacyVersion;
    }
  }

  const checkNeedsUpdate = (
    manifestVersion: string,
    manifestDate: string,
    acceptedVersion: string | null,
    acceptedDate: string | null
  ): boolean => {
    if (acceptedVersion) {
      return compareVersions(manifestVersion, acceptedVersion) > 0;
    }
    if (acceptedDate) {
      const manifestDateNorm = manifestDate.split('T')[0];
      const acceptedDateNorm = acceptedDate.split('T')[0];
      return manifestDateNorm > acceptedDateNorm;
    }
    return true;
  };

  const termsNeedsUpdate = checkNeedsUpdate(
    manifest.terms.version,
    manifest.terms.lastUpdated,
    acceptedTermsVersion,
    acceptedTermsDate
  );

  const privacyNeedsUpdate = checkNeedsUpdate(
    manifest.privacy.version,
    manifest.privacy.lastUpdated,
    acceptedPrivacyVersion,
    acceptedPrivacyDate
  );

  return {
    termsNeedsUpdate,
    privacyNeedsUpdate,
    termsLastUpdated: termsNeedsUpdate ? manifest.terms.lastUpdated : null,
    privacyLastUpdated: privacyNeedsUpdate ? manifest.privacy.lastUpdated : null,
    requiresAcceptance: manifest.requiresAcceptance,
  };
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
