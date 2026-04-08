// Created: 2026-04-07
// Last Updated: 2026-04-07

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { detectUserTimezone } from '../lib/timezone';
import { toast } from '../lib/toast';

export interface AuthState {
  user: User | null;
  isLoadingAuth: boolean;
  userName: string;
  isPasswordRecovery: boolean;
  setIsPasswordRecovery: (value: boolean) => void;
  handleSignOut: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [userName, setUserName] = useState<string>('');
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);
        if (user) {
          loadUserProfile(user.id);
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setIsLoadingAuth(false);
      }
    };

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
      }
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadUserProfile(userId: string) {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('display_name')
        .eq('id', userId)
        .maybeSingle();

      if (profile?.display_name) {
        setUserName(profile.display_name);
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUserName(user?.email?.split('@')[0] || 'User');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }

  // Auto-fill timezone if the profile still has the default UTC value
  useEffect(() => {
    async function fillTimezoneIfMissing() {
      if (!user) return;

      try {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('timezone')
          .eq('id', user.id)
          .maybeSingle();

        if (profile && profile.timezone === 'UTC') {
          const detectedTz = detectUserTimezone();
          if (detectedTz && detectedTz !== 'UTC') {
            await supabase
              .from('user_profiles')
              .update({ timezone: detectedTz, updated_at: new Date().toISOString() })
              .eq('id', user.id);
          }
        }
      } catch (error) {
        console.error('Error checking/updating timezone:', error);
      }
    }

    fillTimezoneIfMissing();
  }, [user]);

  // Sign out — router handles redirect when user becomes null
  async function handleSignOut() {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out. Please try again.');
    }
  }

  return {
    user,
    isLoadingAuth,
    userName,
    isPasswordRecovery,
    setIsPasswordRecovery,
    handleSignOut,
  };
}
