// Created: 2025-12-21
// Last updated: 2026-04-08 (logic extracted to useAuthForm; verification view to VerificationScreen)

import {
  Mail,
  Lock,
  User,
  ArrowRight,
  Loader2,
  ShieldQuestion,
  KeyRound,
  ChevronDown,
  Eye,
  EyeOff,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { appConfig } from '../lib/appConfig';
import AddToHomeScreenButton from './AddToHomeScreenButton';
import TimezonePicker from './TimezonePicker';
import { VerificationScreen } from './auth/VerificationScreen';
import { useAuthForm } from '../hooks/useAuthForm';

const SECURITY_QUESTIONS = [
  'What was the name of your first pet?',
  'What city were you born in?',
  'What was your childhood nickname?',
  'What is the name of your favorite childhood friend?',
  'What was the make of your first car?',
  "What is your mother's maiden name?",
  'What was the name of your elementary school?',
  'What is the middle name of your oldest sibling?',
  'In what city did your parents meet?',
  'What was the first concert you attended?',
];

export default function AuthPage() {
  const {
    mode,
    email,
    setEmail,
    password,
    setPassword,
    fullName,
    setFullName,
    timezone,
    setTimezone,
    securityQuestion,
    setSecurityQuestion,
    securityAnswer,
    setSecurityAnswer,
    agreedToTerms,
    setAgreedToTerms,
    isLoading,
    error,
    successMessage,
    showHowItWorks,
    setShowHowItWorks,
    showPassword,
    setShowPassword,
    showVerification,
    verificationEmail,
    isResending,
    resendSuccess,
    isSignupFormValid,
    isSigninFormValid,
    emailRef,
    passwordRef,
    handleSubmit,
    handleResendVerification,
    switchMode,
    handleBackToSignIn,
  } = useAuthForm();

  if (showVerification) {
    return (
      <VerificationScreen
        verificationEmail={verificationEmail}
        error={error}
        isResending={isResending}
        resendSuccess={resendSuccess}
        onResend={handleResendVerification}
        onBack={handleBackToSignIn}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img
              src={appConfig.branding.logoIconPath}
              alt={appConfig.branding.appName}
              className="w-56 h-56"
            />
          </div>
          <p className="text-gray-600 mb-4">
            {mode === 'signin' ? 'Sign in to your account' : 'Create an account to get started'}
          </p>
          <div className="bg-white/80 rounded-xl text-left text-sm text-gray-600 border border-gray-100 shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={() => setShowHowItWorks(!showHowItWorks)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-800">How it works</span>
              <ChevronDown
                className={`w-4 h-4 text-gray-500 transition-transform ${showHowItWorks ? 'rotate-180' : ''}`}
              />
            </button>
            {showHowItWorks && (
              <ul className="px-4 pb-4 space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold mt-0.5">1.</span>After completing your
                  exercises in your Inner Stance platform you can upload them here for a full
                  overview.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold mt-0.5">2.</span>Optionally add more
                  actions or reflections from the call directly in this app.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold mt-0.5">3.</span>Track daily habits —
                  check off exercises every day and add notes.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold mt-0.5">4.</span>Organise everything by
                  quarter so each period of the program has its own space.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold mt-0.5">5.</span>Your answers are
                  encrypted — only you can read them.
                </li>
              </ul>
            )}
          </div>
        </div>

        <div className="mb-6">
          <AddToHomeScreenButton />
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {error && (
            <div
              className={`mb-6 p-4 rounded-lg text-sm flex items-start gap-3 ${
                error.toLowerCase().includes('rate limit') || error.toLowerCase().includes('wait')
                  ? 'bg-amber-50 border border-amber-200 text-amber-800'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              {error.toLowerCase().includes('rate limit') ||
              error.toLowerCase().includes('wait') ? (
                <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <span className="flex-1">{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name"
                      required
                      autoFocus
                      autoComplete="off"
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    />
                  </div>
                </div>

                <TimezonePicker
                  value={timezone}
                  onChange={setTimezone}
                  label="Your Location / Timezone"
                  helperText="This will be your default timezone when creating polls"
                />
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  ref={emailRef}
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete={mode === 'signup' ? 'off' : 'email'}
                  autoFocus={mode === 'signin'}
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  ref={passwordRef}
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    mode === 'signup'
                      ? 'Create a password (min 6 characters)'
                      : 'Enter your password'
                  }
                  required
                  minLength={6}
                  autoComplete={mode === 'signup' ? 'off' : 'current-password'}
                  className={`w-full pl-11 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none ${
                    mode === 'signup' && password.length > 0 && password.length < 6
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {mode === 'signup' && password.length > 0 && password.length < 6 && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">
                  Password must be at least 6 characters ({password.length}/6)
                </p>
              )}
              {mode === 'signin' && (
                <div className="mt-2 text-right">
                  <a
                    href="/forgot-password"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    Forgot password?
                  </a>
                </div>
              )}
            </div>

            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Security Question
                  </label>
                  <div className="relative">
                    <ShieldQuestion className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      value={securityQuestion}
                      onChange={(e) => setSecurityQuestion(e.target.value)}
                      required
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none appearance-none bg-white"
                    >
                      <option value="">Select a security question</option>
                      {SECURITY_QUESTIONS.map((question) => (
                        <option key={question} value={question}>
                          {question}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="mt-1.5 text-xs text-gray-500">
                    Used to verify your identity if you forget your password
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Security Answer
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={securityAnswer}
                      onChange={(e) => setSecurityAnswer(e.target.value)}
                      placeholder="Your answer (case-insensitive)"
                      required
                      autoComplete="off"
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            {mode === 'signup' ? (
              <div className="flex items-start gap-3">
                <div className="flex items-center h-5 mt-0.5">
                  <input
                    id="terms-agreement"
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                </div>
                <label
                  htmlFor="terms-agreement"
                  className="text-sm text-gray-600 cursor-pointer leading-tight"
                >
                  I agree to the{' '}
                  <a
                    href="/terms"
                    target="_blank"
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a
                    href="/privacy"
                    target="_blank"
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    Privacy Policy
                  </a>
                </label>
              </div>
            ) : (
              <p className="text-sm text-gray-600 text-center">
                By using this service you agree with our{' '}
                <a
                  href="/terms"
                  target="_blank"
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  Terms of Service
                </a>{' '}
                and{' '}
                <a
                  href="/privacy"
                  target="_blank"
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  Privacy Policy
                </a>
              </p>
            )}

            {mode === 'signup' && !isSignupFormValid && (
              <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="font-medium mb-1">Please complete all required fields:</p>
                <ul className="space-y-0.5 text-xs">
                  {!fullName.trim() && <li>• Enter your full name</li>}
                  {!timezone.trim() && <li>• Select your timezone</li>}
                  {!email.trim() && <li>• Enter your email address</li>}
                  {password.length < 6 && <li>• Password must be at least 6 characters</li>}
                  {!securityQuestion && <li>• Select a security question</li>}
                  {!securityAnswer.trim() && <li>• Enter your security answer</li>}
                  {!agreedToTerms && <li>• Agree to Terms of Service and Privacy Policy</li>}
                </ul>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || (mode === 'signup' ? !isSignupFormValid : !isSigninFormValid)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{mode === 'signin' ? 'Signing in...' : 'Creating account...'}</span>
                </>
              ) : (
                <>
                  <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-gray-600">
              {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
              <button
                type="button"
                onClick={switchMode}
                className="ml-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
