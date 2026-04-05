// Created: 2025-12-28
// Last updated: 2025-12-28

import { useState, useRef, useEffect, useMemo } from 'react';
import { Globe, Search, Check, ChevronDown, ChevronRight, MapPin } from 'lucide-react';
import {
  getAllTimezones,
  getTimezonesByContinent,
  detectUserTimezone,
  getTimezoneOffset,
  isTimezoneInList,
  getTimezoneDisplayLabel,
  getTimezoneCountry,
} from '../lib/timezone';

interface TimezonePickerProps {
  value: string;
  onChange: (timezone: string) => void;
  label?: string;
  helperText?: string;
  className?: string;
}

export default function TimezonePicker({
  value,
  onChange,
  label = 'Timezone',
  helperText,
  className = '',
}: TimezonePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedContinents, setExpandedContinents] = useState<Set<string>>(new Set());
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const detectedTimezone = useMemo(() => detectUserTimezone(), []);
  const allTimezones = useMemo(() => getAllTimezones(), []);
  const timezonesByContinent = useMemo(() => getTimezonesByContinent(), []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const filteredTimezones = useMemo(() => {
    if (!searchQuery.trim()) {
      return null;
    }

    const query = searchQuery.toLowerCase();
    return allTimezones.filter(
      (tz) =>
        tz.value.toLowerCase().includes(query) ||
        tz.label.toLowerCase().includes(query) ||
        tz.country.toLowerCase().includes(query) ||
        tz.continent.toLowerCase().includes(query)
    );
  }, [searchQuery, allTimezones]);

  const handleSelect = (timezone: string) => {
    onChange(timezone);
    setIsOpen(false);
    setSearchQuery('');
  };

  const toggleContinent = (continent: string) => {
    setExpandedContinents((prev) => {
      const next = new Set(prev);
      if (next.has(continent)) {
        next.delete(continent);
      } else {
        next.add(continent);
      }
      return next;
    });
  };

  const toggleCountry = (countryKey: string) => {
    setExpandedCountries((prev) => {
      const next = new Set(prev);
      if (next.has(countryKey)) {
        next.delete(countryKey);
      } else {
        next.add(countryKey);
      }
      return next;
    });
  };

  const getCurrentLabel = () => {
    const label = getTimezoneDisplayLabel(value);
    const offset = getTimezoneOffset(value);
    const country = getTimezoneCountry(value);
    const countryPart = country !== 'Unknown' && country !== 'Other' ? ` - ${country}` : '';
    return offset ? `${label}${countryPart} (${offset})` : `${label}${countryPart}`;
  };

  const renderTimezoneOption = (timezone: string, showDetectedBadge = false) => {
    const tz = allTimezones.find((t) => t.value === timezone);
    const displayLabel =
      tz?.isCapital && tz?.capitalLabel
        ? tz.capitalLabel
        : tz?.label || timezone.split('/').pop() || timezone;
    const offset = getTimezoneOffset(timezone);
    const isSelected = value === timezone;
    const isCapital = tz?.isCapital;

    return (
      <button
        key={timezone}
        type="button"
        onClick={() => handleSelect(timezone)}
        className={`w-full px-3 py-2 text-left flex items-center justify-between gap-2 transition-colors ${
          isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {showDetectedBadge && <MapPin className="w-4 h-4 text-green-600 flex-shrink-0" />}
          <div className="min-w-0">
            <span className="truncate block text-sm">{displayLabel}</span>
          </div>
          {showDetectedBadge && (
            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded flex-shrink-0">
              Detected
            </span>
          )}
          {isCapital && !showDetectedBadge && (
            <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded flex-shrink-0">
              Capital
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-gray-500">{offset}</span>
          {isSelected && <Check className="w-4 h-4 text-blue-600" />}
        </div>
      </button>
    );
  };

  const getCountryTimezoneCount = (countries: Record<string, { value: string }[]>) => {
    return Object.values(countries).reduce((sum, tzs) => sum + tzs.length, 0);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Globe className="w-4 h-4 inline mr-2" />
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-left flex items-center justify-between gap-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
      >
        <span className="truncate text-gray-900">{getCurrentLabel()}</span>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {helperText && <p className="mt-1.5 text-xs text-gray-500">{helperText}</p>}

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search city, country, or timezone..."
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {filteredTimezones ? (
              filteredTimezones.length > 0 ? (
                <div className="py-1">
                  {filteredTimezones.slice(0, 50).map((tz) => (
                    <div key={tz.value}>
                      <div className="px-3 py-1 text-xs text-gray-400">
                        {tz.continent} / {tz.country}
                      </div>
                      {renderTimezoneOption(tz.value, tz.value === detectedTimezone)}
                    </div>
                  ))}
                  {filteredTimezones.length > 50 && (
                    <div className="px-3 py-2 text-center text-gray-500 text-xs">
                      Showing first 50 results. Type more to narrow down.
                    </div>
                  )}
                </div>
              ) : (
                <div className="px-3 py-6 text-center text-gray-500 text-sm">
                  No timezones found
                </div>
              )
            ) : (
              <>
                {detectedTimezone && (
                  <div className="border-b border-gray-100">
                    <div className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50">
                      Your Timezone
                    </div>
                    {renderTimezoneOption(detectedTimezone, true)}
                    {!isTimezoneInList(detectedTimezone) && (
                      <div className="px-3 pb-2 text-xs text-amber-600">
                        Note: Your detected timezone is not in the common list
                      </div>
                    )}
                  </div>
                )}

                {Object.entries(timezonesByContinent).map(([continent, countries]) => {
                  const isContinentExpanded = expandedContinents.has(continent);
                  const countryCount = Object.keys(countries).length;
                  const tzCount = getCountryTimezoneCount(countries);

                  return (
                    <div key={continent} className="border-b border-gray-100 last:border-b-0">
                      <button
                        type="button"
                        onClick={() => toggleContinent(continent)}
                        className="w-full px-3 py-2 text-left flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {isContinentExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                          )}
                          <span className="text-sm font-medium text-gray-700">{continent}</span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {countryCount} {countryCount === 1 ? 'country' : 'countries'}, {tzCount}{' '}
                          zones
                        </span>
                      </button>

                      {isContinentExpanded && (
                        <div className="bg-white">
                          {Object.entries(countries).map(([country, timezones]) => {
                            const countryKey = `${continent}:${country}`;
                            const isCountryExpanded = expandedCountries.has(countryKey);
                            const hasMultipleZones = timezones.length > 1;

                            if (!hasMultipleZones) {
                              return (
                                <div key={countryKey} className="pl-6">
                                  <div className="px-2 py-1 text-xs text-gray-400 font-medium">
                                    {country}
                                  </div>
                                  {renderTimezoneOption(timezones[0].value)}
                                </div>
                              );
                            }

                            return (
                              <div key={countryKey} className="pl-6">
                                <button
                                  type="button"
                                  onClick={() => toggleCountry(countryKey)}
                                  className="w-full px-2 py-1.5 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                                >
                                  <div className="flex items-center gap-1.5">
                                    {isCountryExpanded ? (
                                      <ChevronDown className="w-3 h-3 text-gray-400" />
                                    ) : (
                                      <ChevronRight className="w-3 h-3 text-gray-400" />
                                    )}
                                    <span className="text-xs font-medium text-gray-600">
                                      {country}
                                    </span>
                                  </div>
                                  <span className="text-xs text-gray-400">
                                    {timezones.length} zones
                                  </span>
                                </button>

                                {isCountryExpanded && (
                                  <div className="pl-4">
                                    {timezones.map((tz) => renderTimezoneOption(tz.value))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
