// Created: 2026-04-08
// Provides the useAuth state to the component tree via React Context,
// eliminating prop-drilling of userName / handleSignOut through layout components.

import { createContext, useContext, type ReactNode } from 'react';
import { useAuth, type AuthState } from '../hooks/useAuth';

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

/** Consume auth state anywhere in the tree. Throws if used outside AuthProvider. */
export function useAuthContext(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within <AuthProvider>');
  return ctx;
}
