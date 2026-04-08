// Created: 2025-12-21
// Last updated: 2026-04-08 (split routing → AppRoutes, legal overlay → LegalOverlay)

import { useLocation } from 'wouter';
import VersionBadge from './components/VersionBadge';
import UpdatePasswordPage from './components/UpdatePasswordPage';
import { LegalOverlay } from './components/LegalOverlay';
import { AppRoutes } from './AppRoutes';
import { useAuthContext } from './contexts/AuthContext';
import { useLegalStatus } from './hooks/useLegalStatus';

function App() {
  const { user, isLoadingAuth, isPasswordRecovery, setIsPasswordRecovery, handleSignOut } =
    useAuthContext();
  const { legalManifest, acceptanceStatus, handleAcceptTerms } = useLegalStatus(user);
  const [, setLocation] = useLocation();

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

  return (
    <>
      <AppRoutes onNavigate={navigate} />
      <LegalOverlay
        acceptanceStatus={acceptanceStatus}
        legalManifest={legalManifest}
        onAccept={handleAcceptTerms}
        onSignOut={handleSignOut}
      />
      <VersionBadge />
    </>
  );
}

export default App;
