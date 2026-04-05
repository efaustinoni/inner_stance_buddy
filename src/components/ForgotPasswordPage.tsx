// Created: 2026-02-06
// Last updated: 2026-02-07

import { useState } from 'react';
import { Mail, KeyRound, ArrowLeft, Loader2, CheckCircle, ShieldQuestion } from 'lucide-react';
import { appConfig } from '../lib/appConfig';

type Step = 'email' | 'question' | 'success';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/password-reset`;

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
  };

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'get-question', email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      if (data.question) {
        setSecurityQuestion(data.question);
        setStep('question');
      } else {
        setError(
          'No account found with this email address, or no security question was set up for this account.'
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAnswerSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'verify-answer',
          email: email.trim(),
          answer: securityAnswer,
          redirectTo: window.location.origin,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img
              src={appConfig.branding.logoIconPath}
              alt={appConfig.branding.appName}
              className="w-40 h-40 object-contain"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {step === 'email' && (
            <>
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldQuestion className="w-7 h-7 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Reset Your Password</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Enter your email address to get started
                </p>
              </div>

              {error && (
                <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleEmailSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      autoFocus
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !email.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Looking up account...
                    </>
                  ) : (
                    'Continue'
                  )}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-gray-100 text-center">
                <a
                  href="/signin"
                  className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Sign In
                </a>
              </div>
            </>
          )}

          {step === 'question' && (
            <>
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="w-7 h-7 text-amber-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Security Verification</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Answer your security question to continue
                </p>
              </div>

              {error && (
                <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleAnswerSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Security Question
                  </label>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-sm font-medium">
                    {securityQuestion}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Answer
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={securityAnswer}
                      onChange={(e) => setSecurityAnswer(e.target.value)}
                      placeholder="Enter your answer (case-insensitive)"
                      required
                      autoFocus
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !securityAnswer.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Send Reset Link'
                  )}
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-gray-100 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setError(null);
                    setSecurityAnswer('');
                  }}
                  className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Try a different email
                </button>
              </div>
            </>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>

              <h2 className="text-xl font-bold text-gray-900">Check Your Email</h2>

              <p className="text-gray-600 text-sm leading-relaxed">
                We've sent a password reset link to{' '}
                <strong className="text-gray-800">{email}</strong>. Click the link in the email to
                set a new password.
              </p>

              <p className="text-gray-500 text-xs">
                The link will expire after 1 hour. Check your spam folder if you don't see it.
              </p>

              <div className="pt-3">
                <a
                  href="/signin"
                  className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Sign In
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
