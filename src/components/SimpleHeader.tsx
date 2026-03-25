// Created: 2025-12-26
// Last updated: 2025-12-28

import { useState, useEffect } from 'react';
import { LogOut, User as UserIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { appConfig } from '../lib/appConfig';
import type { User } from '@supabase/supabase-js';

export default function SimpleHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState<string>('User');
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('display_name')
            .eq('id', user.id)
            .maybeSingle();

          if (profile?.display_name) {
            setDisplayName(profile.display_name);
          } else {
            setDisplayName(user.email?.split('@')[0] || 'User');
          }
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUser();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await supabase.auth.signOut();
      window.location.href = '/signin';
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsSigningOut(false);
    }
  };

  if (isLoading || !user) {
    return null;
  }

  const currentPath = window.location.pathname;

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <a
          href="/"
          className="flex items-center gap-2 text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors"
        >
          <div className={`w-8 h-8 ${appConfig.branding.logoBackgroundColor} rounded-lg flex items-center justify-center`}>
            <span className={`${appConfig.branding.logoTextColor} font-bold text-sm`}>{appConfig.branding.appInitials}</span>
          </div>
          <span>{appConfig.branding.appName}</span>
        </a>

        <div className="flex items-center gap-3">
          <a
            href="/profile"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              currentPath === '/profile'
                ? 'bg-blue-50 text-blue-600'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
            title="View profile"
          >
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-sm font-medium max-w-[150px] truncate">
              {displayName}
            </span>
          </a>
          <div className="w-px h-6 bg-gray-200" />
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
