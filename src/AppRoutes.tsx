// Created: 2026-04-08
// Owns the entire route tree. App.tsx is responsible for auth/legal state;
// this component is responsible only for mapping paths to pages.

import { Switch, Route, Redirect } from 'wouter';
import AuthPage from './components/AuthPage';
import ProfilePage from './components/ProfilePage';
import LegalPage from './components/LegalPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import { DashboardLayout } from './components/layout';
import { DashboardPage, PowerPage, ProgressTrackingPage } from './components/pages';
import { useAuthContext } from './contexts/AuthContext';

interface AppRoutesProps {
  onNavigate: (path: string) => void;
}

export function AppRoutes({ onNavigate }: AppRoutesProps) {
  const { user } = useAuthContext();

  return (
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
          <DashboardLayout onNavigate={onNavigate}>
            <ProgressTrackingPage trackerId={params.trackerId} onNavigate={onNavigate} />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/week/:weekId">
        {(params: { weekId: string }) => (
          <DashboardLayout onNavigate={onNavigate}>
            <PowerPage weekId={params.weekId} onNavigate={onNavigate} />
          </DashboardLayout>
        )}
      </Route>
      <Route path="/manage">
        <DashboardLayout onNavigate={onNavigate}>
          <PowerPage onNavigate={onNavigate} />
        </DashboardLayout>
      </Route>

      {/* Catch-all: Dashboard */}
      <Route>
        <DashboardLayout onNavigate={onNavigate}>
          <DashboardPage onNavigate={onNavigate} />
        </DashboardLayout>
      </Route>
    </Switch>
  );
}
