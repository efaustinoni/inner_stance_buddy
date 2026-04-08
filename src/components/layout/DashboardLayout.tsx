// Created: 2026-02-13
// Last Updated: 2026-04-08 (auth state consumed from AuthContext)

import { type ReactNode } from 'react';
import { MainNavigation } from './MainNavigation';

interface DashboardLayoutProps {
  onNavigate: (path: string) => void;
  children: ReactNode;
}

export function DashboardLayout({ onNavigate, children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-navy-900">
      <MainNavigation onNavigate={onNavigate} />
      <main className="pb-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</div>
      </main>
    </div>
  );
}
