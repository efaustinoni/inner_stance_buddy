// Created: 2025-12-28
// Last updated: 2025-12-28

import type { TimezoneOption } from '../types';
import { TIMEZONE_TO_COUNTRY } from '../data/timezoneToCountry';
import { COUNTRY_TO_CONTINENT, CONTINENT_ORDER } from '../data/countryToContinent';
import { CAPITAL_TIMEZONES, CAPITAL_DISPLAY_NAMES } from '../data/capitalTimezones';
import { prettifyTimezoneName } from './formatting';

let cachedTimezones: TimezoneOption[] | null = null;

function getAllIANATimezones(): string[] {
  if (typeof Intl !== 'undefined' && 'supportedValuesOf' in Intl) {
    try {
      return (
        Intl as unknown as { supportedValuesOf: (key: string) => string[] }
      ).supportedValuesOf('timeZone');
    } catch {
      // Fallback below
    }
  }
  return Object.keys(TIMEZONE_TO_COUNTRY);
}

export function getAllTimezones(): TimezoneOption[] {
  if (cachedTimezones) {
    return cachedTimezones;
  }

  const ianaZones = getAllIANATimezones();
  const timezones: TimezoneOption[] = [];

  for (const tz of ianaZones) {
    if (tz.startsWith('Etc/')) continue;

    const country = TIMEZONE_TO_COUNTRY[tz] || 'Other';
    const continent = COUNTRY_TO_CONTINENT[country] || 'Other';
    const isCapital = CAPITAL_TIMEZONES[country] === tz;
    const capitalLabel = isCapital ? CAPITAL_DISPLAY_NAMES[tz] : undefined;

    timezones.push({
      value: tz,
      label: prettifyTimezoneName(tz),
      capitalLabel,
      country,
      continent,
      isCapital,
    });
  }

  timezones.push({
    value: 'UTC',
    label: 'UTC',
    country: 'Universal',
    continent: 'Other',
    isCapital: false,
  });

  timezones.sort((a, b) => {
    const continentOrderA = CONTINENT_ORDER.indexOf(a.continent);
    const continentOrderB = CONTINENT_ORDER.indexOf(b.continent);
    if (continentOrderA !== continentOrderB) {
      return (
        (continentOrderA === -1 ? 999 : continentOrderA) -
        (continentOrderB === -1 ? 999 : continentOrderB)
      );
    }
    if (a.country !== b.country) {
      return a.country.localeCompare(b.country);
    }
    if (a.isCapital !== b.isCapital) {
      return a.isCapital ? -1 : 1;
    }
    return a.label.localeCompare(b.label);
  });

  cachedTimezones = timezones;
  return timezones;
}

export const TIMEZONES = getAllTimezones();

export function getTimezonesByContinent(): Record<string, Record<string, TimezoneOption[]>> {
  const timezones = getAllTimezones();
  const result: Record<string, Record<string, TimezoneOption[]>> = {};

  for (const tz of timezones) {
    if (!result[tz.continent]) {
      result[tz.continent] = {};
    }
    if (!result[tz.continent][tz.country]) {
      result[tz.continent][tz.country] = [];
    }
    result[tz.continent][tz.country].push(tz);
  }

  const ordered: Record<string, Record<string, TimezoneOption[]>> = {};
  for (const continent of CONTINENT_ORDER) {
    if (result[continent]) {
      const countries = Object.keys(result[continent]).sort();
      ordered[continent] = {};
      for (const country of countries) {
        ordered[continent][country] = result[continent][country];
      }
    }
  }

  return ordered;
}

export function getTimezonesByRegion(): Record<string, TimezoneOption[]> {
  const timezones = getAllTimezones();
  const grouped: Record<string, TimezoneOption[]> = {};

  for (const tz of timezones) {
    if (!grouped[tz.continent]) {
      grouped[tz.continent] = [];
    }
    grouped[tz.continent].push(tz);
  }

  const ordered: Record<string, TimezoneOption[]> = {};
  for (const continent of CONTINENT_ORDER) {
    if (grouped[continent]) {
      ordered[continent] = grouped[continent];
    }
  }

  return ordered;
}

export function getTimezoneLabel(value: string): string {
  const tz = getAllTimezones().find((t) => t.value === value);
  return tz ? tz.label : prettifyTimezoneName(value);
}

export function getTimezoneDisplayLabel(timezone: string): string {
  const tz = getAllTimezones().find((t) => t.value === timezone);
  if (tz?.isCapital && tz?.capitalLabel) {
    return tz.capitalLabel;
  }
  return tz?.label || timezone.split('/').pop()?.replace(/_/g, ' ') || timezone;
}
