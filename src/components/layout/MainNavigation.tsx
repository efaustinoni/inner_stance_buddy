// Created: 2026-02-13
// Last Updated: 2026-02-13 15:35

import { BookOpen } from 'lucide-react';
import { Avatar } from '../ui/Avatar';

interface MainNavigationProps {
  userName?: string;
  userAvatar?: string | null;
  onNavigate: (path: string) => void;
}

export function MainNavigation({
  userName,
  userAvatar,
  onNavigate,
}: MainNavigationProps) {
  return (
    <header className="bg-navy-900 border-b border-navy-800 sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center gap-3"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-accent-gold to-yellow-600">
              <BookOpen size={20} className="text-white" />
            </div>
            <span className="text-lg font-semibold text-content-inverse hidden sm:block">
              Exercise Journal
            </span>
          </button>

          <button
            onClick={() => onNavigate('/profile')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-navy-800 transition-colors"
          >
            <Avatar src={userAvatar} name={userName} size="sm" />
            <span className="text-sm text-content-muted hidden md:block">{userName}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
