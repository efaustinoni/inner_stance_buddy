// Created: 2025-12-26
// Last updated: 2025-12-26

import { useState, useEffect } from 'react';
import { User as UserIcon, FileText, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AddToHomeScreenButton from './AddToHomeScreenButton';

export default function WelcomePage() {
  const [displayName, setDisplayName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

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
        console.error('Error loading profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
            <UserIcon className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome{displayName ? `, ${displayName}` : ''}!
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Your account is set up and ready to go. Manage your profile and settings from here.
          </p>
        </div>

        <div className="grid gap-6 max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>

            <div className="space-y-4">
              <a
                href="/profile"
                className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <UserIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    Manage Profile
                  </h3>
                  <p className="text-sm text-gray-600">View and update your personal information</p>
                </div>
              </a>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Install App</h2>
            <AddToHomeScreenButton />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Legal & Privacy</h2>

            <div className="space-y-3">
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 hover:text-blue-600"
              >
                <FileText className="w-5 h-5" />
                <span className="font-medium">Terms of Service</span>
              </a>
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 hover:text-blue-600"
              >
                <Shield className="w-5 h-5" />
                <span className="font-medium">Privacy Policy</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
