// Created: 2026-04-08
// Tests: useAuth — loading / success / error / signOut / auth state change

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

vi.mock('../lib/supabase');
vi.mock('../lib/timezone');

const mockUser = { id: 'u1', email: 'test@example.com' };

describe('useAuth', () => {
  beforeEach(() => vi.clearAllMocks());

  it('starts in loading state', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isLoadingAuth).toBe(true);
  });

  it('sets loading to false when no user is authenticated', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as never);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.isLoadingAuth).toBe(false));

    expect(result.current.user).toBeNull();
  });

  it('sets user and resolves loading on successful auth', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    } as never);
    // Stub out profile fetch — no display_name
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    } as never);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.isLoadingAuth).toBe(false));

    expect(result.current.user).toEqual(mockUser);
  });

  it('sets loading to false even when getUser throws', async () => {
    vi.mocked(supabase.auth.getUser).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.isLoadingAuth).toBe(false));

    expect(result.current.user).toBeNull();
  });

  it('calls supabase.auth.signOut when handleSignOut is called', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as never);

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.isLoadingAuth).toBe(false));

    await act(async () => {
      await result.current.handleSignOut();
    });

    expect(supabase.auth.signOut).toHaveBeenCalled();
  });

  it('updates user when onAuthStateChange fires', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as never);

    // Capture the auth callback so we can trigger it manually
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let capturedCallback: ((event: any, session: any) => void) | null = null;
    vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((cb) => {
      capturedCallback = cb as typeof capturedCallback;
      return { data: { subscription: { unsubscribe: vi.fn() } } } as never;
    });

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.isLoadingAuth).toBe(false));

    // Simulate a SIGNED_IN event
    act(() => {
      capturedCallback?.('SIGNED_IN', { user: mockUser });
    });

    expect(result.current.user).toEqual(mockUser);
  });

  it('sets isPasswordRecovery when PASSWORD_RECOVERY event fires', async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as never);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let capturedCallback: ((event: any, session: any) => void) | null = null;
    vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((cb) => {
      capturedCallback = cb as typeof capturedCallback;
      return { data: { subscription: { unsubscribe: vi.fn() } } } as never;
    });

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.isLoadingAuth).toBe(false));

    act(() => {
      capturedCallback?.('PASSWORD_RECOVERY', null);
    });

    expect(result.current.isPasswordRecovery).toBe(true);
  });
});
