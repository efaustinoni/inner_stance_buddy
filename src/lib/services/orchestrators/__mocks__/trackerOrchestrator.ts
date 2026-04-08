import { vi } from 'vitest';

export const fetchTrackerWithCheckIns = vi
  .fn()
  .mockResolvedValue({ ok: false, error: { code: 'db', message: '' } });
