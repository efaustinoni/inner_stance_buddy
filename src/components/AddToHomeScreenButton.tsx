// Created: 2025-12-23
// Last updated: 2025-12-23

import { useState, useEffect } from 'react';
import { Pin, Share, PlusSquare, X, Check, MoreVertical } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type Platform = 'ios' | 'android' | 'desktop';

interface DebugInfo {
  manifestLinked: boolean;
  serviceWorkerControlling: boolean;
  beforeInstallPromptFired: boolean;
  displayMode: string;
}

export default function AddToHomeScreenButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [platform, setPlatform] = useState<Platform>('desktop');
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    manifestLinked: false,
    serviceWorkerControlling: false,
    beforeInstallPromptFired: false,
    displayMode: 'browser',
  });

  const isDev = import.meta.env.DEV;

  useEffect(() => {
    const standaloneQuery = window.matchMedia('(display-mode: standalone)');
    const isInStandaloneMode =
      standaloneQuery.matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    setIsStandalone(isInStandaloneMode);

    const ua = navigator.userAgent.toLowerCase();
    const isIOS =
      /iphone|ipad|ipod/.test(ua) && !(window as Window & { MSStream?: unknown }).MSStream;
    const isAndroid = /android/.test(ua);

    if (isIOS) {
      setPlatform('ios');
    } else if (isAndroid) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    const manifestLink = document.querySelector('link[rel="manifest"]');
    setDebugInfo((prev) => ({
      ...prev,
      manifestLinked: !!manifestLink,
      serviceWorkerControlling: !!navigator.serviceWorker?.controller,
      displayMode: isInStandaloneMode ? 'standalone' : 'browser',
    }));

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setDebugInfo((prev) => ({ ...prev, beforeInstallPromptFired: true }));
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
      setShowModal(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (outcome === 'accepted') {
        setIsStandalone(true);
        setShowModal(false);
      }
    }
  };

  const handleButtonClick = () => {
    if (deferredPrompt) {
      handleInstallClick();
    } else {
      setShowModal(true);
    }
  };

  if (isStandalone) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
          <Check className="w-4 h-4 text-green-600" />
        </div>
        <span className="text-sm text-green-800">App installed</span>
      </div>
    );
  }

  const renderIOSInstructions = () => (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">Follow these steps in Safari:</p>
      <div className="space-y-3">
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-blue-600">
            1
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900 flex items-center gap-2">
              Tap the Share button
              <Share className="w-5 h-5 text-blue-600" />
            </p>
            <p className="text-sm text-gray-500 mt-0.5">Located at the bottom of Safari</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-blue-600">
            2
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900 flex items-center gap-2">
              Select "Add to Home Screen"
              <PlusSquare className="w-5 h-5 text-blue-600" />
            </p>
            <p className="text-sm text-gray-500 mt-0.5">Scroll down in the share menu</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-blue-600">
            3
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">Tap "Add"</p>
            <p className="text-sm text-gray-500 mt-0.5">Confirm to add the app icon</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAndroidInstructions = () => (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">Follow these steps in Chrome:</p>
      <div className="space-y-3">
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-blue-600">
            1
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900 flex items-center gap-2">
              Tap the menu button
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </p>
            <p className="text-sm text-gray-500 mt-0.5">Three dots in the top right corner</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-blue-600">
            2
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">Select "Add to Home screen"</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-blue-600">
            3
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">Tap "Add"</p>
            <p className="text-sm text-gray-500 mt-0.5">Confirm to add the app icon</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDesktopInstructions = () => (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 mb-4">Chrome (Windows):</p>
      <div className="space-y-3">
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-blue-600">
            1
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900 flex items-center gap-2">
              <MoreVertical className="w-5 h-5 text-gray-600" />
              <span className="text-gray-500 mx-1">&rarr;</span>
              Cast, save, and share
              <span className="text-gray-500 mx-1">&rarr;</span>
              Create shortcut...
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-blue-600">
            2
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">Enable "Open as window"</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-blue-600">
            3
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">Click Create</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDebugSection = () => {
    if (!isDev) return null;
    return (
      <div className="mt-4 p-3 bg-gray-100 rounded-lg text-xs font-mono">
        <p className="font-bold text-gray-700 mb-2">Debug Info</p>
        <ul className="space-y-1 text-gray-600">
          <li>manifest linked: {debugInfo.manifestLinked ? 'true' : 'false'}</li>
          <li>
            service worker controlling: {debugInfo.serviceWorkerControlling ? 'true' : 'false'}
          </li>
          <li>
            beforeinstallprompt fired: {debugInfo.beforeInstallPromptFired ? 'true' : 'false'}
          </li>
          <li>display-mode: {debugInfo.displayMode}</li>
        </ul>
      </div>
    );
  };

  return (
    <>
      <button
        onClick={handleButtonClick}
        className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors text-left"
      >
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Pin className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <span className="font-medium text-gray-900 block">Add a shortcut</span>
          <span className="text-sm text-gray-500">Pin this app for faster access</span>
        </div>
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Pin className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Add a shortcut</h3>
                    <p className="text-sm text-gray-500">Pin this app for faster access</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {deferredPrompt ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Click below to add this app as a shortcut for quick access.
                  </p>
                  <button
                    onClick={handleInstallClick}
                    className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Add shortcut
                  </button>
                </div>
              ) : (
                <>
                  {platform === 'ios' && renderIOSInstructions()}
                  {platform === 'android' && renderAndroidInstructions()}
                  {platform === 'desktop' && renderDesktopInstructions()}
                </>
              )}

              {renderDebugSection()}

              <button
                onClick={() => setShowModal(false)}
                className="w-full mt-6 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
