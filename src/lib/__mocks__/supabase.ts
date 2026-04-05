import { vi } from 'vitest';

const chain = () => {
  const q: Record<string, ReturnType<typeof vi.fn>> = {};
  const sync = [
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'neq',
    'order',
    'limit',
    'in',
    'is',
    'filter',
    'not',
    'or',
  ];
  sync.forEach((m) => {
    q[m] = vi.fn().mockReturnValue(q);
  });
  q['single'] = vi.fn().mockResolvedValue({ data: null, error: null });
  q['maybeSingle'] = vi.fn().mockResolvedValue({ data: null, error: null });
  return q;
};

export const supabase = {
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signInWithPassword: vi
      .fn()
      .mockResolvedValue({ data: { user: null, session: null }, error: null }),
    signUp: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: vi
      .fn()
      .mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    updateUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    resetPasswordForEmail: vi.fn().mockResolvedValue({ data: {}, error: null }),
  },
  from: vi.fn().mockImplementation(() => chain()),
};
