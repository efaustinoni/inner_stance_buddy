// Created: 2025-12-22
// Last updated: 2025-12-22 (removed dismiss, added sign out option)

import { useState } from 'react';
import { FileText, Check, Loader2, LogOut } from 'lucide-react';
import { formatDate, type AcceptanceStatus, type LegalManifest } from '../lib/legalService';

interface LegalAcceptanceBannerProps {
  status: AcceptanceStatus;
  manifest: LegalManifest;
  onAccept: () => Promise<void>;
  onSignOut: () => void;
}

export default function LegalAcceptanceBanner({
  status,
  manifest,
  onAccept,
  onSignOut,
}: LegalAcceptanceBannerProps) {
  const [accepting, setAccepting] = useState(false);

  const needsUpdate = status.termsNeedsUpdate || status.privacyNeedsUpdate;
  const isBlocking = status.requiresAcceptance && needsUpdate;

  if (!needsUpdate) return null;

  async function handleAccept() {
    setAccepting(true);
    try {
      await onAccept();
    } finally {
      setAccepting(false);
    }
  }

  function handleViewTerms() {
    window.history.pushState({}, '', '/terms');
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  function handleViewPrivacy() {
    window.history.pushState({}, '', '/privacy');
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  const updateMessages: string[] = [];
  if (status.termsNeedsUpdate && status.termsLastUpdated) {
    updateMessages.push(`Terms of Service (${formatDate(status.termsLastUpdated)})`);
  }
  if (status.privacyNeedsUpdate && status.privacyLastUpdated) {
    updateMessages.push(`Privacy Policy (${formatDate(status.privacyLastUpdated)})`);
  }

  if (isBlocking) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-semibold text-slate-800 text-center mb-2">
            Updated Legal Documents
          </h2>
          <p className="text-slate-600 text-center mb-6">
            We've updated our legal documents. Please review and accept them to continue using the app.
          </p>

          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-slate-600 mb-3">Updated documents:</p>
            <ul className="space-y-2">
              {status.termsNeedsUpdate && (
                <li className="flex items-center justify-between">
                  <span className="text-slate-800">Terms of Service</span>
                  <button
                    onClick={handleViewTerms}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    View
                  </button>
                </li>
              )}
              {status.privacyNeedsUpdate && (
                <li className="flex items-center justify-between">
                  <span className="text-slate-800">Privacy Policy</span>
                  <button
                    onClick={handleViewPrivacy}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    View
                  </button>
                </li>
              )}
            </ul>
          </div>

          <button
            onClick={handleAccept}
            disabled={accepting}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {accepting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Accepting...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                I Accept the Updated Terms
              </>
            )}
          </button>
          <button
            onClick={onSignOut}
            className="w-full mt-3 py-3 border border-slate-300 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            Sign Out Instead
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200 p-4">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-blue-100 rounded-lg shrink-0">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-800 font-medium">
              We've updated our {updateMessages.join(' and ')}
            </p>
            <p className="text-sm text-slate-600 mt-1">
              Please review the changes and accept to continue.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex gap-2">
              {status.termsNeedsUpdate && (
                <button
                  onClick={handleViewTerms}
                  className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  View Terms
                </button>
              )}
              {status.privacyNeedsUpdate && (
                <button
                  onClick={handleViewPrivacy}
                  className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  View Privacy
                </button>
              )}
            </div>
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {accepting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Accept'
              )}
            </button>
            <button
              onClick={onSignOut}
              className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
