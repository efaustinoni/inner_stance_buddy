// Created: 2026-04-08
// Extracted from AuthPage.tsx.
// Owns all state, effects, validation, and submit logic for the sign-in / sign-up forms.

import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { hashSecurityAnswer, generateSalt } from '../lib/crypto';
import { detectUserTimezone } from '../lib/timezone';
import { fetchLegalManifest, setLocalAcceptance, type LegalManifest } from '../lib/legalService';

export type AuthMode = 'signin' | 'signup';

export function useAuthForm() {
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
      if (passwordRef.current) passwordRef.current.value = '';
    }
  }, [mode]);

  // Detect browser autofill — only permitted in signin mode
  useEffect(() => {
    const handleAutoFill = (e: AnimationEvent) => {
      if (e.animationName !== 'onAutoFillStart') return;
      const target = e.target as HTMLInputElement;
      if (mode !== 'signin') return;
      if (target.name === 'email' && target.value) setEmail(target.value);
      else if (target.name === 'password' && target.value) setPassword(target.value);
    };

    const emailInput = emailRef.current;
    const passwordInput = passwordRef.current;

    emailInput?.addEventListener('animationstart', handleAutoFill as EventListener);
    passwordInput?.addEventListener('animationstart', handleAutoFill as EventListener);

    const t = setTimeout(() => {
      if (mode === 'signin') {
        if (emailInput?.value && !email) setEmail(emailInput.value);
        if (passwordInput?.value && !password) setPassword(passwordInput.value);
      } else {
        if (passwordInput?.value && !password) passwordInput.value = '';
      }
    }, 500);

    return () => {
      emailInput?.removeEventListener('animationstart', handleAutoFill as EventListener);
      passwordInput?.removeEventListener('animationstart', handleAutoFill as EventListener);
      clearTimeout(t);
    };
  }, [mode, email, password]);

  const isSignupFormValid = useMemo(
    () =>
      mode !== 'signup' ||
      (fullName.trim().length > 0 &&
        timezone.trim().length > 0 &&
        email.trim().length > 0 &&
        password.length >= 6 &&
        securityQuestion.length > 0 &&
        securityAnswer.trim().length > 0 &&
        agreedToTerms),
    [mode, fullName, timezone, email, password, securityQuestion, securityAnswer, agreedToTerms]
  );

  const isSigninFormValid = useMemo(
    () => mode !== 'signin' || (email.trim().length > 0 && password.length > 0),
    [mode, email, password]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        if (!agreedToTerms) {
          setError(
            'You must agree to the Terms of Service and Privacy Policy to create an account.'
          );
          setIsLoading(false);
          return;
        }

        const salt = generateSalt();
        const hashedAnswer = await hashSecurityAnswer(securityAnswer, salt);
        const redirectUrl = `${window.location.origin}/`;

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              full_name: fullName,
              timezone,
              security_question: securityQuestion,
              security_answer_hash: hashedAnswer,
              security_answer_salt: salt,
              terms_version: legalManifest?.terms.lastUpdated || null,
              privacy_version: legalManifest?.privacy.lastUpdated || null,
              terms_version_string: legalManifest?.terms.version || null,
              privacy_version_string: legalManifest?.privacy.version || null,
              user_agent: navigator.userAgent,
            },
          },
        });

        if (signUpError) throw signUpError;

        if (signUpData.user) {
          const isNewUser = signUpData.user.identities && signUpData.user.identities.length > 0;

          if (!isNewUser) {
            setError('An account with this email already exists. Please sign in instead.');
            setIsLoading(false);
            return;
          }

          if (legalManifest) setLocalAcceptance(legalManifest);

          if (!signUpData.session) {
            setVerificationEmail(email);
            setShowVerification(true);
            setPassword('');
            setSecurityQuestion('');
            setSecurityAnswer('');
            setAgreedToTerms(false);
          } else {
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
      const msg = err instanceof Error ? err.message : 'An error occurred';
      if (msg.toLowerCase().includes('rate limit')) {
        setError(
          'Too many signup attempts. Please wait a few minutes before trying again. ' +
            'This is a security measure to prevent spam.'
        );
      } else if (msg.toLowerCase().includes('email') && msg.toLowerCase().includes('already')) {
        setError('An account with this email already exists. Please sign in instead.');
      } else if (msg.toLowerCase().includes('password')) {
        setError(
          'Password is too weak. Please use at least 6 characters with a mix of letters and numbers.'
        );
      } else if (msg.toLowerCase().includes('invalid')) {
        setError('Invalid email or password. Please check your credentials and try again.');
      } else {
        setError(msg);
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
        options: { emailRedirectTo: `${window.location.origin}/` },
      });
      if (resendError) throw resendError;
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to resend verification email';
      if (msg.toLowerCase().includes('rate limit')) {
        setError(
          'Too many resend attempts. Please wait a few minutes before trying again. ' +
            'Check your spam folder - the email may have already been delivered.'
        );
      } else {
        setError(msg);
      }
    } finally {
      setIsResending(false);
    }
  };

  const switchMode = () => {
    const next = mode === 'signin' ? 'signup' : 'signin';
    setMode(next);
    setError(null);
    setSuccessMessage(null);
    setSecurityQuestion('');
    setSecurityAnswer('');
    setShowVerification(false);
    if (next === 'signup') {
      setPassword('');
      setFullName('');
      setAgreedToTerms(false);
      if (passwordRef.current) passwordRef.current.value = '';
    }
  };

  const handleBackToSignIn = () => {
    setShowVerification(false);
    setMode('signin');
    setError(null);
    setSuccessMessage(null);
  };

  return {
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
  };
}
