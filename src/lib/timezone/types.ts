// Created: 2025-12-28
// Last updated: 2025-12-28

export interface TimezoneOption {
  value: string;
  label: string;
  capitalLabel?: string;
  country: string;
  continent: string;
  isCapital?: boolean;
}

export interface CountryGroup {
  country: string;
  continent: string;
  timezones: TimezoneOption[];
}

export interface FormatOptions {
  dateStyle?: 'full' | 'long' | 'medium' | 'short';
  timeStyle?: 'full' | 'long' | 'medium' | 'short';
}
