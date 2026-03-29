// Created: 2026-02-13
// Last Updated: 2026-02-13 15:35

import { type ReactNode } from 'react';
import { MainNavigation } from './MainNavigation';

interface DashboardLayoutProps {
  userName?: string;
  userAvatar?: string | null;
  onNavigate: (path: string) => void;
  onSignOut: () => void;
  children: ReactNode;
}

export function DashboardLayout({
  userName,
  userAvatar,
  onNavigate,
  onSignOut,
  children,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-navy-900">
      <MainNavigation
        userName={userName}
        userAvatar={userAvatar}
        onNavigate={onNavigate}
        onSignOut={onSignOut}
      />
      <main className="pb-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
