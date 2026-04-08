// Created: 2026-04-08
// Extracted from AuthPage.tsx.
// Shown after sign-up when the user must verify their email before proceeding.

import { Mail, Loader2, RefreshCw, CheckCircle } from 'lucide-react';
import { appConfig } from '../../lib/appConfig';

interface VerificationScreenProps {
  verificationEmail: string;
  error: string | null;
  isResending: boolean;
  resendSuccess: boolean;
  onResend: () => void;
  onBack: () => void;
}

export function VerificationScreen({
  verificationEmail,
  error,
  isResending,
  resendSuccess,
  onResend,
  onBack,
}: VerificationScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img
              src={appConfig.branding.logoIconPath}
              alt={appConfig.branding.appName}
              className="w-56 h-56 object-contain"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
              <Mail className="w-8 h-8 text-emerald-600" />
            </div>

            <h2 className="text-xl font-bold text-gray-900">Check Your Email</h2>

            <p className="text-gray-600 text-sm leading-relaxed">
              We sent a verification link to{' '}
              <strong className="text-gray-800">{verificationEmail}</strong>. Please check your
              inbox and click the link to activate your account.
            </p>

            <p className="text-gray-500 text-xs">
              The link will expire after 24 hours. Check your spam folder if you don&apos;t see it.
            </p>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {resendSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Verification email resent successfully
              </div>
            )}

            <div className="pt-2 space-y-3">
              <button
                onClick={onResend}
                disabled={isResending}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Resend Verification Email
                  </>
                )}
              </button>

              <button
                onClick={onBack}
                className="w-full text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors py-2"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
