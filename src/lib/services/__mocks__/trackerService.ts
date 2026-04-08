import { vi } from 'vitest';

export const createProgressTracker = vi
  .fn()
  .mockResolvedValue({ ok: false, error: { code: 'db', message: '' } });
export const getTrackerForQuestion = vi.fn().mockResolvedValue(null);
export const fetchUserTrackers = vi.fn().mockResolvedValue([]);
export const toggleCheckIn = vi.fn().mockResolvedValue(true);
export const deleteProgressTracker = vi.fn().mockResolvedValue(true);
export const updateCheckInNotes = vi.fn().mockResolvedValue(true);
