import { vi } from 'vitest';

export const saveAnswer = vi.fn().mockResolvedValue({ ok: true, data: undefined });
