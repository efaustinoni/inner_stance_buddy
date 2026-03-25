// Created: 2025-12-28
// Last updated: 2025-12-28

export function detectUserTimezone(): string {
  if (typeof window === 'undefined') {
    return 'UTC';
  }
  try {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return detected || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function getUserTimezone(profileTimezone?: string | null): string {
  if (profileTimezone && profileTimezone !== 'UTC') {
    return profileTimezone;
  }
  return detectUserTimezone();
}
