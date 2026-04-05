// Created: 2025-12-28
// Last updated: 2025-12-28

import { TIMEZONE_TO_COUNTRY } from '../data/timezoneToCountry';
import { CAPITAL_TIMEZONES, CAPITAL_DISPLAY_NAMES } from '../data/capitalTimezones';
import { getAllTimezones } from './grouping';

export function isTimezoneInList(timezone: string): boolean {
  return getAllTimezones().some((t) => t.value === timezone);
}

export function normalizeTimezone(value: string): string {
  if (!value) return 'UTC';
  if (value.includes('/')) return value;

  const legacyMap: Record<string, string> = {
    UTC: 'UTC',
    GMT: 'UTC',
    'Eastern Time': 'America/New_York',
    'Central Time': 'America/Chicago',
    'Mountain Time': 'America/Denver',
    'Pacific Time': 'America/Los_Angeles',
    ET: 'America/New_York',
    CT: 'America/Chicago',
    MT: 'America/Denver',
    PT: 'America/Los_Angeles',
  };

  const mapped = legacyMap[value];
  if (mapped) return mapped;

  const allTimezones = getAllTimezones();
  const match = allTimezones.find(
    (tz) =>
      tz.label.toLowerCase() === value.toLowerCase() ||
      tz.value.toLowerCase().endsWith('/' + value.toLowerCase())
  );

  return match?.value || 'UTC';
}

export function getTimezoneCountry(timezone: string): string {
  return TIMEZONE_TO_COUNTRY[timezone] || 'Unknown';
}

export function isCapitalTimezone(timezone: string): boolean {
  const country = TIMEZONE_TO_COUNTRY[timezone];
  if (!country) return false;
  return CAPITAL_TIMEZONES[country] === timezone;
}

export function getCapitalDisplayName(timezone: string): string | undefined {
  return CAPITAL_DISPLAY_NAMES[timezone];
}
