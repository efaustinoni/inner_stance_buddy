import { vi } from 'vitest';

export const fetchUserQuarters = vi.fn().mockResolvedValue([]);
export const createQuarter = vi.fn().mockResolvedValue(null);
export const updateQuarter = vi.fn().mockResolvedValue(true);
export const deleteQuarter = vi.fn().mockResolvedValue(true);
