// Created: 2025-12-21
// Last updated: 2026-02-13

import { useState, useEffect, useMemo, useRef } from 'react';
import { Mail, Lock, User, ArrowRight, Loader2, ShieldQuestion, KeyRound, ChevronDown, Eye, EyeOff, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { appConfig } from '../lib/appConfig';
import { hashSecurityAnswer } from '../lib/crypto';
import { detectUserTimezone } from '../lib/timezone';
import { fetchLegalManifest, setLocalAcceptance, type LegalManifest } from '../lib/legalService';
import AddToHomeScreenButton from './AddToHomeScreenButton';
import TimezonePicker from './TimezonePicker';

type AuthMode = 'signin' | 'signup';

const SECURITY_QUESTIONS = [
  'What was the name of your first pet?',
  'What city were you born in?',
  'What was your childhood nickname?',
  'What is the name of your favorite childhood friend?',
  'What was the make of your first car?',
  'What is your mother\'s maiden name?',
  'What was the name of your elementary school?',
  'What is the middle name of your oldest sibling?',
  'In what city did your parents meet?',
  'What was the first concert you attended?',
];

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [timezone, setTimezone] = useState(detectUserTimezone());
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [legalManifest, setLegalManifest] = useState<LegalManifest | null>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchLegalManifest().then(setLegalManifest);
  }, []);

  // Clear password field when switching to signup mode for security
  useEffect(() => {
    if (mode === 'signup') {
      setPassword('');
      if (passwordRef.current) {
        passwordRef.current.value = '';
      }
    }
  }, [mode]);

  useEffect(() => {
    const handleAutoFill = (e: AnimationEvent) => {
      if (e.animationName === 'onAutoFillStart') {
        const target = e.target as HTMLInputElement;
        // Only allow autofill in signin mode
        if (mode === 'signin') {
          if (target.name === 'email' && target.value) {
            setEmail(target.value);
          } else if (target.name === 'password' && target.value) {
            setPassword(target.value);
          }
        }
      }
    };

    const emailInput = emailRef.current;
    const passwordInput = passwordRef.current;

    if (emailInput) {
      emailInput.addEventListener('animationstart', handleAutoFill as EventListener);
    }
    if (passwordInput) {
      passwordInput.addEventListener('animationstart', handleAutoFill as EventListener);
    }

    const checkAutoFillTimeout = setTimeout(() => {
      // Only allow autofill detection in signin mode
      if (mode === 'signin') {
        if (emailInput?.value && !email) {
          setEmail(emailInput.value);
        }
        if (passwordInput?.value && !password) {
          setPassword(passwordInput.value);
        }
      } else {
        // Clear any autofilled values in signup mode
        if (passwordInput?.value && !password) {
          passwordInput.value = '';
        }
      }
    }, 500);

    return () => {
      if (emailInput) {
        emailInput.removeEventListener('animationstart', handleAutoFill as EventListener);
      }
      if (passwordInput) {
        passwordInput.removeEventListener('animationstart', handleAutoFill as EventListener);
      }
      clearTimeout(checkAutoFillTimeout);
    };
  }, [mode, email, password]);

  const isSignupFormValid = useMemo(() => {
    if (mode !== 'signup') return true;
    return (
      fullName.trim().length > 0 &&
      timezone.trim().length > 0 &&
      email.trim().length > 0 &&
      password.length >= 6 &&
      securityQuestion.length > 0 &&
      securityAnswer.trim().length > 0 &&
      agreedToTerms
    );
  }, [mode, fullName, timezone, email, password, securityQuestion, securityAnswer, agreedToTerms]);

  const isSigninFormValid = useMemo(() => {
    if (mode !== 'signin') return true;
    return email.trim().length > 0 && password.length > 0;
  }, [mode, email, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        if (!agreedToTerms) {
          setError('You must agree to the Terms of Service and Privacy Policy to create an account.');
          setIsLoading(false);
          return;
        }

        const hashedAnswer = await hashSecurityAnswer(securityAnswer);

        const redirectUrl = `${window.location.origin}/`;

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              full_name: fullName,
              timezone: timezone,
              security_question: securityQuestion,
              security_answer_hash: hashedAnswer,
              terms_version: legalManifest?.terms.lastUpdated || null,
              privacy_version: legalManifest?.privacy.lastUpdated || null,
              terms_version_string: legalManifest?.terms.version || null,
              privacy_version_string: legalManifest?.privacy.version || null,
              user_agent: navigator.userAgent,
            },
          },
        });

        if (signUpError) throw signUpError;

        // Check if user already exists (Supabase returns user but with identities array empty)
        if (signUpData.user) {
          // If identities is empty or undefined, it means the user already exists
          const isNewUser = signUpData.user.identities && signUpData.user.identities.length > 0;

          if (!isNewUser) {
            // User already exists - show error and suggest sign in
            setError('An account with this email already exists. Please sign in instead.');
            setIsLoading(false);
            return;
          }

          if (legalManifest) {
            setLocalAcceptance(legalManifest);
          }

          // Check if email confirmation is required
          const session = signUpData.session;
          if (!session) {
            // Email confirmation is enabled, show verification screen
            setVerificationEmail(email);
            setShowVerification(true);
            setPassword('');
            setSecurityQuestion('');
            setSecurityAnswer('');
            setAgreedToTerms(false);
          } else {
            // Email confirmation is disabled, user is automatically signed in
            window.location.href = '/';
          }
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        window.location.href = '/';
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';

      // Provide user-friendly error messages
      if (errorMessage.toLowerCase().includes('rate limit')) {
        setError(
          'Too many signup attempts. Please wait a few minutes before trying again. ' +
          'This is a security measure to prevent spam.'
        );
      } else if (errorMessage.toLowerCase().includes('email') && errorMessage.toLowerCase().includes('already')) {
        setError('An account with this email already exists. Please sign in instead.');
      } else if (errorMessage.toLowerCase().includes('password')) {
        setError('Password is too weak. Please use at least 6 characters with a mix of letters and numbers.');
      } else if (errorMessage.toLowerCase().includes('invalid')) {
        setError('Invalid email or password. Please check your credentials and try again.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };


  const handleResendVerification = async () => {
    setIsResending(true);
    setError(null);
    setResendSuccess(false);

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: verificationEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (resendError) throw resendError;

      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend verification email';

      if (errorMessage.toLowerCase().includes('rate limit')) {
        setError(
          'Too many resend attempts. Please wait a few minutes before trying again. ' +
          'Check your spam folder - the email may have already been delivered.'
        );
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsResending(false);
    }
  };

  const switchMode = () => {
    const newMode = mode === 'signin' ? 'signup' : 'signin';
    setMode(newMode);
    setError(null);
    setSuccessMessage(null);
    setSecurityQuestion('');
    setSecurityAnswer('');
    setShowVerification(false);

    // Clear password when switching to signup for security
    if (newMode === 'signup') {
      setPassword('');
      setFullName('');
      setAgreedToTerms(false);

      // Clear browser autofill values
      if (passwordRef.current) {
        passwordRef.current.value = '';
      }
    }
  };

  const handleBackToSignIn = () => {
    setShowVerification(false);
    setMode('signin');
    setError(null);
    setSuccessMessage(null);
  };

  if (showVerification) {
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
                <strong className="text-gray-800">{verificationEmail}</strong>.
                Please check your inbox and click the link to activate your account.
              </p>

              <p className="text-gray-500 text-xs">
                The link will expire after 24 hours. Check your spam folder if you don't see it.
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
                  onClick={handleResendVerification}
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
                  onClick={handleBackToSignIn}
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
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showHowItWorks ? 'rotate-180' : ''}`} />
            </button>
            {showHowItWorks && (
              <ul className="px-4 pb-4 space-y-1.5">
              </ul>
            )}
          </div>
        </div>

        <div className="mb-6">
          <AddToHomeScreenButton />
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {error && (
            <div className={`mb-6 p-4 rounded-lg text-sm flex items-start gap-3 ${
              error.toLowerCase().includes('rate limit') || error.toLowerCase().includes('wait')
                ? 'bg-amber-50 border border-amber-200 text-amber-800'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {error.toLowerCase().includes('rate limit') || error.toLowerCase().includes('wait') ? (
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  ref={passwordRef}
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Create a password (min 6 characters)' : 'Enter your password'}
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
                  aria-label={showPassword ? "Hide password" : "Show password"}
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
                <label htmlFor="terms-agreement" className="text-sm text-gray-600 cursor-pointer leading-tight">
                  I agree to the{' '}
                  <a href="/terms" target="_blank" className="text-blue-600 hover:text-blue-700 underline">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" target="_blank" className="text-blue-600 hover:text-blue-700 underline">
                    Privacy Policy
                  </a>
                </label>
              </div>
            ) : (
              <p className="text-sm text-gray-600 text-center">
                By using this service you agree with our{' '}
                <a href="/terms" target="_blank" className="text-blue-600 hover:text-blue-700 underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" target="_blank" className="text-blue-600 hover:text-blue-700 underline">
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
