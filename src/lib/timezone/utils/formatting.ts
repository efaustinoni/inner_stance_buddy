// Created: 2025-12-28
// Last updated: 2025-12-28

import type { FormatOptions } from '../types';

export function prettifyTimezoneName(timezone: string): string {
  if (timezone === 'UTC') return 'UTC';
  const parts = timezone.split('/');
  const city = parts[parts.length - 1];
  return city.replace(/_/g, ' ');
}

export function getTimezoneOffset(timezone: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'shortOffset',
    });
    const parts = formatter.formatToParts(now);
    const offsetPart = parts.find((p) => p.type === 'timeZoneName');
    if (offsetPart) {
      return offsetPart.value.replace('GMT', 'UTC');
    }
    return '';
  } catch {
    return '';
  }
}

export function getTimezoneWithOffset(timezone: string): string {
  const label = prettifyTimezoneName(timezone);
  const offset = getTimezoneOffset(timezone);
  return offset ? `${label} (${offset})` : label;
}

export function formatInUserTimezone(
  date: Date | string,
  timezone: string,
  options: FormatOptions = { dateStyle: 'medium', timeStyle: 'short' }
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  try {
    return new Intl.DateTimeFormat('en-US', {
      ...options,
      timeZone: timezone,
    }).format(dateObj);
  } catch {
    return dateObj.toLocaleString();
  }
}
