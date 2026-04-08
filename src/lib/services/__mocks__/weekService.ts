import { vi } from 'vitest';

export const fetchUserWeeks = vi.fn().mockResolvedValue([]);
export const fetchWeekWithQuestions = vi.fn().mockResolvedValue(null);
export const createWeek = vi.fn().mockResolvedValue(null);
export const updateWeek = vi.fn().mockResolvedValue(true);
export const deleteWeek = vi.fn().mockResolvedValue(true);
export const moveWeekToQuarter = vi.fn().mockResolvedValue(true);
