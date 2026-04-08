import { vi } from 'vitest';

export const fetchDashboardData = vi.fn().mockResolvedValue({ weeks: [], questions: [] });
