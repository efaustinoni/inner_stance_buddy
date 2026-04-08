import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker } from './lib/serviceWorkerRegistration';
import { ErrorBoundary, ToastContainer } from './components/ui';
import { AuthProvider } from './contexts/AuthContext';

registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ErrorBoundary>
        <App />
        <ToastContainer />
      </ErrorBoundary>
    </AuthProvider>
  </StrictMode>
);
