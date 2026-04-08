// Created: 2025-12-21
// Last updated: 2026-04-07 (Phase 2: wouter router + useAuth/useLegalStatus hooks)

import { Switch, Route, Redirect, useLocation } from 'wouter';
import AuthPage from './components/AuthPage';
import ProfilePage from './components/ProfilePage';
import LegalPage from './components/LegalPage';
import LegalAcceptanceBanner from './components/LegalAcceptanceBanner';
import VersionBadge from './components/VersionBadge';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import UpdatePasswordPage from './components/UpdatePasswordPage';
import { DashboardLayout } from './components/layout';
import { DashboardPage, PowerPage, ProgressTrackingPage } from './components/pages';
import { useAuth } from './hooks/useAuth';
import { useLegalStatus } from './hooks/useLegalStatus';

function App() {
  const {
    user,
    isLoadingAuth,
    userName,
    isPasswordRecovery,
    setIsPasswordRecovery,
    handleSignOut,
  } = useAuth();
  const { legalManifest, acceptanceStatus, handleAcceptTerms } = useLegalStatus(user);
  const [location, setLocation] = useLocation();

  function navigate(path: string) {
    setLocation(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handlePasswordUpdateComplete() {
    setIsPasswordRecovery(false);
    setLocation('/');
  }

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

  // Show legal overlay on any protected route (not on public paths)
  const publicPaths = ['/terms', '/privacy', '/signin', '/signup', '/forgot-password'];
  const isPublicPath = publicPaths.some((p) => location.startsWith(p));
  const showLegalOverlay =
    !isPublicPath &&
    !!acceptanceStatus &&
    !!legalManifest &&
    (acceptanceStatus.termsNeedsUpdate || acceptanceStatus.privacyNeedsUpdate);

  return (
    <>
      <Switch>
        {/* Public routes */}
        <Route path="/terms">
          <LegalPage type="terms" />
        </Route>
        <Route path="/privacy">
          <LegalPage type="privacy" />
        </Route>
        <Route path="/forgot-password">
          <ForgotPasswordPage />
        </Route>
        <Route path="/signin">{user ? <Redirect to="/" /> : <AuthPage />}</Route>
        <Route path="/signup">{user ? <Redirect to="/" /> : <AuthPage />}</Route>

        {/* Redirect unauthenticated users away from all remaining routes */}
        {!user && (
          <Route>
            <Redirect to="/signin" />
          </Route>
        )}

        {/* Protected routes */}
        <Route path="/profile">
          <ProfilePage onBack={() => window.history.back()} />
        </Route>
        <Route path="/progress/:trackerId">
          {(params: { trackerId: string }) => (
            <DashboardLayout userName={userName} onNavigate={navigate} onSignOut={handleSignOut}>
              <ProgressTrackingPage trackerId={params.trackerId} onNavigate={navigate} />
            </DashboardLayout>
          )}
        </Route>
        <Route path="/week/:weekId">
          {(params: { weekId: string }) => (
            <DashboardLayout userName={userName} onNavigate={navigate} onSignOut={handleSignOut}>
              <PowerPage weekId={params.weekId} onNavigate={navigate} />
            </DashboardLayout>
          )}
        </Route>
        <Route path="/manage">
          <DashboardLayout userName={userName} onNavigate={navigate} onSignOut={handleSignOut}>
            <PowerPage onNavigate={navigate} />
          </DashboardLayout>
        </Route>

        {/* Catch-all: Dashboard */}
        <Route>
          <DashboardLayout userName={userName} onNavigate={navigate} onSignOut={handleSignOut}>
            <DashboardPage onNavigate={navigate} />
          </DashboardLayout>
        </Route>
      </Switch>

      {/* Legal acceptance overlay — rendered on top of any route */}
      {showLegalOverlay && acceptanceStatus && legalManifest && (
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
