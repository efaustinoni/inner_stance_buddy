// Created: 2026-04-08
// Tests: withRetry — retry behaviour, backoff, and isTransientResult predicate

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withRetry, isTransientResult } from './withRetry';

// Speed up tests by replacing real timers
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('withRetry', () => {
  it('returns the result immediately when it succeeds on the first attempt', async () => {
    const fn = vi.fn().mockResolvedValue(true);

    const resultPromise = withRetry(fn, (r) => !r);
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result).toBe(true);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries and returns success on the second attempt', async () => {
    const fn = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);

    const resultPromise = withRetry(fn, (r) => !r);
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result).toBe(true);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('stops retrying after the configured number of attempts and returns final failure', async () => {
    const fn = vi.fn().mockResolvedValue(false);

    const resultPromise = withRetry(fn, (r) => !r, { attempts: 3 });
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result).toBe(false);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('respects attempts=1 (no retry)', async () => {
    const fn = vi.fn().mockResolvedValue(false);

    const resultPromise = withRetry(fn, (r) => !r, { attempts: 1 });
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result).toBe(false);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('uses exponential backoff between attempts', async () => {
    const fn = vi
      .fn()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    const delays: number[] = [];
    const advanceSpy = vi.spyOn(globalThis, 'setTimeout').mockImplementation((cb, delay) => {
      delays.push(delay as number);
      (cb as () => void)();
      return 0 as unknown as ReturnType<typeof setTimeout>;
    });

    await withRetry(fn, (r) => !r, { attempts: 3, delayMs: 200 });

    expect(delays).toEqual([200, 400]);
    advanceSpy.mockRestore();
  });
});

describe('isTransientResult', () => {
  it('returns false for a successful result', () => {
    expect(isTransientResult({ ok: true })).toBe(false);
  });

  it('returns true for a db error (transient)', () => {
    expect(isTransientResult({ ok: false, error: { code: 'db' } })).toBe(true);
  });

  it('returns true for a network error (transient)', () => {
    expect(isTransientResult({ ok: false, error: { code: 'network' } })).toBe(true);
  });

  it('returns false for an auth error (permanent — retrying never helps)', () => {
    expect(isTransientResult({ ok: false, error: { code: 'auth' } })).toBe(false);
  });
});
