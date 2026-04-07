// Created: 2025-12-21
// Last updated: 2026-04-07 (error toast on legal acceptance failure)

import { useEffect, useState } from 'react';
import { toast } from './lib/toast';
import { supabase } from './lib/supabase';
import { detectUserTimezone } from './lib/timezone';
import AuthPage from './components/AuthPage';
import ProfilePage from './components/ProfilePage';
import LegalPage from './components/LegalPage';
import LegalAcceptanceBanner from './components/LegalAcceptanceBanner';
import VersionBadge from './components/VersionBadge';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import UpdatePasswordPage from './components/UpdatePasswordPage';
import { DashboardLayout } from './components/layout';
import { DashboardPage, PowerPage, ProgressTrackingPage } from './components/pages';
import {
  fetchLegalManifest,
  checkAcceptanceStatus,
  recordUserAgreement,
  setLocalAcceptance,
  type LegalManifest,
  type AcceptanceStatus,
} from './lib/legalService';
import type { User } from '@supabase/supabase-js';

function App() {
  const [route, setRoute] = useState(window.location.pathname);
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [legalManifest, setLegalManifest] = useState<LegalManifest | null>(null);
  const [acceptanceStatus, setAcceptanceStatus] = useState<AcceptanceStatus | null>(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [userName, setUserName] = useState<string>('');

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

  useEffect(() => {
    loadLegalStatus();
  }, [user]);

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

  async function loadLegalStatus() {
    const manifest = await fetchLegalManifest();
    if (!manifest) return;

    setLegalManifest(manifest);

    const status = await checkAcceptanceStatus(user?.id ?? null, manifest);
    setAcceptanceStatus(status);
  }

  useEffect(() => {
    const handlePopState = () => {
      setRoute(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);

    const originalPushState = window.history.pushState;
    window.history.pushState = function (...args) {
      originalPushState.apply(window.history, args);
      setRoute(window.location.pathname);
    };

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.history.pushState = originalPushState;
    };
  }, []);

  async function handleAcceptTerms() {
    if (!legalManifest) return;

    if (user) {
      const success = await recordUserAgreement(user.id, legalManifest);
      if (success) {
        setAcceptanceStatus(null);
      } else {
        toast.error('Failed to record your acceptance. Please try again.');
      }
    } else {
      setLocalAcceptance(legalManifest);
      setAcceptanceStatus(null);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = '/signin';
  }

  function handlePasswordUpdateComplete() {
    setIsPasswordRecovery(false);
    window.history.pushState({}, '', '/');
  }

  function navigate(path: string) {
    window.history.pushState({}, '', path);
    setRoute(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const profileMatch = route === '/profile';
  const authMatch = route === '/signin' || route === '/signup';
  const termsMatch = route === '/terms';
  const privacyMatch = route === '/privacy';
  const forgotPasswordMatch = route === '/forgot-password';
  const progressMatch = route.startsWith('/progress/');
  const trackerId = progressMatch ? route.split('/progress/')[1] : null;
  const weekMatch = route.startsWith('/week/');
  const weekId = weekMatch ? route.split('/week/')[1].split('?')[0] : null;
  const manageMatch = route === '/manage';

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isPasswordRecovery && user) {
    return (
      <>
        <UpdatePasswordPage onComplete={handlePasswordUpdateComplete} />
        <VersionBadge />
      </>
    );
  }

  if (termsMatch) {
    return (
      <>
        <LegalPage type="terms" />
        <VersionBadge />
      </>
    );
  }

  if (privacyMatch) {
    return (
      <>
        <LegalPage type="privacy" />
        <VersionBadge />
      </>
    );
  }

  if (forgotPasswordMatch) {
    return (
      <>
        <ForgotPasswordPage />
        <VersionBadge />
      </>
    );
  }

  const showBlockingAcceptance =
    acceptanceStatus &&
    legalManifest &&
    acceptanceStatus.requiresAcceptance &&
    (acceptanceStatus.termsNeedsUpdate || acceptanceStatus.privacyNeedsUpdate) &&
    !termsMatch &&
    !privacyMatch &&
    !authMatch;

  const showBanner =
    acceptanceStatus &&
    legalManifest &&
    !acceptanceStatus.requiresAcceptance &&
    (acceptanceStatus.termsNeedsUpdate || acceptanceStatus.privacyNeedsUpdate) &&
    !termsMatch &&
    !privacyMatch &&
    !authMatch;

  if (authMatch) {
    if (user) {
      window.location.href = '/';
      return null;
    }
    return (
      <>
        <AuthPage />
        <VersionBadge />
      </>
    );
  }

  if (!user) {
    window.location.href = '/signin';
    return null;
  }

  if (profileMatch) {
    return (
      <>
        <ProfilePage onBack={() => window.history.back()} />
        <VersionBadge />
      </>
    );
  }

  return (
    <>
      <DashboardLayout userName={userName} onNavigate={navigate} onSignOut={handleSignOut}>
        {progressMatch && trackerId ? (
          <ProgressTrackingPage trackerId={trackerId} onNavigate={navigate} />
        ) : weekMatch && weekId ? (
          <PowerPage weekId={weekId} onNavigate={navigate} />
        ) : manageMatch ? (
          <PowerPage onNavigate={navigate} />
        ) : (
          <DashboardPage onNavigate={navigate} />
        )}
      </DashboardLayout>

      {showBlockingAcceptance && (
        <LegalAcceptanceBanner
          status={acceptanceStatus}
          manifest={legalManifest}
          onAccept={handleAcceptTerms}
          onSignOut={handleSignOut}
        />
      )}

      {showBanner && (
        <LegalAcceptanceBanner
          status={acceptanceStatus}
          manifest={legalManifest}
          onAccept={handleAcceptTerms}
          onSignOut={handleSignOut}
        />
      )}

      <VersionBadge />
    </>
  );
}

export default App;
